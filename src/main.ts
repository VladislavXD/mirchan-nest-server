
import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { RedisStore } from 'connect-redis'
import * as cookieParser from 'cookie-parser'
import session from 'express-session'
import { createClient } from 'redis'

import { AppModule } from './app.module'
import { ms, StringValue } from './libs/common/utils/ms.util'
import { parseBoolean } from './libs/common/utils/parse-boolean.util'



/**
 * Запускает приложение NestJS.
 *
 * Функция инициализирует приложение, настраивает промежуточное ПО,
 * конфигурирует управление сессиями и запускает сервер.
 *
 * @async
 * @function bootstrap
 * @returns {Promise<void>} Промис, который разрешается, когда приложение запущено.
 */
async function bootstrap() {
	const app = await NestFactory.create(AppModule)

	const config = app.get(ConfigService)
	// Подключение node-redis (connect-redis v9 не поддерживает ioredis)
	const redis = createClient({
		url: config.getOrThrow<string>('REDIS_URI')
	})
	await redis.connect()


	// Получаем SESSION_DOMAIN, если пустой - не устанавливаем (браузер будет использовать текущий origin)
	const sessionDomain = config.get<string>('SESSION_DOMAIN')

	app.use(
			session({
				secret: config.getOrThrow<string>('SESSION_SECRET'),
				name: config.getOrThrow<string>('SESSION_NAME'),
				resave: true,
				saveUninitialized: false,
				cookie: {
					...(sessionDomain && sessionDomain.trim() ? { domain: sessionDomain } : {}),
					maxAge: ms(config.getOrThrow<StringValue>('SESSION_MAX_AGE')),
					httpOnly: parseBoolean(
						config.getOrThrow<string>('SESSION_HTTP_ONLY')
					),
					secure: parseBoolean(
						config.getOrThrow<string>('SESSION_SECURE')
					),
					sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
				},
				store: new RedisStore({
					client: redis,
					prefix: config.getOrThrow<string>('SESSION_FOLDER'),
					// Можно настроить ttl вручную если нужно: ttl: 60 * 60 * 24
				})
			})
	)

	app.useGlobalPipes(
		new ValidationPipe({
			transform: true
		})
	)

	

	app.enableCors({
		// Настройки CORS для приложения
		origin: config.getOrThrow<string>('ALLOWED_ORIGIN'),
		credentials: true,
		exposedHeaders: ['Set-Cookie']
	})

	// Для Vercel serverless
	if (process.env.VERCEL) {
		const expressApp = app.getHttpAdapter().getInstance()
		module.exports = expressApp
		return
	}

	await app.listen(config.getOrThrow<number>('APPLICATION_PORT'))
}

module.exports = bootstrap
