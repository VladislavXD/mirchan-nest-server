import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseInterceptors,
  UploadedFiles,
  ParseIntPipe,
  DefaultValuePipe,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ForumService } from './forum.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { CreateThreadDto } from './dto/create-thread.dto';
import { CreateReplyDto } from './dto/create-reply.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateTagDto } from './dto/create-tag.dto';
import { getRealIp } from './utils/forum.utils';
import type { Request } from 'express';

@Controller('forum')
export class ForumController {
  constructor(private readonly forumService: ForumService) {}

  // ═══════════════════════════════════════════════════════════════
  // BOARDS
  // ═══════════════════════════════════════════════════════════════

  @Get('boards')
  getBoards() {
    return this.forumService.getBoards();
  }

  @Get('boards/:boardName')
  getBoardByName(@Param('boardName') boardName: string) {
    return this.forumService.getBoardByName(boardName);
  }

  @Get('boards/:boardName/full')
  getBoardThreads(
    @Param('boardName') boardName: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('tag') tagSlug?: string,
  ) {
    return this.forumService.getBoardThreads(boardName, page, tagSlug);
  }

  @Post('boards')
  createBoard(@Body() createBoardDto: CreateBoardDto) {
    return this.forumService.createBoard(createBoardDto);
  }

  @Put('boards/:boardName')
  updateBoard(
    @Param('boardName') boardName: string,
    @Body() updateBoardDto: UpdateBoardDto,
  ) {
    return this.forumService.updateBoard(boardName, updateBoardDto);
  }

  @Delete('boards/:boardName')
  deactivateBoard(@Param('boardName') boardName: string) {
    return this.forumService.deactivateBoard(boardName);
  }

  // ═══════════════════════════════════════════════════════════════
  // THREADS
  // ═══════════════════════════════════════════════════════════════

  @Get('boards/:boardName/threads/:threadId')
  getThread(
    @Param('boardName') boardName: string,
    @Param('threadId') threadId: string,
  ) {
    return this.forumService.getThread(boardName, threadId);
  }

  @Post('boards/:boardName/threads')
  @UseInterceptors(FilesInterceptor('images', 5))
  async createThread(
    @Param('boardName') boardName: string,
    @Body() createThreadDto: CreateThreadDto,
    @UploadedFiles() files: any[],
    @Req() request: Request,
  ) {
    try {
      const ip = getRealIp(request);
      console.log('Headers:', request.headers);
      console.log('Body:', request.body);
      console.log('Files:', files);
      return this.forumService.createThread(
        boardName,
        createThreadDto,
        ip,
        files,
      );
    } catch (error) {
      console.error('Error in createThread:', error);
      throw new BadRequestException('Invalid request format. Ensure you are using multipart/form-data.');
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // REPLIES
  // ═══════════════════════════════════════════════════════════════

  @Post('boards/:boardName/threads/:threadId/replies')
  @UseInterceptors(FilesInterceptor('images', 5))
  async createReply(
    @Param('boardName') boardName: string,
    @Param('threadId') threadId: string,
    @Body() createReplyDto: CreateReplyDto,
    @UploadedFiles() files: any[],
    @Req() request: Request,
  ) {
    const ip = getRealIp(request);
    return this.forumService.createReply(
      boardName,
      threadId,
      createReplyDto,
      ip,
      files,
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // CATEGORIES
  // ═══════════════════════════════════════════════════════════════

  @Get('categories')
  getCategories() {
    return this.forumService.getCategories();
  }

  @Get('categories/:slug')
  getCategoryBySlug(@Param('slug') slug: string) {
    return this.forumService.getCategoryBySlug(slug);
  }

  @Post('categories')
  createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return this.forumService.createCategory(createCategoryDto);
  }

  // ═══════════════════════════════════════════════════════════════
  // TAGS
  // ═══════════════════════════════════════════════════════════════

  @Get('tags')
  getTags() {
    return this.forumService.getTags();
  }

  @Post('tags')
  createTag(@Body() createTagDto: CreateTagDto) {
    return this.forumService.createTag(createTagDto);
  }

  // ═══════════════════════════════════════════════════════════════
  // STATS
  // ═══════════════════════════════════════════════════════════════

  @Get('stats')
  getForumStats() {
    return this.forumService.getForumStats();
  }

  @Get('posts/latest')
  getLatestPosts(@Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number) {
    return this.forumService.getLatestPosts(limit);
  }
}
