import {
	CanActivate,
	ExecutionContext,
	Injectable,
	UnauthorizedException
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { UserService } from '../../user/user.service'

/**
 * JWT Guard для проверки JWT токенов в Authorization заголовке.
 * Используется для мобильного приложения.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
	public constructor(
		private readonly jwtService: JwtService,
		private readonly userService: UserService
	) {}

	/**
	 * Проверяет наличие и валидность JWT токена.
	 * @param context - Контекст выполнения.
	 * @returns true, если токен валиден; в противном случае выбрасывает UnauthorizedException.
	 * @throws UnauthorizedException - Если токен отсутствует, невалиден или юзер не найден.
	 */
	public async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest()

		// Извлекаем токен из заголовка Authorization
		const authHeader = request.headers.authorization
		const token = authHeader?.split(' ')?.[1] // "Bearer token_here"

		if (!token) {
			throw new UnauthorizedException(
				'JWT токен не предоставлен. Используйте заголовок: Authorization: Bearer <token>'
			)
		}

		try {
			// Проверяем и декодируем JWT токен
			const payload = this.jwtService.verify(token)

			// Получаем пользователя из БД
			const user = await this.userService.findById(payload.sub)

			if (!user) {
				throw new UnauthorizedException(
					'Пользователь не найден.'
				)
			}

			// Сохраняем пользователя в request для использования в контроллерах
			request.user = user

			return true
		} catch (error) {
			throw new UnauthorizedException(
				`Ошибка при проверке JWT токена: ${error.message}`
			)
		}
	}
}
