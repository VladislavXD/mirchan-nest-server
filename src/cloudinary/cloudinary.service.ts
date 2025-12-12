import { Inject, Injectable } from '@nestjs/common'
import type { UploadApiErrorResponse, UploadApiResponse } from 'cloudinary'
import { v2 as CloudinaryV2 } from 'cloudinary'
import * as streamifier from 'streamifier'
import { CLOUDINARY } from './cloudinary.provider'

/**
 * Сервис для работы с Cloudinary.
 * 
 * Предоставляет методы для загрузки, удаления изображений
 * и извлечения publicId из URL.
 */
@Injectable()
export class CloudinaryService {
	constructor(@Inject(CLOUDINARY) private readonly cloudinary: typeof CloudinaryV2) {}

	/**
	 * Загружает изображение из буфера в Cloudinary.
	 * 
	 * @param buffer - Буфер изображения
	 * @param filename - Имя файла без расширения
	 * @param folder - Папка назначения в Cloudinary (по умолчанию "mirchanAvatars")
	 * @returns Promise с результатом загрузки или ошибкой
	 */
	async uploadBuffer(
		buffer: Buffer,
		filename: string,
		folder: string = 'mirchanAvatars'
	): Promise<UploadApiResponse> {
		return new Promise((resolve, reject) => {
			const uploadStream = this.cloudinary.uploader.upload_stream(
				{
					folder,
					public_id: filename
				},
				(error, result) => {
					if (error) return reject(error)
					if (!result) return reject(new Error('Upload failed: no result returned'))
					resolve(result)
				}
			)

			streamifier.createReadStream(buffer).pipe(uploadStream)
		})
	}

	/**
	 * Удаляет файл из Cloudinary по publicId.
	 * 
	 * @param publicId - Public ID файла в Cloudinary (например: "mirchanAvatars/user_123456")
	 * @returns true если удаление успешно, false в противном случае
	 */
	async deleteFile(publicId: string): Promise<boolean> {
		if (!publicId) return false

		try {
			const result = await this.cloudinary.uploader.destroy(publicId)
			
			if (process.env.NODE_ENV === 'development') {
				console.log('Cloudinary delete result:', result)
			}
			
			return result.result === 'ok'
		} catch (error) {
			console.error('Error deleting from Cloudinary:', error)
			return false
		}
	}

	/**
	 * Извлекает publicId из URL Cloudinary.
	 * 
	 * Пример:
	 * URL: https://res.cloudinary.com/.../mirchanAvatars/Vladislav_1754133279143.png
	 * Результат: "mirchanAvatars/Vladislav_1754133279143"
	 * 
	 * @param url - URL файла в Cloudinary
	 * @returns publicId или null при ошибке парсинга
	 */
	getPublicIdFromUrl(url: string): string | null {
		try {
			const parts = url.split('/')
			const fileWithExt = parts[parts.length - 1] // Vladislav_1754133279143.png
			const folder = parts[parts.length - 2] // mirchanAvatars
			const filename = fileWithExt.split('.')[0] // Vladislav_1754133279143
			return `${folder}/${filename}` // mirchanAvatars/Vladislav_1754133279143
		} catch (error) {
			console.error('Error parsing publicId from URL:', error)
			return null
		}
	}

	/**
	 * Удаляет файл из Cloudinary по его URL.
	 * 
	 * @param url - URL файла в Cloudinary
	 * @returns true если удаление успешно, false в противном случае
	 */
	async deleteByUrl(url: string): Promise<boolean> {
		const publicId = this.getPublicIdFromUrl(url)
		if (!publicId) return false
		return this.deleteFile(publicId)
	}
}
