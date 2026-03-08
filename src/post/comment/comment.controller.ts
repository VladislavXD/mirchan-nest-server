import { Controller, Post, Body, Param, Delete, HttpCode, HttpStatus, Get, Query } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Authorization } from 'src/auth/decorators/auth.decorator';
import { Authorized } from 'src/auth/decorators/authorized.decorator';

@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Authorization()
  @HttpCode(HttpStatus.OK)
  @Post()
  create(@Authorized('id') userId: string, @Body() dto: CreateCommentDto) {
    return this.commentService.create(userId, dto)
  }

  @Authorization()
  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  remove(@Authorized('id') userId: string, @Param('id') id: string) {
    return this.commentService.remove(id, userId)
  }

  /**
   * GET /comment/post/:postId/new - Новые комментарии
   */
  @Get('post/:id/new')
  getNewComment(
    @Param('id') id: string,
    @Query('cursor') cursor?: string,
    @Query('userId') userId?: string
  ) {
    return this.commentService.getNewComments(id, cursor, userId)
  }

  /**
   * GET /comment/post/:postId/old - Старые комментарии
   */
  @Get('post/:id/old')
  getOldComment(
    @Param('id') id: string,
    @Query('cursor') cursor?: string,
    @Query('userId') userId?: string
  ) {
    return this.commentService.getOldComments(id, cursor, userId)
  }

  /**
   * GET /comment/post/:postId/popular - Популярные комментарии
   */
  @Get('post/:id/popular')
  getPopularComment(
    @Param('id') id: string,
    @Query('cursor') cursor?: string,
    @Query('userId') userId?: string
  ) {
    return this.commentService.getPopularComments(id, cursor, userId)
  }

  /**
   * GET /comment/post/:postId - Получить комментарии поста
   */
  @Get('post/:postId')
  getPostComments(
    @Param('postId') postId: string,
    @Query('userId') currentUserId?: string
  ) {
    return this.commentService.getPostComments(postId, currentUserId)
  }
  /**
   * POST /comment/reply - Создать ответ на комментарий
   */
  @Authorization()
  @HttpCode(HttpStatus.OK)
  @Post('reply')
  createReply(
    @Authorized('id') userId: string, 
    @Body() dto: CreateCommentDto & { replyToId: string }
  ) {
    return this.commentService.createReply(userId, dto)
  }

  /**
   * GET /comment/:commentId/replies - Получить ответы на комментарий
   */
  @Get(':commentId/replies')
  getCommentReplies(
    @Param('commentId') commentId: string,
    @Query('userId') currentUserId?: string
  ) {
    return this.commentService.getCommentReplies(commentId, currentUserId)
  }
}
