import { IsNotEmpty, IsString, IsUUID } from 'class-validator'

export class CreateLikeDto {
	@IsNotEmpty({ message: 'Post ID обязателен' })
	@IsString()
	@IsUUID('4', { message: 'Post ID должен быть валидным UUID' })
	postId: string
}
