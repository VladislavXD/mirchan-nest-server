import { 
	Controller, 
	Post, 
	Delete, 
	Get, 
	Param, 
	UseGuards, 
	Req, 
	Query,
	HttpCode,
	HttpStatus
} from '@nestjs/common';
import { FollowService } from './follow.service';
import { AuthGuard } from '../../auth/guards/auth.guard';

@Controller('follow')
@UseGuards(AuthGuard)
export class FollowController {
	constructor(private readonly followService: FollowService) {}

	/**
	 * Подписаться на пользователя
	 * POST /follow/:userId
	 */
	@Post(':userId')
	@HttpCode(HttpStatus.CREATED)
	async followUser(
		@Param('userId') userId: string,
		@Req() req: any
	) {
		const followerId = req.user.id;
		return this.followService.followUser(followerId, userId);
	}

	/**
	 * Отписаться от пользователя
	 * DELETE /follow/:userId
	 */
	@Delete(':userId')
	@HttpCode(HttpStatus.OK)
	async unfollowUser(
		@Param('userId') userId: string,
		@Req() req: any
	) {
		const followerId = req.user.id;
		return this.followService.unfollowUser(followerId, userId);
	}

	/**
	 * Получить список подписчиков пользователя
	 * GET /follow/:userId/followers
	 */
	@Get(':userId/followers')
	async getFollowers(
		@Param('userId') userId: string,
		@Query('page') page?: string,
		@Query('limit') limit?: string
	) {
		const pageNum = page ? parseInt(page, 10) : 1;
		const limitNum = limit ? parseInt(limit, 10) : 20;
		return this.followService.getFollowers(userId, pageNum, limitNum);
	}

	/**
	 * Получить список подписок пользователя
	 * GET /follow/:userId/following
	 */
	@Get(':userId/following')
	async getFollowing(
		@Param('userId') userId: string,
		@Query('page') page?: string,
		@Query('limit') limit?: string
	) {
		const pageNum = page ? parseInt(page, 10) : 1;
		const limitNum = limit ? parseInt(limit, 10) : 20;
		return this.followService.getFollowing(userId, pageNum, limitNum);
	}

	/**
	 * Проверить, подписан ли текущий пользователь на другого
	 * GET /follow/:userId/is-following
	 */
	@Get(':userId/is-following')
	async isFollowing(
		@Param('userId') userId: string,
		@Req() req: any
	) {
		const followerId = req.user.id;
		const isFollowing = await this.followService.isFollowing(followerId, userId);
		return { isFollowing };
	}

	/**
	 * Получить статистику подписок пользователя
	 * GET /follow/:userId/stats
	 */
	@Get(':userId/stats')
	async getFollowStats(
		@Param('userId') userId: string
	) {
		return this.followService.getFollowStats(userId);
	}
}
