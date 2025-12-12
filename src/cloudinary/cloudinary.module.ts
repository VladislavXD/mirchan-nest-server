import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { CloudinaryProvider } from './cloudinary.provider'
import { CloudinaryService } from './cloudinary.service'

/**
 * Модуль для интеграции с Cloudinary.
 * 
 * Предоставляет CloudinaryService для работы с загрузкой/удалением файлов.
 * Использует ConfigModule для получения credentials из .env.
 */
@Module({
	imports: [ConfigModule],
	providers: [CloudinaryProvider, CloudinaryService],
	exports: [CloudinaryService]
})
export class CloudinaryModule {}
