import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Query, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';
import { Authorized } from '../auth/decorators/authorized.decorator';
import { Authorization } from '../auth/decorators/auth.decorator';
import { UserRole } from '@prisma/client';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}
 

  /**
	 * Получает профиль текущего пользователя.
	 * @param userId - ID авторизованного пользователя.
	 * @returns Профиль пользователя.
	 */
	@Authorization()
	@HttpCode(HttpStatus.OK)
	@Get('profile')
	public async findProfile(@Authorized('id') userId: string) {
		return this.userService.findById(userId)
	}

	/**
	 * Получает пользователя по ID (доступно только администраторам).
	 * @param id - ID пользователя.
	 * @returns Найденный пользователь.
	 */ 
	@Authorization(UserRole.ADMIN)
	@HttpCode(HttpStatus.OK)
	@Get('by-id/:id')
	public async findById(@Param('id') id: string) {
		return this.userService.findById(id)
	}


	/**
	 * Умный поиск пользователей
	 * Поддерживает:
	 * - @упоминания (начинается с @)
	 * - Поиск по имени и email (case-insensitive)
	 * - Нормализация Unicode (ё→е, é→e)
	 * - Ранжирование по релевантности для @-запросов
	 * 
	 * @param query - Поисковый запрос (может начинаться с @)
	 * @returns Список пользователей с количеством подписчиков
	 * 
	 * @example
	 * GET /users/search?query=@john
	 * GET /users/search?query=иван
	 */
	@HttpCode(HttpStatus.OK)
	@Get('search')
	public async searchUsers(@Query('query') query: string) {
		return this.userService.searchUser(query)
	}

	

	// получает пользователя по публичному ID с определенными данные для отображения другим пользователям передается @param userId - publicId пользователя
	@HttpCode(HttpStatus.OK)
	@Get('/:id')
	public async findByPublicId(@Param('id') id: string) {
		return this.userService.findByPublicId(id)
	}

	/**
	 * Обновляет профиль текущего пользователя.
	 * Поддерживает:
	 * - Загрузку нового файла аватара (multipart/form-data, поле "avatar")
	 * - Обновление всех остальных полей профиля
	 * 
	 * При загрузке нового аватара старый автоматически удаляется из Cloudinary.
	 * 
	 * @param userId - ID авторизованного пользователя.
	 * @param file - Загруженный файл аватара (опционально).
	 * @param dto - Данные для обновления профиля.
	 * @returns Обновленный профиль пользователя.
	 */
	@Authorization()
	@HttpCode(HttpStatus.OK)
	@Patch('profile')
	@UseInterceptors(FileInterceptor('avatar', {
		limits: {
			fileSize: 5 * 1024 * 1024, // 5MB максимум
		},
		fileFilter: (req, file, callback) => {
			// Разрешаем только изображения
			if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
				return callback(
					new BadRequestException('Разрешены только файлы изображений (jpg, jpeg, png, gif, webp)'),
					false
				);
			}
			callback(null, true);
		}
	}))
	public async updateProfile(
		@Authorized('id') userId: string,
		@UploadedFile() file: any,
		@Body() dto: UpdateUserDto
	) {
		// Если загружен файл, добавляем его buffer и имя в DTO
		if (file) {
			dto.avatarBuffer = file.buffer;
			dto.avatarOriginalFilename = file.originalname;
		}

		return this.userService.update(userId, dto)
	}

	

}
