import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
  Request
} from '@nestjs/common';
import { RepostService } from './repost.service';
import { Authorization } from 'src/auth/decorators/auth.decorator';
import { Authorized } from 'src/auth/decorators/authorized.decorator';


/**
 * Контроллер для управления репостами постов
 */
@Controller('posts/:postId/reposts')
@Authorization()
export class RepostController {
  constructor(private readonly repostService: RepostService) {}

  /**
   * POST /posts/:postId/reposts - Создать репост
   */
  @Post()
  async createRepost(
    @Param('postId') postId: string,
    @Body('comment') comment: string | undefined,
    @Authorized('id') userId: string
  ) {
    return this.repostService.create(userId, postId, comment);
  }

  /**
   * DELETE /posts/:postId/reposts - Удалить репост
   */
  @Delete()
  async deleteRepost(
    @Param('postId') postId: string,
    @Authorized('id') userId: string
  ) {
    return this.repostService.delete(userId, postId);
  }

  /**
   * GET /posts/:postId/reposts - Получить пользователей, которые репостили
   */
  @Get()
  async getReposters(
    @Param('postId') postId: string,
    @Query('limit') limit?: string
  ) {
    return this.repostService.getPostReposters(
      postId,
      limit ? parseInt(limit) : 20
    );
  }

  /**
   * GET /posts/:postId/reposts/check - Проверить, репостил ли текущий пользователь
   */
  @Get('check')
  async checkRepost(
    @Param('postId') postId: string,
    @Authorized('id') userId: string
  ) {
    const hasReposted = await this.repostService.hasReposted(
      userId,
      postId
    );
    return { hasReposted };
  }
}

/**
 * Контроллер для репостов пользователя
 */
@Controller('users/:userId/reposts')
export class UserRepostController {
  constructor(private readonly repostService: RepostService) {}

  /**
   * GET /users/:userId/reposts - Получить репосты пользователя
   */
  @Get()
  async getUserReposts(
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.repostService.getUserReposts(
      userId,
      limit ? parseInt(limit) : 20,
      cursor
    );
  }
}
