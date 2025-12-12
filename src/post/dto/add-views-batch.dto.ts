import { IsNotEmpty, IsArray, ArrayMaxSize } from 'class-validator'

/**
 * DTO для батчевого добавления просмотров постов.
 */
export class AddViewsBatchDto {
	/**
	 * Массив ID постов для добавления просмотров.
	 * Максимум 20 постов за раз.
	 * @example ["550e8400-e29b-41d4-a716-446655440000", "550e8400-e29b-41d4-a716-446655440001"]
	 */
	@IsNotEmpty({ message: 'Массив ID постов обязателен' })
	@IsArray({ message: 'postIds должен быть массивом' })
	@ArrayMaxSize(20, { message: 'Слишком много постов в батче (максимум 20)' })
	postIds: string[]
}
