import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { RedisService } from '../../redis/redis.service'
import { PrismaService } from '../../prisma/prisma.service'

/**
 * Сервис для периодической синхронизации просмотров из Redis в PostgreSQL.
 * 
 * Запускается по расписанию для обеспечения консистентности данных.
 */
@Injectable()
export class ViewsSyncService {
	private readonly logger = new Logger(ViewsSyncService.name)

	constructor(
		private readonly redis: RedisService,
		private readonly prisma: PrismaService
	) {}

	/**
	 * Синхронизирует все просмотры из Redis в БД.
	 * Запускается каждые 5 минут.
	 */
	@Cron(CronExpression.EVERY_5_MINUTES)
	async syncViewsToDatabase() {
		this.logger.log('Starting views synchronization from Redis to PostgreSQL...')

		try {
			// Получаем все postId с просмотрами в Redis
			const postIds = await this.redis.getAllViewKeys()

			if (postIds.length === 0) {
				this.logger.log('No views to sync')
				return
			}

			this.logger.log(`Found ${postIds.length} posts with views in Redis`)

			let syncedCount = 0
			let errorCount = 0

			// Синхронизируем каждый пост
			for (const postId of postIds) {
				try {
					await this.syncSinglePost(postId)
					syncedCount++
				} catch (error) {
					this.logger.error(`Failed to sync post ${postId}:`, error)
					errorCount++
				}
			}

			this.logger.log(
				`Sync completed: ${syncedCount} successful, ${errorCount} errors`
			)
		} catch (error) {
			this.logger.error('Error during views synchronization:', error)
		}
	}

	/**
	 * Синхронизирует просмотры одного поста.
	 * 
	 * @param postId - ID поста
	 */
	private async syncSinglePost(postId: string): Promise<void> {
		// Получаем просмотры из Redis
		const redisViewers = await this.redis.getViewers(postId)

		if (redisViewers.length === 0) {
			return
		}

		// Получаем пост из БД
		const post = await this.prisma.post.findUnique({
			where: { id: postId },
			select: { views: true }
		})

		if (!post) {
			// Пост удалён, очищаем Redis
			await this.redis.deleteViews(postId)
			this.logger.warn(`Post ${postId} not found in DB, cleared from Redis`)
			return
		}

		// Находим новые просмотры (те, которых нет в БД)
		const newViewers = redisViewers.filter(
			viewerId => !post.views.includes(viewerId)
		)

		if (newViewers.length === 0) {
			this.logger.debug(`Post ${postId} is already in sync`)
			return
		}

		// Обновляем БД
		await this.prisma.post.update({
			where: { id: postId },
			data: {
				views: [...post.views, ...newViewers]
			}
		})

		this.logger.debug(
			`Synced ${newViewers.length} new views for post ${postId}`
		)
	}

	/**
	 * Ручная синхронизация (для вызова через API или при необходимости).
	 */
	async manualSync(): Promise<{ message: string; syncedPosts: number }> {
		this.logger.log('Manual sync triggered')
		await this.syncViewsToDatabase()
		return {
			message: 'Synchronization completed',
			syncedPosts: (await this.redis.getAllViewKeys()).length
		}
	}
}
