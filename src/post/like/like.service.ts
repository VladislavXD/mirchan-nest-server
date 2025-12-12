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
}
