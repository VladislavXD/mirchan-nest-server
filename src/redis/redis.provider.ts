import { Provider } from '@nestjs/common'
import Redis from 'ioredis'

export const REDIS = 'REDIS'

/**
 * Провайдер для Redis.
 * 
 * Создаёт подключение к Redis с использованием переменных окружения.
 */
export const RedisProvider: Provider = {
	provide: REDIS,
	useFactory: () => {
		const redis = new Redis({
			host: process.env.REDIS_HOST || 'localhost',
			port: parseInt(process.env.REDIS_PORT || '6379', 10),
			password: process.env.REDIS_PASSWORD || undefined,
			db: parseInt(process.env.REDIS_DB || '0', 10),
			retryStrategy: (times) => {
				const delay = Math.min(times * 50, 2000)
				return delay
			},
			maxRetriesPerRequest: 3,
		})

		redis.on('connect', () => {
			console.log('✅ Redis connected successfully')
		})

		redis.on('error', (err) => {
			console.error('❌ Redis connection error:', err)
		})

		return redis
	}
}
