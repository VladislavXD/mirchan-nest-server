import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { CreateCommentDto } from './dto/create-comment.dto'
import { PrismaService } from 'src/prisma/prisma.service'

@Injectable()
export class CommentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateCommentDto) {
    const { postId, content } = dto
    return this.prisma.comment.create({
      data: { postId, userId, content },
    })
  }

  async remove(id: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id } })
    if (!comment) throw new NotFoundException('Комментарий не найден')
    if (comment.userId !== userId) throw new ForbiddenException('Нет доступа')
    await this.prisma.comment.delete({ where: { id } })
    return comment
  }

  /**
   * Получить комментарии поста с информацией о лайках и ответах (рекурсивно)
   */
  async getPostComments(postId: string, currentUserId?: string) {
    // Вспомогательная функция для рекурсивной загрузки ответов
    const includeReplies = (depth: number = 3): any => {
      if (depth === 0) return false;
      
      return {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              avatarUrl: true
            }
          },
          likes: {
            select: {
              id: true,
              userId: true
            }
          },
          replies: depth > 1 ? includeReplies(depth - 1) : false
        },
        orderBy: { createdAt: 'asc' }
      };
    };

    const comments = await this.prisma.comment.findMany({
      where: { 
        postId,
        replyToId: null // Получаем только основные комментарии (не ответы)
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true
          }
        },
        likes: {
          select: {
            id: true,
            userId: true
          }
        },
        replies: includeReplies(3) // Загружаем ответы до 3 уровней глубины
      },
      orderBy: { createdAt: 'desc' }
    })

    // Рекурсивная функция для преобразования комментария с ответами
    const transformComment = (comment: any): any => ({
      ...comment,
      likeCount: comment.likes.length,
      likedByUser: currentUserId ? comment.likes.some((like: any) => like.userId === currentUserId) : false,
      replies: comment.replies?.map((reply: any) => transformComment(reply)) || []
    });

    // Добавляем информацию о том, лайкнул ли текущий пользователь
    return comments.map(transformComment);
  }

  /**
   * Создать ответ на комментарий
   */
  async createReply(userId: string, dto: CreateCommentDto & { replyToId: string }) {
    const { postId, content, replyToId } = dto

    // Проверяем, существует ли родительский комментарий
    const parentComment = await this.prisma.comment.findUnique({
      where: { id: replyToId }
    })

    if (!parentComment) {
      throw new NotFoundException('Комментарий не найден')
    }

    return this.prisma.comment.create({
      data: { 
        postId, 
        userId, 
        content,
        replyToId 
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true
          }
        },
        likes: true
      }
    })
  }
  
  /**
   * Получить ответы на комментарий
   */
  async getCommentReplies(commentId: string, currentUserId?: string) {
    // Вспомогательная функция для рекурсивной загрузки ответов
    const includeReplies = (depth: number = 3): any => {
      if (depth === 0) return false;
      
      return {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              avatarUrl: true
            }
          },
          likes: {
            select: {
              id: true,
              userId: true
            }
          },
          replies: depth > 1 ? includeReplies(depth - 1) : false
        },
        orderBy: { createdAt: 'asc' }
      };
    };

    const replies = await this.prisma.comment.findMany({
      where: { replyToId: commentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true
          }
        },
        likes: {
          select: {
            id: true,
            userId: true
          }
        },
        replies: includeReplies(3) // Загружаем ответы до 3 уровней глубины
      },
      orderBy: { createdAt: 'asc' }
    })

    // Рекурсивная функция для преобразования комментария с ответами
    const transformComment = (comment: any): any => ({
      ...comment,
      likeCount: comment.likes.length,
      likedByUser: currentUserId ? comment.likes.some((like: any) => like.userId === currentUserId) : false,
      replies: comment.replies?.map((reply: any) => transformComment(reply)) || []
    });

    return replies.map(transformComment);
  }
}
