import { Controller, Post, Body, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
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
}
