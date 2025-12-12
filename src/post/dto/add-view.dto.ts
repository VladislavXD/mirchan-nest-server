import { IsNotEmpty, IsString } from 'class-validator'

/**
 * DTO для добавления единичного просмотра поста.
 */
export class AddViewDto {
	/**
	 * ID поста для добавления просмотра.
	 * @example "550e8400-e29b-41d4-a716-446655440000"
	 */
	@IsNotEmpty({ message: 'ID поста обязателен' })
	@IsString({ message: 'ID поста должен быть строкой' })
	postId: string
}
