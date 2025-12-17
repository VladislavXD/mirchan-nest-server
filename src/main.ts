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
  
  // Middleware для динамической установки domain в cookie (если SESSION_DOMAIN установлен)
  // Это нужно для передачи cookie на субдомены (socket.mirchan.site)
  // Устанавливаем ПЕРЕД session middleware, чтобы перехватить установку cookie
  if (sessionDomain && sessionDomain.trim()) {
    app.use((req: any, res: any, next: any) => {
      const originalCookie = res.cookie.bind(res);
      const originalEnd = res.end.bind(res);
      
      // Перехватываем res.cookie() для добавления domain к session cookie
      res.cookie = function(name: string, value: any, options: any = {}) {
        if (name === sessionName) {
          // Добавляем domain к опциям cookie
          options = {
            ...options,
            domain: sessionDomain,
          };
        }
        return originalCookie(name, value, options);
      };
      
      // Также перехватываем установку заголовков напрямую (на случай если express-session использует setHeader)
      const originalSetHeader = res.setHeader.bind(res);
      res.setHeader = function(name: string, value: any) {
        if (name.toLowerCase() === 'set-cookie' && Array.isArray(value)) {
          const updatedCookies = value.map((cookie: string) => {
            if (cookie.startsWith(`${sessionName}=`)) {
              // Проверяем, есть ли уже domain в cookie
              if (!cookie.includes('Domain=')) {
                // Извлекаем cookie value и атрибуты
                const parts = cookie.split(';');
                const cookieValue = parts[0];
                const attrs = parts.slice(1).map((p: string) => p.trim()).filter((p: string) => !p.startsWith('Domain='));
                
                // Добавляем domain
                return [cookieValue, `Domain=${sessionDomain}`, ...attrs].join('; ');
              }
            }
            return cookie;
          });
          return originalSetHeader(name, updatedCookies);
        }
        return originalSetHeader(name, value);
      };
      
      next();
    });
  }
  
  app.use(
    session({
      secret: config.getOrThrow<string>('SESSION_SECRET'),
      name: sessionName,
      resave: true,
      saveUninitialized: false,
      cookie: {
        maxAge: sessionMaxAge,
        httpOnly: sessionHttpOnly,
        secure: sessionSecure,
        sameSite: sessionSameSite,
        // Domain будет добавлен через перехваченный res.cookie() и setHeader() выше
      },
      store: new RedisStore({
        client: redis,
        prefix: config.getOrThrow<string>('SESSION_FOLDER'),
        ttl: sessionMaxAge / 1000,
      }),
    }),
  );

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
