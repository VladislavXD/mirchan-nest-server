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
  const cookieConfig: any = {
    maxAge: sessionMaxAge,
    httpOnly: sessionHttpOnly,
    secure: sessionSecure,
    sameSite: sessionSameSite,
  };
  
  // Добавляем domain в конфигурацию, если установлен
  if (sessionDomain && sessionDomain.trim()) {
    cookieConfig.domain = sessionDomain;
  }
  
  console.log('🍪 Session cookie config:', {
    name: sessionName,
    maxAge: sessionMaxAge,
    httpOnly: sessionHttpOnly,
    secure: sessionSecure,
    sameSite: sessionSameSite,
    domain: sessionDomain || '(not set - will use current origin)',
  });
  
  // Middleware для перехвата res.cookie() ДО того, как express-session установит cookie
  // Это нужно для установки правильного domain, который Vercel не сможет перезаписать
  if (sessionDomain && sessionDomain.trim()) {
    app.use((req: any, res: any, next: any) => {
      const originalCookie = res.cookie.bind(res);
      
      // Перехватываем res.cookie() для добавления domain к session cookie
      res.cookie = function(name: string, value: any, options: any = {}) {
        if (name === sessionName) {
          // Принудительно устанавливаем domain, перезаписывая любые другие значения
          options = {
            ...options,
            domain: sessionDomain,
          };
          console.log('🍪 [res.cookie] Setting cookie with domain:', sessionDomain, 'for', name);
        }
        return originalCookie(name, value, options);
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
      cookie: cookieConfig,
      store: new RedisStore({
        client: redis,
        prefix: config.getOrThrow<string>('SESSION_FOLDER'),
        ttl: sessionMaxAge / 1000,
      }),
    }),
  );
  
  // Middleware для принудительной замены domain в Set-Cookie заголовках ПОСЛЕ express-session
  // Это последняя попытка исправить domain, если Vercel все еще перезаписывает его
  if (sessionDomain && sessionDomain.trim()) {
    app.use((req: any, res: any, next: any) => {
      const originalSetHeader = res.setHeader.bind(res);
      const originalWriteHead = res.writeHead.bind(res);
      
      // Перехватываем setHeader для Set-Cookie
      res.setHeader = function(name: string, value: any) {
        if (name.toLowerCase() === 'set-cookie') {
          const cookies = Array.isArray(value) ? value : [value];
          const updatedCookies = cookies.map((cookie: string) => {
            if (cookie.startsWith(`${sessionName}=`)) {
              // Удаляем любой существующий Domain= и добавляем правильный
              let cookieWithoutDomain = cookie.replace(/;\s*Domain=[^;]+/gi, '');
              const updated = `${cookieWithoutDomain}; Domain=${sessionDomain}`;
              console.log('🍪 [setHeader] Forcing domain in Set-Cookie:', updated.substring(0, 100) + '...');
              return updated;
            }
            return cookie;
          });
          return originalSetHeader(name, updatedCookies);
        }
        return originalSetHeader(name, value);
      };
      
      // Перехватываем writeHead (используется для установки заголовков)
      res.writeHead = function(statusCode: number, statusMessage?: any, headers?: any) {
        if (headers && headers['set-cookie']) {
          const cookies = Array.isArray(headers['set-cookie']) ? headers['set-cookie'] : [headers['set-cookie']];
          headers['set-cookie'] = cookies.map((cookie: string) => {
            if (cookie.startsWith(`${sessionName}=`)) {
              let cookieWithoutDomain = cookie.replace(/;\s*Domain=[^;]+/gi, '');
              return `${cookieWithoutDomain}; Domain=${sessionDomain}`;
            }
            return cookie;
          });
          console.log('🍪 [writeHead] Forcing domain in Set-Cookie');
        }
        return originalWriteHead(statusCode, statusMessage, headers);
      };
      
      // Перехватываем res.end для финальной проверки
      const originalEnd = res.end.bind(res);
      res.end = function(chunk?: any, encoding?: any) {
        const setCookieHeaders = res.getHeader('set-cookie');
        if (setCookieHeaders) {
          const cookies = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
          cookies.forEach((cookie: string) => {
            if (cookie.startsWith(`${sessionName}=`)) {
              console.log('🍪 [end] Final cookie domain check:', cookie.includes(`Domain=${sessionDomain}`) ? '✅ Correct' : '❌ Wrong domain');
              if (!cookie.includes(`Domain=${sessionDomain}`)) {
                console.log('🍪 [end] Cookie domain:', cookie.match(/Domain=([^;]+)/)?.[1] || 'not found');
              }
            }
          });
        }
        return originalEnd(chunk, encoding);
      };
      
      next();
    });
  }

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
