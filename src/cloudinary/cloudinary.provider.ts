import { ConfigService } from '@nestjs/config'
import { v2 as cloudinary } from 'cloudinary'

/**
 * Токен для инъекции экземпляра Cloudinary.
 */
export const CLOUDINARY = 'CLOUDINARY'

/**
 * Провайдер для конфигурации и предоставления экземпляра Cloudinary.
 * Использует ConfigService для получения credentials из переменных окружения.
 */
export const CloudinaryProvider = {
	provide: CLOUDINARY,
	useFactory: (config: ConfigService) => {
		cloudinary.config({
			cloud_name: config.getOrThrow<string>('CLOUDINARY_CLOUD_NAME'),
			api_key: config.getOrThrow<string>('CLOUDINARY_API_KEY'),
			api_secret: config.getOrThrow<string>('CLOUDINARY_API_SECRET')
		})

		// Логируем статус конфигурации (только для разработки)
		if (process.env.NODE_ENV === 'development') {
			console.log('✅ Cloudinary configured:', {
				cloud_name: config.get('CLOUDINARY_CLOUD_NAME') ? 'OK' : 'MISSING',
				api_key: config.get('CLOUDINARY_API_KEY') ? 'OK' : 'MISSING',
				api_secret: config.get('CLOUDINARY_API_SECRET') ? 'OK' : 'MISSING'
			})
		}

		return cloudinary
	},
	inject: [ConfigService]
}
