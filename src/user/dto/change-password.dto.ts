import { IsString, MinLength } from 'class-validator'

/**
 * DTO для смены пароля пользователя в настройках
 */
export class ChangePasswordDto {
	@IsString({ message: 'Текущий пароль должен быть строкой' })
	@MinLength(6, { message: 'Текущий пароль должен содержать минимум 6 символов' })
	currentPassword: string

	@IsString({ message: 'Новый пароль должен быть строкой' })
	@MinLength(6, { message: 'Новый пароль должен содержать минимум 6 символов' })
	newPassword: string
}
