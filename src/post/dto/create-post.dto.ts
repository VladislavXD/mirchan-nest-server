import { IsNotEmpty, IsString, IsOptional, IsArray } from 'class-validator'
import { Transform } from 'class-transformer'

/**
 * DTO для создания поста.
 */
export class CreatePostDto {
	/**
	 * Буфер файла изображения (приходит из FileInterceptor).
	 * Передается контроллером, не валидируется class-validator.
	 */
	imageBuffer?: Buffer

	/**
	 * Исходное имя загруженного файла.
	 */
	imageOriginalFilename?: string

	/**
	 * Содержимое поста.
	 * @example "Это мой первый пост!"
	 */
	@IsNotEmpty({ message: 'Содержимое поста обязательно' })
	@IsString({ message: 'Содержимое должно быть строкой' })
	content: string

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
}
