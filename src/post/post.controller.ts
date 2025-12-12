import { 
	Controller, 
	Get, 
	Post, 
	Body, 
	Patch, 
	Param, 
	Delete,
	HttpCode,
	HttpStatus,
	UseInterceptors,
	UploadedFile,
	BadRequestException,
	Req,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { PostService } from './post.service'
import { ViewsSyncService } from './services/views-sync.service'
import { CreatePostDto } from './dto/create-post.dto'
import { UpdatePostDto } from './dto/update-post.dto'
import { AddViewDto } from './dto/add-view.dto'
import { AddViewsBatchDto } from './dto/add-views-batch.dto'
import { Authorization } from '../auth/decorators/auth.decorator'
import { Authorized } from '../auth/decorators/authorized.decorator'
import { UserRole } from '@prisma/client'

/**
 * Контроллер для работы с постами.
 * 
 * Предоставляет эндпоинты для создания, получения, обновления и удаления постов.
 */
@Controller('posts')
export class PostController {
	constructor(
		private readonly postService: PostService,
		private readonly viewsSyncService: ViewsSyncService
	) {}

	/**
	 * Создание нового поста.
	 * 
	 * @param userId - ID авторизованного пользователя
	 * @param file - Загруженный файл изображения (опционально)
	 * @param dto - Данные для создания поста
	 * @returns Созданный пост
	 */
	@Authorization()
	@HttpCode(HttpStatus.CREATED)
	@Post()
	@UseInterceptors(FileInterceptor('image', {
		limits: {
			fileSize: 10 * 1024 * 1024, // 10MB максимум
		},
		fileFilter: (req, file, callback) => {
			// Разрешаем только изображения
			if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
				return callback(
					new BadRequestException('Разрешены только файлы изображений (jpg, jpeg, png, gif, webp)'),
					false
				)
			}
			callback(null, true)
		}
	}))
	async create(
		@Authorized('id') userId: string,
		@UploadedFile() file: any,
		@Body() dto: CreatePostDto
	) {
		// Если загружен файл, добавляем его buffer и имя в DTO
		if (file) {
			dto.imageBuffer = file.buffer
			dto.imageOriginalFilename = file.originalname
		}

		return this.postService.create(userId, dto)
	}

	/**
	 * Получение всех постов.
	 * Публичный эндпоинт (не требует авторизации).
	 * 
	 * @returns Массив постов
	 */
	@HttpCode(HttpStatus.OK)
	@Get()
	async findAll(@Req() req: any) {
		const userId = req?.session?.userId || null
		return this.postService.findAll(userId)
	}

	/**
	 * Получение поста по ID.
	 * Публичный эндпоинт (не требует авторизации).
	 * 
	 * @param id - ID поста
	 * @returns Пост с автором, лайками и комментариями
	 */
	@HttpCode(HttpStatus.OK)
	@Get(':id')
	async findOne(@Param('id') id: string, @Req() req: any) {
		const userId = req?.session?.userId || null
		return this.postService.findOne(id, userId)
	}

	/**
	 * Получение постов конкретного пользователя.
	 * 
	 * @param userId - ID пользователя
	 * @returns Массив постов пользователя
	 */
	@HttpCode(HttpStatus.OK)
	@Get('user/:userId')
	async findByUserId(@Param('userId') userId: string) {
		return this.postService.findByUserId(userId)
	}

	/**
	 * Обновление поста.
	 * 
	 * @param id - ID поста
	 * @param userId - ID авторизованного пользователя
	 * @param file - Загруженный файл изображения (опционально)
	 * @param dto - Данные для обновления
	 * @returns Обновлённый пост
	 */
	@Authorization()
	@HttpCode(HttpStatus.OK)
	@Patch(':id')
	@UseInterceptors(FileInterceptor('image', {
		limits: {
			fileSize: 10 * 1024 * 1024, // 10MB максимум
		},
		fileFilter: (req, file, callback) => {
			if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
				return callback(
					new BadRequestException('Разрешены только файлы изображений (jpg, jpeg, png, gif, webp)'),
					false
				)
			}
			callback(null, true)
		}
	}))
	async update(
		@Param('id') id: string,
		@Authorized('id') userId: string,
		@UploadedFile() file: any,
		@Body() dto: UpdatePostDto
	) {
		// Если загружен файл, добавляем его buffer и имя в DTO
		if (file) {
			dto.imageBuffer = file.buffer
			dto.imageOriginalFilename = file.originalname
		}

		return this.postService.update(id, userId, dto)
	}

	/**
	 * Удаление поста.
	 * 
	 * @param id - ID поста
	 * @param userId - ID авторизованного пользователя
	 */
	@Authorization()
	@HttpCode(HttpStatus.OK)
	@Delete(':id')
	async remove(
		@Param('id') id: string,
		@Authorized('id') userId: string
	) {
		return this.postService.remove(id, userId)
	}

	/**
	 * Добавление единичного просмотра поста.
	 * 
	 * @param dto - DTO с postId
	 * @param userId - ID авторизованного пользователя
	 * @returns Количество просмотров и сообщение
	 */
	@Authorization()
	@HttpCode(HttpStatus.OK)
	@Post('view')
	async addView(
		@Body() dto: AddViewDto,
		@Authorized('id') userId: string
	) {
		return this.postService.addView(dto.postId, userId)
	}

	/**
	 * Батчевое добавление просмотров.
	 * 
	 * @param dto - DTO с массивом postIds
	 * @param userId - ID авторизованного пользователя
	 * @returns Количество обработанных просмотров
	 */
	@Authorization()
	@HttpCode(HttpStatus.OK)
	@Post('views-batch')
	async addViewsBatch(
		@Body() dto: AddViewsBatchDto,
		@Authorized('id') userId: string
	) {
		return this.postService.addViewsBatch(dto.postIds, userId)
	}

	/**
	 * Ручная синхронизация просмотров из Redis в БД.
	 * Доступно только администраторам.
	 * 
	 * @returns Статус синхронизации
	 */
	@Authorization(UserRole.ADMIN)
	@HttpCode(HttpStatus.OK)
	@Post('sync-views')
	async syncViews() {
		return this.viewsSyncService.manualSync()
	}
}
