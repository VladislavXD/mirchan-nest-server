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
	UploadedFiles,
	BadRequestException,
	Req,
	Query,
} from '@nestjs/common'
import { FileInterceptor, FileFieldsInterceptor, FilesInterceptor } from '@nestjs/platform-express'
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
	 * @param files - Загруженные медиа файлы (images и videos)
	 * @param dto - Данные для создания поста
	 * @returns Созданный пост
	 */
	@Authorization()
	@HttpCode(HttpStatus.CREATED)
	@Post()
	@UseInterceptors(FilesInterceptor('media', 30, {
		limits: {
			fileSize: 100 * 1024 * 1024, // 100MB максимум
		},
		fileFilter: (req, file, callback) => {
			// Разрешаем изображения и видео
			if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp|mp4|webm|ogg)$/)) {
				return callback(
					new BadRequestException('Разрешены только изображения и видео'),
					false
				)
			}
			callback(null, true)
		}
	}))
	async create(
		@Authorized('id') userId: string,
		@UploadedFiles() files: any[],
		@Body() dto: CreatePostDto
	) {
		// Преобразуем загруженные файлы в формат DTO
		if (files && files.length > 0) {
			dto.mediaFiles = files.map(file => ({
				buffer: file.buffer,
				originalname: file.originalname,
				mimetype: file.mimetype,
				size: file.size
			}))
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

	async findAll(@Req() req: any, @Query('limit') limit: number = 15, @Query('cursor') cursor?: string) {
		const userId = req?.session?.userId || null
		return this.postService.findAll({userId, limit, cursor})
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
	 * @param dto - Данные для обновления
	 * @returns Обновлённый пост
	 */
	@Authorization()
	@HttpCode(HttpStatus.OK)
	@Patch(':id')
	async update(
		@Param('id') id: string,
		@Authorized('id') userId: string,
		@Body() dto: UpdatePostDto
	) {
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
