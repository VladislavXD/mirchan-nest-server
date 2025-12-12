import { Controller, Get, Put, Delete, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ChatService } from './chat.service';
import { GetMessagesDto } from './dto/chat.dto';
import { Authorization } from 'src/auth/decorators/auth.decorator';
import { Authorized } from 'src/auth/decorators/authorized.decorator';

@Controller('chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * GET /chats
   * Получить список всех чатов пользователя
   */
  @Authorization()
  @HttpCode(HttpStatus.OK)
  @Get()
  async getUserChats(@Authorized('id') userId: string) {
    return this.chatService.getUserChats(userId);
  }

  /**
   * GET /chats/:otherUserId
   * Получить или создать чат с пользователем
   */
  @Authorization()
  @HttpCode(HttpStatus.OK)
  @Get(':otherUserId')
  async getOrCreateChat(
    @Authorized('id') userId: string,
    @Param('otherUserId') otherUserId: string
  ) {
    return this.chatService.getOrCreateChat(userId, otherUserId);
  }

  /**
   * GET /chats/:chatId/messages
   * Получить сообщения чата с пагинацией
   */
  @Authorization()
  @HttpCode(HttpStatus.OK)
  @Get(':chatId/messages')
  async getChatMessages(
    @Authorized('id') userId: string,
    @Param('chatId') chatId: string,
    @Query() query: GetMessagesDto
  ) {
    return this.chatService.getChatMessages(
      userId,
      chatId,
      query.page,
      query.limit
    );
  }

  /**
   * PUT /chats/:chatId/read
   * Отметить сообщения как прочитанные
   */
  @Authorization()
  @HttpCode(HttpStatus.OK)
  @Put(':chatId/read')
  async markMessagesAsRead(
    @Authorized('id') userId: string,
    @Param('chatId') chatId: string
  ) {
    return this.chatService.markMessagesAsRead(userId, chatId);
  }

  /**
   * DELETE /chats/:chatId
   * Удалить чат
   */
  @Authorization()
  @HttpCode(HttpStatus.OK)
  @Delete(':chatId')
  async deleteChat(
    @Authorized('id') userId: string,
    @Param('chatId') chatId: string
  ) {
    return this.chatService.deleteChat(userId, chatId);
  }
}
