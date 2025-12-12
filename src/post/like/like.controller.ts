import { Body, Controller, Delete, Param, Post } from '@nestjs/common'
import { LikeService } from './like.service'
import { CreateLikeDto } from './dto/create-like.dto'
import { Authorization } from 'src/auth/decorators/auth.decorator'
import { Authorized } from 'src/auth/decorators/authorized.decorator'

@Controller('likes')
export class LikeController {
	constructor(private readonly likeService: LikeService) {}

	/**
	 * POST /likes - Поставить лайк на пост
	 */
	@Post()
	@Authorization()
	async likePost(
		@Authorized('id') userId: string,
		@Body() dto: CreateLikeDto
	) {
		return this.likeService.likePost(userId, dto)
	}

	/**
	 * DELETE /likes/:postId - Убрать лайк с поста
	 */
	@Delete(':postId')
	@Authorization()
	async unlikePost(
		@Authorized('id') userId: string,
		@Param('postId') postId: string
	) {
		return this.likeService.unlikePost(userId, postId)
	}
}
