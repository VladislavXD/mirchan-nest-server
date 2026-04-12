import { IsBoolean, IsEmail, IsNotEmpty, IsString, IsOptional } from 'class-validator'
import { Transform } from 'class-transformer'

/**
 * DTO для обновления данных пользователя.
 */
export class UpdateUserDto {
	// ============= АВАТАР =============

	/**
	 * Буфер файла аватарки (приходит из FileInterceptor).
	 * Передается контроллером, не валидируется class-validator.
	 */
	avatarBuffer?: Buffer

	/**
	 * Исходное имя загруженного файла.
	 */
	avatarOriginalFilename?: string

	/**
	 * URL фрейма аватарки (декорация вокруг аватара).
	 */
	@IsOptional()
	@IsString({ message: 'avatarFrameUrl должен быть строкой' })
	avatarFrameUrl?: string

	// ============= ОСНОВНАЯ ИНФОРМАЦИЯ =============

	/**
	 * Имя пользователя (full name).
	 * @example Иван Иванов
	 */
	@IsOptional()
	@IsString({ message: 'Имя должно быть строкой.' })
	name?: string

	/**
	 * Уникальное имя пользователя (username).
	 * @example ivan_ivanov
	 */
	@IsOptional()
	@IsString({ message: 'Имя пользователя должно быть строкой' })
	username?: string

	/**
	 * Email пользователя.
	 * @example example@example.com
	 */
	@IsOptional()
	@IsString({ message: 'Email должен быть строкой.' })
	@IsEmail({}, { message: 'Некорректный формат email.' })
	email?: string

	/**
	 * Дата рождения пользователя.
	 * @example 1990-01-15
	 */
	@IsOptional()
	dateOfBirth?: Date

	/**
	 * Географическое местоположение пользователя.
	 * @example Москва, Россия
	 */
	@IsOptional()
	@IsString({ message: 'Локация должна быть строкой' })
	location?: string

	// ============= ПЕРСОНАЛИЗАЦИЯ ПРОФИЛЯ =============

	/**
	 * Биография пользователя (описание профиля).
	 * @example Разработчик Flutter | Увлекаюсь путешествиями
	 */
	@IsOptional()
	@IsString({ message: 'Биография должна быть строкой' })
	bio?: string

	/**
	 * Статус пользователя (текущее настроение/активность).
	 * @example 🎮 Играю в видеоигры
	 */
	@IsOptional()
	@IsString({ message: 'Статус должен быть строкой' })
	status?: string

	/**
	 * URL фонового изображения профиля.
	 */
	@IsOptional()
	@IsString({ message: 'backgroundUrl должен быть строкой' })
	backgroundUrl?: string

	/**
	 * URL фрейма имени пользователя (декорация вокруг username).
	 */
	@IsOptional()
	@IsString({ message: 'usernameFrameUrl должен быть строкой' })
	usernameFrameUrl?: string

	// ============= БЕЗОПАСНОСТЬ =============

	/**
	 * Флаг, указывающий, включена ли двухфакторная аутентификация.
	 */
	@IsOptional()
	@Transform(({ value }) => {
		// Преобразование строки из multipart/form-data в boolean
		if (value === '' || value === null || typeof value === 'undefined') return undefined
		if (typeof value === 'boolean') return value
		if (typeof value === 'string') {
			const v = value.toLowerCase().trim()
			if (['true', '1', 'yes', 'on'].includes(v)) return true
			if (['false', '0', 'no', 'off'].includes(v)) return false
		}
		return value // Вернём как есть, валидатор потом сообщит об ошибке
	})
	@IsBoolean({ message: 'isTwoFactorEnabled должно быть булевым значением.' })
	isTwoFactorEnabled?: boolean
}
