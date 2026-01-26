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
	 * Загружает изображение или видео из буфера в Cloudinary.
	 * 
	 * @param buffer - Буфер файла
	 * @param filename - Имя файла без расширения
	 * @param folder - Папка назначения в Cloudinary (по умолчанию "mirchanAvatars")
	 * @param resourceType - Тип ресурса: 'image', 'video', 'raw' или 'auto' (автоопределение)
	 * @returns Promise с результатом загрузки или ошибкой
	 */
	async uploadBuffer(
		buffer: Buffer,
		filename: string,
		folder: string = 'mirchanAvatars',
		resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto'
	): Promise<UploadApiResponse> {
		return new Promise((resolve, reject) => {
			console.log(`[Cloudinary] Uploading: ${filename}, folder: ${folder}, resourceType: ${resourceType}, bufferSize: ${buffer.length}`)
			
			const uploadStream = this.cloudinary.uploader.upload_stream(
				{
					folder,
					public_id: filename,
					resource_type: resourceType
				},
				(error, result) => {
					if (error) {
						console.error(`[Cloudinary] Upload failed for ${filename}:`, error)
						return reject(error)
					}
					if (!result) {
						console.error(`[Cloudinary] Upload failed for ${filename}: no result returned`)
						return reject(new Error('Upload failed: no result returned'))
					}
					console.log(`[Cloudinary] Upload success for ${filename}: ${result.secure_url}`)
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
	 * @param resourceType - Тип ресурса: 'image', 'video', 'raw'. Если не указан, пробуем оба типа
	 * @returns true если удаление успешно, false в противном случае
	 */
	async deleteFile(publicId: string, resourceType?: 'image' | 'video' | 'raw'): Promise<boolean> {
		if (!publicId) return false

		try {
			// Если тип указан, удаляем конкретный тип
			if (resourceType) {
				const result = await this.cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
				
				if (process.env.NODE_ENV === 'development') {
					console.log('Cloudinary delete result:', result)
				}
				
				return result.result === 'ok'
			}

			// Если тип не указан, пробуем удалить как image, затем как video
			let result = await this.cloudinary.uploader.destroy(publicId, { resource_type: 'image' })
			
			if (result.result === 'ok') {
				return true
			}

			// Если не удалось как image, пробуем как video
			result = await this.cloudinary.uploader.destroy(publicId, { resource_type: 'video' })
			
			if (process.env.NODE_ENV === 'development') {
				console.log('Cloudinary delete result (video):', result)
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
