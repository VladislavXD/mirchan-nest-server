import { IsBoolean, IsEmail, IsNotEmpty, IsString, IsOptional } from 'class-validator'
import { Transform } from 'class-transformer'

/**
 * DTO для обновления данных пользователя.
 */
export class UpdateUserDto {
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
	 * Имя пользователя.
	 * @example Иван Иванов
	 */
	@IsOptional()
	@IsString({ message: 'Имя должно быть строкой.' })
	name?: string

	/**
	 * Email пользователя.
	 * @example example@example.com
	 */
	@IsOptional()
	@IsString({ message: 'Email должен быть строкой.' })
	@IsEmail({}, { message: 'Некорректный формат email.' })
	email?: string

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


	@IsOptional()
	dateOfBirth?: Date

	@IsOptional()
	@IsString({message: 'Биография должна быть строкой'})
	bio?: string

	@IsOptional()
	@IsString({message: 'Статус должен быть строкой'})
	status?: string

	@IsOptional()
	@IsString({message: 'Имя пользователя должно быть строкой'})
	username?: string

	@IsOptional()
	@IsString({message: 'backgroundUrl должен быть строкой'})
	backgroundUrl?: string

	@IsOptional()
	@IsString({message: 'usernameFrameUrl должен быть строкой'})
	usernameFrameUrl?: string

	@IsOptional()
	@IsString({message: 'avatarFrameUrl должен быть строкой'})
	avatarFrameUrl?: string

	@IsOptional()
	@IsString({message: 'локация должна быть строкой'})
	location?: string


}
