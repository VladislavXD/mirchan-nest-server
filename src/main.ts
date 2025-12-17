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
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Приложение работает за прокси (Vercel) — доверяем прокси,
  // чтобы express/express-session корректно определяли протокол (https) и заголовки.
  const expressApp = app.getHttpAdapter().getInstance() as any;
  expressApp.set('trust proxy', true);

  const config = app.get(ConfigService);
  // Подключение node-redis (connect-redis v9 не поддерживает ioredis)
  const redis = createClient({
    url: config.getOrThrow<string>('REDIS_URI'),
  });
  await redis.connect();

  // Получаем SESSION_DOMAIN, если пустой - не устанавливаем (браузер будет использовать текущий origin)
  // Для передачи кук на субдомены (например, socket.mirchan.site) нужно установить domain: '.mirchan.site'
  const sessionDomain = config.get<string>('SESSION_DOMAIN');
  const sessionName = config.getOrThrow<string>('SESSION_NAME');
  const sessionMaxAge = ms(config.getOrThrow<StringValue>('SESSION_MAX_AGE'));
  const sessionHttpOnly = parseBoolean(config.getOrThrow<string>('SESSION_HTTP_ONLY'));
  const sessionSecure = parseBoolean(config.getOrThrow<string>('SESSION_SECURE'));
  const sessionSameSite = config.getOrThrow<'lax' | 'strict' | 'none' | boolean>('SESSION_SAME_SITE');
  
  // Создаем конфигурацию cookie
  // ВАЖНО: Не устанавливаем domain здесь, так как это может помешать установке cookie на основном домене
  // Для передачи cookie на субдомены используем другой подход (см. middleware ниже)
  const cookieConfig: any = {
    maxAge: sessionMaxAge,
    httpOnly: sessionHttpOnly,
    secure: sessionSecure,
    sameSite: sessionSameSite,
  };
  
  console.log('🍪 Session cookie config:', {
    name: sessionName,
    maxAge: sessionMaxAge,
    httpOnly: sessionHttpOnly,
    secure: sessionSecure,
    sameSite: sessionSameSite,
    domain: sessionDomain || '(not set - will use current origin)',
  });
  
  app.use(
    session({
      secret: config.getOrThrow<string>('SESSION_SECRET'),
      name: sessionName,
      resave: true,
      saveUninitialized: false,
      cookie: cookieConfig,
      store: new RedisStore({
        client: redis,
        prefix: config.getOrThrow<string>('SESSION_FOLDER'),
        ttl: sessionMaxAge / 1000,
      }),
    }),
  );
  
  // Middleware для добавления/замены domain в cookie ПОСЛЕ того, как она установлена (если SESSION_DOMAIN установлен)
  // Это нужно для передачи cookie на субдомены (socket.mirchan.site)
  // ВАЖНО: Vercel может автоматически устанавливать domain на свой домен, поэтому мы принудительно заменяем его
  if (sessionDomain && sessionDomain.trim()) {
    app.use((req: any, res: any, next: any) => {
      const originalEnd = res.end.bind(res);
      res.end = function(chunk?: any, encoding?: any) {
        // Получаем Set-Cookie заголовки
        const setCookieHeaders = res.getHeader('set-cookie');
        if (setCookieHeaders) {
          const cookies = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
          const updatedCookies = cookies.map((cookie: string) => {
            // Ищем session cookie
            if (cookie.startsWith(`${sessionName}=`)) {
              // Удаляем существующий Domain= если есть (Vercel может установить свой)
              let cookieWithoutDomain = cookie.replace(/;\s*Domain=[^;]+/gi, '');
              
              // Добавляем правильный domain
              return `${cookieWithoutDomain}; Domain=${sessionDomain}`;
            }
            return cookie;
          });
          
          // Устанавливаем обновленные cookie
          res.setHeader('set-cookie', updatedCookies);
          console.log('🍪 Updated Set-Cookie with domain:', updatedCookies);
          console.log('🍪 Target domain:', sessionDomain);
        }
        return originalEnd(chunk, encoding);
      };
      next();
    });
  }
  
  // Middleware для логирования установки cookie (для диагностики)
  app.use((req: any, res: any, next: any) => {
    const originalEnd = res.end.bind(res);
    res.end = function(chunk?: any, encoding?: any) {
      // Логируем Set-Cookie заголовки для диагностики
      const setCookieHeaders = res.getHeader('set-cookie');
      if (setCookieHeaders) {
        const cookies = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
        console.log('🍪 Final Set-Cookie headers:', cookies);
      }
      return originalEnd(chunk, encoding);
    };
    next();
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );

  app.enableCors({
    // Настройки CORS для приложения
    origin: config.getOrThrow<string>('ALLOWED_ORIGIN'),
    credentials: true,
    // экспонируем Set-Cookie чтобы браузер и прокси могли увидеть заголовок
    exposedHeaders: ['Set-Cookie', 'set-cookie'],
  });

  await app.listen(config.getOrThrow<number>('APPLICATION_PORT'));
}

// Для Vercel serverless functions экспортируем приложение
bootstrap()
