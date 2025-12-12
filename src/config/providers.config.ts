import { ConfigService } from '@nestjs/config'

import { TypeOptions } from 'src/auth/provider/provider.constants'
import { GoogleProvider } from 'src/auth/provider/services/google.provider'
import { YandexProvider } from 'src/auth/provider/services/yandex.provider'

/**
 * Конфигурация для провайдеров OAuth.
 *
 * Эта функция асинхронно извлекает параметры конфигурации из ConfigService
 * и формирует объект конфигурации для OAuth провайдеров.
 *
 * @param configService - Сервис для работы с конфигурацией приложения.
 * @returns Объект конфигурации для провайдеров OAuth.
 */
export const getProvidersConfig = async (
	configService: ConfigService
): Promise<TypeOptions> => ({
	baseUrl: configService.getOrThrow<string>('APPLICATION_URL'),
	services: [
		new GoogleProvider({
			client_id: configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
			client_secret: configService.getOrThrow<string>(
				'GOOGLE_CLIENT_SECRET'
			),
			scopes: ['email', 'profile', 'openid']
		}),
		new YandexProvider({
			client_id: configService.getOrThrow<string>('YANDEX_CLIENT_ID'),
			client_secret: configService.getOrThrow<string>(
				'YANDEX_CLIENT_SECRET'
			),
			scopes: ['login:email', 'login:avatar', 'login:info']
		})
	]
})
