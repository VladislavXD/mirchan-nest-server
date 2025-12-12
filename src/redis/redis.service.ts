import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common'
import type Redis from 'ioredis'
import { REDIS } from './redis.provider'

/**
 * Сервис для работы с Redis.
 * 
 * Предоставляет методы для кэширования просмотров постов,
 * работы с множествами (sets) и периодической синхронизации с БД.
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
	constructor(@Inject(REDIS) private readonly redis: Redis) {}

	/**
	 * Закрывает соединение с Redis при уничтожении модуля.
	 */
	async onModuleDestroy() {
		await this.redis.quit()
	}

	/**
	 * Добавляет userId в set просмотров поста.
	 * 
	 * @param postId - ID поста
	 * @param userId - ID пользователя
	 * @returns true если просмотр был добавлен, false если уже существовал
	 */
	async addView(postId: string, userId: string): Promise<boolean> {
		const key = `post:${postId}:views`
		const result = await this.redis.sadd(key, userId)
		
		// Устанавливаем TTL 24 часа для автоочистки
		await this.redis.expire(key, 86400)
		
		return result === 1 // 1 = добавлено, 0 = уже существовало
	}

	/**
	 * Проверяет, просматривал ли пользователь пост.
	 * 
	 * @param postId - ID поста
	 * @param userId - ID пользователя
	 * @returns true если пользователь уже просматривал пост
	 */
	async hasViewed(postId: string, userId: string): Promise<boolean> {
		const key = `post:${postId}:views`
		const result = await this.redis.sismember(key, userId)
		return result === 1
	}

	/**
	 * Получает количество просмотров поста из Redis.
	 * 
	 * @param postId - ID поста
	 * @returns Количество просмотров
	 */
	async getViewsCount(postId: string): Promise<number> {
		const key = `post:${postId}:views`
		return await this.redis.scard(key)
	}

	/**
	 * Получает все userId, просмотревшие пост.
	 * 
	 * @param postId - ID поста
	 * @returns Массив ID пользователей
	 */
	async getViewers(postId: string): Promise<string[]> {
		const key = `post:${postId}:views`
		return await this.redis.smembers(key)
	}

	/**
	 * Инициализирует просмотры поста из БД в Redis.
	 * 
	 * @param postId - ID поста
	 * @param userIds - Массив ID пользователей из БД
	 */
	async initializeViews(postId: string, userIds: string[]): Promise<void> {
		if (userIds.length === 0) return

		const key = `post:${postId}:views`
		await this.redis.sadd(key, ...userIds)
		await this.redis.expire(key, 86400)
	}

	/**
	 * Удаляет кэш просмотров поста.
	 * 
	 * @param postId - ID поста
	 */
	async deleteViews(postId: string): Promise<void> {
		const key = `post:${postId}:views`
		await this.redis.del(key)
	}

	/**
	 * Батчевое добавление просмотров с использованием pipeline.
	 * 
	 * @param views - Массив объектов { postId, userId }
	 * @returns Массив результатов (true/false для каждого просмотра)
	 */
	async addViewsBatch(views: Array<{ postId: string; userId: string }>): Promise<boolean[]> {
		const pipeline = this.redis.pipeline()

		views.forEach(({ postId, userId }) => {
			const key = `post:${postId}:views`
			pipeline.sadd(key, userId)
			pipeline.expire(key, 86400)
		})

		const results = await pipeline.exec()
		
		if (!results) return []
		
		// Извлекаем результаты sadd (каждый второй элемент)
		return results
			.filter((_, index) => index % 2 === 0)
			.map(([err, result]) => !err && result === 1)
	}

	/**
	 * Получает все ключи просмотров для синхронизации с БД.
	 * 
	 * @returns Массив postId, которые имеют просмотры в Redis
	 */
	async getAllViewKeys(): Promise<string[]> {
		const keys = await this.redis.keys('post:*:views')
		// Извлекаем postId из ключей вида "post:postId:views"
		return keys.map(key => key.split(':')[1])
	}

	/**
	 * Очищает весь кэш просмотров (использовать осторожно!).
	 */
	async flushViewsCache(): Promise<void> {
		const keys = await this.redis.keys('post:*:views')
		if (keys.length > 0) {
			await this.redis.del(...keys)
		}
	}

	/**
	 * Общие методы Redis для других целей.
	 */

	/**
	 * Устанавливает значение с TTL.
	 */
	async set(key: string, value: string, ttl?: number): Promise<void> {
		if (ttl) {
			await this.redis.setex(key, ttl, value)
		} else {
			await this.redis.set(key, value)
		}
	}

	/**
	 * Получает значение по ключу.
	 */
	async get(key: string): Promise<string | null> {
		return await this.redis.get(key)
	}

	/**
	 * Удаляет ключ.
	 */
	async del(key: string): Promise<void> {
		await this.redis.del(key)
	}

	/**
	 * Проверяет существование ключа.
	 */
	async exists(key: string): Promise<boolean> {
		const result = await this.redis.exists(key)
		return result === 1
	}

	/**
	 * Кэширует данные пользователя для Socket.IO.
	 * 
	 * @param userId - ID пользователя
	 * @param userData - данные пользователя (id, name, email, avatarUrl, lastSeen)
	 */
	async cacheUserData(userId: string, userData: {
		id: string;
		name: string;
		email: string;
		avatarUrl: string | null;
		lastSeen: Date;
	}): Promise<void> {
		const key = `user:${userId}`
		const data = JSON.stringify(userData)
		
		// Кэшируем на 1 час (3600 секунд)
		await this.redis.setex(key, 3600, data)
	}

	/**
	 * Получает кэшированные данные пользователя.
	 * 
	 * @param userId - ID пользователя
	 * @returns данные пользователя или null если не найдено
	 */
	async getCachedUserData(userId: string): Promise<{
		id: string;
		name: string;
		email: string;
		avatarUrl: string | null;
		lastSeen: Date;
	} | null> {
		const key = `user:${userId}`
		const data = await this.redis.get(key)
		
		if (!data) {
			return null
		}
		
		try {
			const parsed = JSON.parse(data)
			// Преобразуем lastSeen обратно в Date
			if (parsed.lastSeen) {
				parsed.lastSeen = new Date(parsed.lastSeen)
			}
			return parsed
		} catch (error) {
			console.error('Error parsing cached user data:', error)
			return null
		}
	}

	/**
	 * Удаляет кэшированные данные пользователя.
	 * 
	 * @param userId - ID пользователя
	 */
	async invalidateUserCache(userId: string): Promise<void> {
		const key = `user:${userId}`
		await this.redis.del(key)
	}

	/**
	 * Кэширует онлайн статус пользователя.
	 * 
	 * @param userId - ID пользователя
	 * @param isOnline - статус онлайн
	 */
	async setUserOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
		const key = `user:${userId}:online`
		if (isOnline) {
			// Онлайн статус храним 5 минут (TTL для автоматического оффлайн)
			await this.redis.setex(key, 300, 'true')
		} else {
			await this.redis.del(key)
		}
	}

	/**
	 * Получает онлайн статус пользователя.
	 * 
	 * @param userId - ID пользователя
	 * @returns true если пользователь онлайн
	 */
	async getUserOnlineStatus(userId: string): Promise<boolean> {
		const key = `user:${userId}:online`
		const result = await this.redis.get(key)
		return result === 'true'
	}
}
