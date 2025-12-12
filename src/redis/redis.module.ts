import { Module, Global } from '@nestjs/common'
import { RedisService } from './redis.service'
import { RedisProvider } from './redis.provider'

/**
 * Глобальный модуль для работы с Redis.
 * 
 * Предоставляет RedisService для кэширования и работы с данными в памяти.
 */
@Global()
@Module({
	providers: [RedisProvider, RedisService],
	exports: [RedisService]
})
export class RedisModule {}
