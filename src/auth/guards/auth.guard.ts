import {
	CanActivate,
	ExecutionContext,
	Injectable,
	Optional,
	UnauthorizedException
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { UserService } from '../../user/user.service'

/**
 * Guard для проверки аутентификации пользователя.
 * Поддерживает оба метода:
 * 1. Session-based (веб-приложение)
 * 2. JWT токены (мобильное приложение)
 */
@Injectable()
export class AuthGuard implements CanActivate {
	/**
	 * Конструктор охранителя аутентификации.
	 * @param userService - Сервис для работы с пользователями.
	 * @param jwtService - Сервис для работы с JWT токенами (опциональный).
	 */
	public constructor(
		private readonly userService: UserService,
		@Optional()
		private readonly jwtService?: JwtService
	) {}

	/**
	 * Проверяет, имеет ли пользователь доступ к ресурсу.
	 * Сначала пытается проверить JWT токен, затем сессию.
	 * @param context - Контекст выполнения, содержащий информацию о текущем запросе.
	 * @returns true, если пользователь аутентифицирован; в противном случае выбрасывает UnauthorizedException.
	 * @throws UnauthorizedException - Если пользователь не авторизован.
	 */
	public async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest()

		// Попытка проверить JWT токен (для мобильного приложения)
		if (this.jwtService) {
			const authHeader = request.headers.authorization
			const token = authHeader?.split(' ')?.[1]

			if (token) {
				try {
					const payload = this.jwtService.verify(token)
					const user = await this.userService.findById(payload.sub)

					if (user) {
						request.user = user
						return true
					}
				} catch (error) {
					// JWT невалиден, пытаемся проверить сессию дальше
				}
			}
		}

		// Попытка проверить сессию (для веб-приложения)
		if (typeof request.session?.userId !== 'undefined') {
			const user = await this.userService.findById(request.session.userId)

			if (user) {
				request.user = user
				return true
			}
		}

		// Ни JWT, ни сессия не найдены
		throw new UnauthorizedException(
			'Пользователь не авторизован. Пожалуйста, войдите в систему через JWT (мобильное приложение) или сессию (веб), чтобы получить доступ.'
		)
	}
}
