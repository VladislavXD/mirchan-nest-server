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
        replies: this.repliesInclude(3)
      },
      orderBy: { createdAt: 'desc' }
    })

    return comments.map(c => this.transformComment(c, currentUserId));
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
    const replies = await this.prisma.comment.findMany({
      where: { replyToId: commentId },
      include: this.commentInclude(),
      orderBy: { createdAt: 'asc' }
    })

    return replies.map(c => this.transformComment(c, currentUserId));
  }


  public async getNewComments(postId: string, cursor?: string, userId?: string){ 
		return this.prisma.comment.findMany({
			where: { postId, replyToId: null },
			orderBy: { createdAt: 'desc' },
			take: 30,
			include: this.commentInclude(),
			...(cursor && { cursor: { id: cursor }, skip: 1 })
		}).then(comments => comments.map(c => this.transformComment(c, userId)))
	}

	public async getOldComments(postId: string, cursor?: string, userId?: string){ 
		return this.prisma.comment.findMany({
			where: { postId, replyToId: null },
			orderBy: { createdAt: 'asc' },
			take: 30,
			include: this.commentInclude(),
			...(cursor && { cursor: { id: cursor }, skip: 1 })
		}).then(comments => comments.map(c => this.transformComment(c, userId)))
	}

	public async getPopularComments(postId: string, cursor?: string, userId?: string){ 
		return this.prisma.comment.findMany({
			where: { postId, replyToId: null },
			orderBy: { score: 'desc' },
			take: 30,
			include: this.commentInclude(),
			...(cursor && { cursor: { id: cursor }, skip: 1 })
		}).then(comments => comments.map(c => this.transformComment(c, userId)))
	}

	private userSelect = {
		select: { id: true, name: true, username: true, avatarUrl: true }
	}

	private repliesInclude(depth: number): any {
		if (depth === 0) return false
		return {
			include: {
				user: this.userSelect,
				likes: { select: { id: true, userId: true } },
				replies: this.repliesInclude(depth - 1),
			},
			orderBy: { createdAt: 'asc' as const }
		}
	}

	private commentInclude() {
		return {
			user: this.userSelect,
			likes: { select: { id: true, userId: true } },
			replies: this.repliesInclude(3),
		}
	}

	private transformComment(comment: any, userId?: string): any {
		return {
			...comment,
			likeCount: comment.likes?.length ?? 0,
			likedByUser: userId ? comment.likes?.some((l: any) => l.userId === userId) ?? false : false,
			replies: comment.replies?.map((r: any) => this.transformComment(r, userId)) ?? [],
		}
	}
}