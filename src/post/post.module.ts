import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { PostService } from './post.service'
import { PostController } from './post.controller'
import { ViewsSyncService } from './services/views-sync.service'
import { PrismaModule } from '../prisma/prisma.module'
import { CloudinaryModule } from '../cloudinary/cloudinary.module'
import { RedisModule } from '../redis/redis.module'
import { UserModule } from '../user/user.module'
import { AuthModule } from '../auth/auth.module'

/**
 * Модуль для работы с постами.
 * 
 * Импортирует PrismaModule, CloudinaryModule, RedisModule, UserModule, AuthModule
 * и ScheduleModule для работы с БД, загрузкой изображений, кэшированием просмотров,
 * авторизацией и периодической синхронизацией.
 */
@Module({
	imports: [
		PrismaModule, 
		CloudinaryModule, 
		RedisModule,
		UserModule,
		AuthModule,
		ScheduleModule.forRoot()
	],
	controllers: [PostController],
	providers: [PostService, ViewsSyncService],
	exports: [PostService]
})
export class PostModule {}
