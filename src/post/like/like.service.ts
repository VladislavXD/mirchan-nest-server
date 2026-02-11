import {
	BadRequestException,
	Injectable,
	NotFoundException
} from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { CreateLikeDto } from './dto/create-like.dto'

@Injectable()
export class LikeService {
	constructor(private readonly prisma: PrismaService) {}

	/**
	 * Поставить лайк на пост
	 * ОПТИМИЗИРОВАНО: Использование upsert для избежания race condition
	 */
	async likePost(userId: string, dto: CreateLikeDto) {
		const { postId } = dto

		try {
			// Используем upsert вместо findFirst + create
			// Это атомарная операция, защищающая от race condition
			const like = await this.prisma.like.upsert({
				where: {
					userId_postId: { // Используем составной уникальный индекс
						userId,
						postId
					}
				},
				update: {}, // Если лайк уже есть, ничего не делаем
				create: {
					userId,
					postId
				}
			})

			return like
		} catch (err) {
			// Проверяем, существует ли пост
			const post = await this.prisma.post.findUnique({
				where: { id: postId },
				select: { id: true }
			})

			if (!post) {
				throw new NotFoundException('Пост не найден')
			}

			// Если ошибка не в том, что пост не найден, пробрасываем дальше
			console.error('Like post error:', err)
			throw new BadRequestException('Ошибка при постановке лайка')
		}
	}

	/**
	 * Убрать лайк с поста
	 * ОПТИМИЗИРОВАНО: Используем deleteMany для одного запроса
	 */
	async unlikePost(userId: string, postId: string) {
		try {
			// Используем deleteMany вместо findFirst + delete
			// Это один запрос вместо двух
			const result = await this.prisma.like.deleteMany({
				where: {
					postId,
					userId
				}
			})

			// Если ничего не удалено, значит лайка не было
			if (result.count === 0) {
				throw new BadRequestException('Лайк не найден')
			}

			return { message: 'Лайк успешно удален', count: result.count }
		} catch (err) {
			if (err instanceof BadRequestException) {
				throw err
			}
			console.error('Unlike post error:', err)
			throw new BadRequestException('Ошибка при снятии лайка')
		}
	}


	/**
	 * Поставить лайк на комментарий
	 * ОПТИМИЗИРОВАНО: Использование upsert для избежания race condition
	 */
	async likeComment(userId: string, commentId: string) {
		try {
			// Используем upsert для атомарной операции
			const like = await this.prisma.like.upsert({
				where: {
					userId_commentId: { // Используем составной уникальный индекс
						userId,
						commentId
					}
				},
				update: {}, // Если лайк уже есть, ничего не делаем
				create: {
					userId,
					commentId
				}
			})

			return like
		} catch (err) {
			// Проверяем, существует ли комментарий
			const comment = await this.prisma.comment.findUnique({
				where: { id: commentId },
				select: { id: true }
			})

			if (!comment) {
				throw new NotFoundException('Комментарий не найден')
			}

			// Если ошибка не в том, что комментарий не найден, пробрасываем дальше
			console.error('Like comment error:', err)
			throw new BadRequestException('Ошибка при постановке лайка на комментарий')
		}
	}

	/**
	 * Убрать лайк с комментария
	 * ОПТИМИЗИРОВАНО: Используем deleteMany для одного запроса
	 */
	async unlikeComment(userId: string, commentId: string) {
		try {
			// Используем deleteMany вместо findFirst + delete
			const result = await this.prisma.like.deleteMany({
				where: {
					commentId,
					userId
				}
			})

			// Если ничего не удалено, значит лайка не было
			if (result.count === 0) {
				throw new BadRequestException('Лайк не найден')
			}

			return { message: 'Лайк успешно удален', count: result.count }
		} catch (err) {
			if (err instanceof BadRequestException) {
				throw err
			}
			console.error('Unlike comment error:', err)
			throw new BadRequestException('Ошибка при снятии лайка с комментария')
		}
	}

	/**
	 * Получить количество лайков комментария
	 */
	async getCommentLikesCount(commentId: string): Promise<number> {
		return this.prisma.like.count({
			where: { commentId }
		})
	}

	/**
	 * Проверить, лайкнул ли пользователь комментарий
	 */
	async isCommentLikedByUser(userId: string, commentId: string): Promise<boolean> {
		const like = await this.prisma.like.findUnique({
			where: {
				userId_commentId: {
					userId,
					commentId
				}
			}
		})

		return !!like
	}
}
