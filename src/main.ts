import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { RedisStore } from 'connect-redis';
import * as cookieParser from 'cookie-parser';
import session from 'express-session';
import { createClient } from 'redis';

import { AppModule } from './app.module';
import { ms, StringValue } from './libs/common/utils/ms.util';
import { parseBoolean } from './libs/common/utils/parse-boolean.util';

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

let cachedServer: any;

async function bootstrap() {
  if (!cachedServer) {
    const app = await NestFactory.create(AppModule);
    const expressApp = app.getHttpAdapter().getInstance() as any;
    expressApp.set('trust proxy', true);

    const config = app.get(ConfigService);
    const redis = createClient({
      url: config.getOrThrow<string>('REDIS_URI'),
    });
    await redis.connect();

    const sessionDomain = config.get<string>('SESSION_DOMAIN');
    app.use(
      session({
        secret: config.getOrThrow<string>('SESSION_SECRET'),
        name: config.getOrThrow<string>('SESSION_NAME'),
        resave: true,
        saveUninitialized: false,
        cookie: {
          ...(sessionDomain && sessionDomain.trim()
            ? { domain: sessionDomain }
            : {}),
          maxAge: ms(config.getOrThrow<StringValue>('SESSION_MAX_AGE')),
          httpOnly: parseBoolean(config.getOrThrow<string>('SESSION_HTTP_ONLY')),
          secure: parseBoolean(config.getOrThrow<string>('SESSION_SECURE')),
          sameSite: config.getOrThrow<'lax' | 'strict' | 'none' | boolean>('SESSION_SAME_SITE'),
        },
        store: new RedisStore({
          client: redis,
          prefix: config.getOrThrow<string>('SESSION_FOLDER'),
          ttl: ms(config.getOrThrow<StringValue>('SESSION_MAX_AGE')) / 1000,
        }),
      }),
    );

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
      }),
    );

    app.enableCors({
      origin: config.getOrThrow<string>('ALLOWED_ORIGIN'),
      credentials: true,
      exposedHeaders: ['Set-Cookie', 'set-cookie'],
    });

    if (process.env.NODE_ENV === 'production') {
      // Инициализируем без прослушивания порта для Vercel Serverless
      await app.init();
    } else {
      // Запускаем сервер на порту для локальной разработки
      await app.listen(config.getOrThrow<number>('APPLICATION_PORT'));
    }
    
    cachedServer = expressApp;
  }

  return cachedServer;
}

// Запуск локально
if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
  bootstrap();
}

// Экспорт для Vercel
export default async function (req: any, res: any) {
  const server = await bootstrap();
  return server(req, res);
}
