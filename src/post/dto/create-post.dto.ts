import { IsNotEmpty, IsString, IsOptional, IsArray, IsBoolean } from 'class-validator'
import { Transform, Type } from 'class-transformer'

/**
 * DTO для одного медиа файла.
 */
export class MediaFileDto {
	/**
	 * Буфер файла.
	 */
	buffer?: Buffer

	/**
	 * Оригинальное имя файла.
	 */
	originalname?: string

	/**
	 * MIME тип файла.
	 */
	mimetype?: string

	/**
	 * Размер файла в байтах.
	 */
	size?: number

	/**
	 * Флаг спойлера для этого медиа.
	 */
	@IsOptional()
	@IsBoolean()
	@Transform(({ value }) => value === 'true' || value === true)
	spoiler?: boolean
}

/**
 * DTO для создания поста.
 */
export class CreatePostDto {
	/**
	 * Массив медиа файлов (фото и видео).
	 * Передается через FileFieldsInterceptor.
	 */
	mediaFiles?: MediaFileDto[]

	/**
	 * Содержимое поста (может быть строкой или JSON с форматированием).
	 * @example "Это мой первый пост!"
	 */
	@IsNotEmpty({ message: 'Содержимое поста обязательно' })
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
	content: string | object

	/**
	 * Спойлер для текстового контента.
	 */
	@IsOptional()
	@IsBoolean()
	@Transform(({ value }) => value === 'true' || value === true)
	contentSpoiler?: boolean

	/**
	 * Массив URL эмодзи (gif).
	 * @example ["https://example.com/emoji1.gif", "https://example.com/emoji2.gif"]
	 */
	@IsOptional()
	@Transform(({ value }) => {
		// Преобразование строки из multipart/form-data в массив
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

	/**
	 * Массив флагов спойлера для медиа файлов.
	 * Порядок соответствует порядку файлов в mediaFiles.
	 * @example [true, false, true] - первый и третий файл будут со спойлером
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
	@IsArray()
	mediaSpoilers?: boolean[]
}
