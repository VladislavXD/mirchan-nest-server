import * as crypto from 'crypto';

/**
 * Генерация хеша IP для анонимности постера
 * Используется для идентификации анонимных пользователей без раскрытия IP
 */
export function generatePosterHash(ip: string, boardName: string): string {
  // Используем день в timestamp для ежедневной смены хеша
  const dayTimestamp = Date.now().toString().slice(0, -6);
  const hashSource = `${ip}-${boardName}-${dayTimestamp}`;
  
  return crypto
    .createHash('sha256')
    .update(hashSource)
    .digest('hex')
    .slice(0, 8);
}

/**
 * Генерация короткого ID для постов (например: a1b2c3d4)
 */
export function generateShortId(): string {
  return crypto.randomBytes(4).toString('hex');
}

/**
 * Извлечение реального IP из запроса (с учетом прокси)
 */
export function getRealIp(request: any): string {
  return (
    request.headers['x-forwarded-for']?.split(',')[0] ||
    request.headers['x-real-ip'] ||
    request.connection?.remoteAddress ||
    request.socket?.remoteAddress ||
    '0.0.0.0'
  );
}
