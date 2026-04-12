import { Injectable, NotFoundException, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ChatType } from '@prisma/client';

@Injectable()
export class ChatService {
  private readonly socketServiceUrl: string;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService
  ) {
    this.socketServiceUrl = this.configService.get<string>('SOCKET_SERVICE_URL') || 'http://localhost:3002';
  }

  /**
   * Получить список всех чатов пользователя
   * @param userId - ID текущего пользователя
   * @returns Список чатов с информацией о собеседниках и непрочитанных сообщениях
   */
  async getUserChats(userId: string) {
    try {
      const chats = await this.prismaService.chat.findMany({
        where: {
          type: ChatType.DIRECT,
          participants: {
            some: { id: userId }
          }
        },
        include: {
          messages: {
            take: 1,
            orderBy: {
              createdAt: 'desc'
            }
          },
          participants: true,
        },
        orderBy: {
          lastMessageAt: 'desc'
        }
      });

      // Получаем информацию о собеседниках
      const chatsWithParticipants = await Promise.all(
        chats.map(async (chat) => {
          // Находим собеседника (не текущего пользователя)
          const otherParticipantId  = chat.participants.find(user => user.id !== userId);

          const { id: ParticipantId } = otherParticipantId || {};
          let otherParticipant: any = null;
          if (otherParticipantId) {
            otherParticipant = await this.prismaService.user.findUnique({
              where: { id: ParticipantId },
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
                bio: true,
                lastSeen: true
              }
            });
          }

          // Подсчитываем непрочитанные сообщения
          const unreadCount = await this.prismaService.message.count({
            where: {
              chatId: chat.id,
              senderId: { not: userId },
              isRead: false
            }
          });

          return {
            ...chat,
            otherParticipant,
            unreadCount,
            isOnline: false // Будет обновлено ниже
          };
        })
      );

      // Получаем статусы онлайн из socket service
      try {
        const userIds = chatsWithParticipants
          .map((chat: any) => chat.otherParticipant?.id)
          .filter(Boolean);

        if (userIds.length > 0) {
          const statusResponse = await axios.post(
            `${this.socketServiceUrl}/users/status/bulk`,
            { userIds },
            { timeout: 2000 }
          );

          const onlineStatuses = statusResponse.data.statuses;

          // Обновляем isOnline в чатах
          chatsWithParticipants.forEach((chat: any) => {
            if (chat.otherParticipant?.id) {
              chat.isOnline = onlineStatuses[chat.otherParticipant.id] || false;
            }
          });
        }
      } catch (error) {
        console.error('Failed to fetch online statuses from socket service:', error.message);
        // Продолжаем работу даже если socket service недоступен
      }

      return chatsWithParticipants;
    } catch (error) {
      console.error('Error getting user chats:', error);
      throw new HttpException('Ошибка получения чатов', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Получить или создать чат с пользователем
   * @param userId - ID текущего пользователя
   * @param otherUserId - ID собеседника
   * @returns Чат с сообщениями и информацией о собеседнике
   */
  async getOrCreateChat(userId: string, targetUserId: string) {
    try {
      if (userId === targetUserId) {
        throw new BadRequestException('Нельзя создать чат с самим собой');
      }

      // Проверяем, существует ли пользователь
      const otherUser = await this.prismaService.user.findUnique({
        where: { id: targetUserId },
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          bio: true,
          lastSeen: true
        }
      });

      if (!otherUser) {
        throw new NotFoundException('Пользователь не найден');
      }

      // Ищем существующий чат между пользователями (теперь participants это массив объектов)
      let chat = await this.prismaService.chat.findFirst({
        where: {
          type: ChatType.DIRECT,
          AND: [
            { participants: { some: { id: userId } } },
            { participants: { some: { id: targetUserId } } }
          ]
        },
        include: {
          messages: {
            orderBy: {
              createdAt: 'desc'
            },
            take: 50 // Последние 50 сообщений
          }
        }
      });

      // Если чат не существует, создаем новый
      if (!chat) {
        chat = await this.prismaService.chat.create({
          data: {
            type: 'DIRECT',
            participants: {
              connect: [{id: userId}, {id: targetUserId}] 
            }
          },
          include: {
            messages: true,
            participants: true
          }
        });
      }

      // Подсчитываем непрочитанные сообщения
      const unreadCount = await this.prismaService.message.count({
        where: {
          chatId: chat?.id,
          senderId: { not: userId },
          isRead: false
        }
      });

      // Получаем информацию об отправителях сообщений
      const messagesWithSenders = await Promise.all(
        chat.messages.map(async (message) => {
          const sender = await this.prismaService.user.findUnique({
            where: { id: message.senderId },
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              bio: true
            }
          });
          return {
            ...message,
            sender
          };
        })
      );

      // Получаем статус онлайн из socket service
      let isOnline = false;
      try {
        const statusResponse = await axios.get(
          `${this.socketServiceUrl}/users/${otherUser.id}/status`,
          { timeout: 2000 }
        );
        isOnline = statusResponse.data.isOnline;
      } catch (error) {
        console.error('Failed to fetch online status from socket service:', error.message);
      }

      return {
        ...chat,
        messages: messagesWithSenders.reverse(), // Сортируем по возрастанию (старые сначала)
        otherParticipant: otherUser,
        unreadCount,
        isOnline
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error getting or creating chat:', error);
      throw new HttpException('Ошибка создания/получения чата', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Получить сообщения чата с пагинацией
   * @param userId - ID текущего пользователя
   * @param chatId - ID чата
   * @param page - Номер страницы
   * @param limit - Количество сообщений на странице
   * @returns Сообщения с информацией о пагинации
   */
  async getChatMessages(userId: string, chatId: string, page: number = 1, limit: number = 50) {
    try {
      const skip = (page - 1) * limit;

      // Проверяем, что пользователь участник чата
      const chat = await this.prismaService.chat.findFirst({
        where: {
          id: chatId,
          participants: {
            some: { id: userId }
          }
        }
      });

      if (!chat) {
        throw new NotFoundException('Чат не найден или доступ запрещен');
      }

      // Получаем сообщения с пагинацией
      const messages = await this.prismaService.message.findMany({
        where: {
          chatId
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      });

      // Получаем информацию об отправителях
      const messagesWithSenders = await Promise.all(
        messages.map(async (message) => {
          const sender = await this.prismaService.user.findUnique({
            where: { id: message.senderId },
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              bio: true
            }
          });
          return {
            ...message,
            sender
          };
        })
      );

      // Возвращаем в правильном порядке (старые сначала)
      return {
        messages: messagesWithSenders.reverse(),
        pagination: {
          page,
          limit,
          hasMore: messages.length === limit
        }
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error getting chat messages:', error);
      throw new HttpException('Ошибка получения сообщений', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Отметить сообщения как прочитанные
   * @param userId - ID текущего пользователя
   * @param chatId - ID чата
   * @returns Количество обновленных сообщений
   */
  async markMessagesAsRead(userId: string, chatId: string) {
    try {
      // Проверяем, что пользователь участник чата
      const chat = await this.prismaService.chat.findFirst({
        where: {
          id: chatId,
          participants: {
            some: { id: userId }
          }
        }
      });

      if (!chat) {
        throw new NotFoundException('Чат не найден или доступ запрещен');
      }

      // Отмечаем все непрочитанные сообщения как прочитанные
      const updatedMessages = await this.prismaService.message.updateMany({
        where: {
          chatId,
          senderId: { not: userId },
          isRead: false
        },
        data: {
          isRead: true
        }
      });

      // Отправляем уведомление через Socket Service о прочтении сообщений
      if (updatedMessages.count > 0) {
        try {
          await axios.post(`${this.socketServiceUrl}/api/notify/messages-read`, {
            chatId,
            readerId: userId,
            messageCount: updatedMessages.count
          }, {
            timeout: 5000
          });
          console.log(`📨 Notified Socket Service: ${userId} read ${updatedMessages.count} messages in chat ${chatId}`);
        } catch (socketError) {
          console.error('Failed to notify Socket Service about messages read:', socketError.message);
          // Не прерываем операцию из-за ошибки уведомления
        }
      }

      return {
        message: 'Сообщения отмечены как прочитанные',
        count: updatedMessages.count
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error marking messages as read:', error);
      throw new HttpException('Ошибка обновления сообщений', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Удалить чат
   * @param userId - ID текущего пользователя
   * @param chatId - ID чата
   */
  async deleteChat(userId: string, chatId: string) {
    try {
      // Проверяем, что пользователь участник чата
      const chat = await this.prismaService.chat.findFirst({
        where: {
          id: chatId,
          participants: {
            some: {id: userId}
          }
        }
      });

      if (!chat) {
        throw new NotFoundException('Чат не найден или доступ запрещен');
      }

      // Удаляем чат (сообщения удалятся автоматически благодаря onDelete: Cascade)
      await this.prismaService.chat.delete({
        where: { id: chatId }
      });

      return {
        message: 'Чат успешно удален'
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error deleting chat:', error);
      throw new HttpException('Ошибка удаления чата', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
