import { createAvatar } from '@dicebear/core';
import { lorelei } from '@dicebear/collection';
import sharp from 'sharp';

/**
 * Генерирует уникальный аватар на основе seed и возвращает его как PNG Buffer.
 * 
 * @param seed - Строка для генерации уникального аватара (например, имя пользователя)
 * @returns Buffer с PNG изображением
 */
export async function generateAvatar(seed: string): Promise<Buffer> {
  const avatar = createAvatar(lorelei, {
    seed,
    size: 128,
  });

  // Получаем SVG строку
  const svgString = avatar.toString();
  
  // Конвертируем SVG в PNG Buffer с помощью sharp
  return await sharp(Buffer.from(svgString)).png().toBuffer();
}
