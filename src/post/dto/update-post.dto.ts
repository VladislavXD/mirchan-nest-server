import { IsOptional, IsString, IsBoolean, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO для обновления поста.
 * Все поля опциональны, валидация @IsNotEmpty отключена.
 */
export class UpdatePostDto {
	/**
	 * Содержимое поста (может быть строкой или JSON с форматированием).
	 */
	@IsOptional()
	@Transform(({ value }) => {
		// Если приходит JSON строка, парсим её
		if (typeof value === 'string') {
			try {
				return JSON.parse(value)
			} catch {
				return value
			}
		}
		return value
	})
	content?: string | object

	/**
	 * Спойлер для текстового контента.
	 */
	@IsOptional()
	@IsBoolean()
	@Transform(({ value }) => value === 'true' || value === true)
	contentSpoiler?: boolean

	/**
	 * Массив URL эмодзи (gif).
	 */
	@IsOptional()
	@Transform(({ value }) => {
		if (!value) return []
		if (typeof value === 'string') {
			try {
				const parsed = JSON.parse(value)
				return Array.isArray(parsed) ? parsed : []
			} catch {
				return []
			}
		}
		return Array.isArray(value) ? value : []
	})
	@IsArray({ message: 'emojiUrls должно быть массивом' })
	emojiUrls?: string[]
}

