import 'dotenv/config'
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

/**
 * Сервис для работы с Prisma.
 *
 * Управляет соединением с базой данных в рамках жизненного цикла модуля.
 */
@Injectable()
export class PrismaService
	extends PrismaClient
	implements OnModuleInit, OnModuleDestroy
{
	// Prisma 7 берёт конфигурацию из prisma.config.ts и переменных окружения
	// Дополнительная передача URL через конструктор не поддерживается (datasourceUrl/datasources удалены)
	/**
	 * Устанавливает соединение с базой данных при инициализации модуля.
	 *
	 * @returns Промис, который разрешается после подключения.
	 */
	public async onModuleInit(): Promise<void> {
		await this.$connect()
	}

	/**
	 * Закрывает соединение с базой данных при уничтожении модуля.
	 *
	 * @returns Промис, который разрешается после отключения.
	 */
	public async onModuleDestroy(): Promise<void> {
		await this.$disconnect()
	}
}
