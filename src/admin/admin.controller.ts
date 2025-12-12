import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AdminService } from './admin.service';
import { Authorization } from '../auth/decorators/auth.decorator';
import { Authorized } from '../auth/decorators/authorized.decorator';
import {
  PaginationQueryDto,
  GetUsersQueryDto,
  UpdateUserRoleDto,
  UpdateUserDto,
  CreateBoardDto,
  UpdateBoardDto,
} from './dto/admin.dto';

/**
 * Контроллер для административных функций.
 * Доступ ко всем эндпоинтам требует роли ADMIN.
 */
@Controller('admin')
@Authorization(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ============ СТАТИСТИКА ============

  /**
   * Получить общую статистику системы
   * GET /admin/stats
   */
  @Get('stats')
  async getStats() {
    return this.adminService.getStats();
  }

  // ============ ПОЛЬЗОВАТЕЛИ ============

  /**
   * Получить список пользователей с фильтрацией и пагинацией
   * GET /admin/users?page=1&limit=20&search=&role=&sortBy=createdAt&sortOrder=desc
   */
  @Get('users')
  async getUsers(@Query() query: GetUsersQueryDto) {
    return this.adminService.getUsers(query);
  }

  /**
   * Обновить данные пользователя
   * PUT /admin/users/:userId
   */
  @Put('users/:userId')
  async updateUser(
    @Param('userId') userId: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.adminService.updateUser(userId, dto);
  }

  /**
   * Удалить пользователя
   * DELETE /admin/users/:userId
   */
  @Delete('users/:userId')
  @HttpCode(HttpStatus.OK)
  async deleteUser(
    @Authorized('id') requestingUserId: string,
    @Param('userId') userId: string,
  ) {
    return this.adminService.deleteUser(requestingUserId, userId);
  }

  /**
   * Обновить роль пользователя
   * PUT /admin/users/:userId/role
   */
  @Put('users/:userId/role')
  async updateUserRole(
    @Param('userId') userId: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.adminService.updateUserRole(userId, dto);
  }

  /**
   * Переключить статус активности пользователя
   * PATCH /admin/users/:userId/status
   */
  @Patch('users/:userId/status')
  async toggleUserStatus(@Param('userId') userId: string) {
    return this.adminService.toggleUserStatus(userId);
  }

  // ============ ДОСКИ ============

  /**
   * Получить список досок с пагинацией
   * GET /admin/boards?page=1&limit=20&search=&sortBy=createdAt&sortOrder=desc
   */
  @Get('boards')
  async getBoards(@Query() query: PaginationQueryDto) {
    return this.adminService.getBoards(query);
  }

  /**
   * Создать новую доску
   * POST /admin/boards
   */
  @Post('boards')
  @HttpCode(HttpStatus.CREATED)
  async createBoard(@Body() dto: CreateBoardDto) {
    return this.adminService.createBoard(dto);
  }

  /**
   * Обновить доску
   * PUT /admin/boards/:boardId
   */
  @Put('boards/:boardId')
  async updateBoard(
    @Param('boardId') boardId: string,
    @Body() dto: UpdateBoardDto,
  ) {
    return this.adminService.updateBoard(boardId, dto);
  }

  /**
   * Удалить доску
   * DELETE /admin/boards/:boardId
   */
  @Delete('boards/:boardId')
  @HttpCode(HttpStatus.OK)
  async deleteBoard(@Param('boardId') boardId: string) {
    return this.adminService.deleteBoard(boardId);
  }

  // ============ ТРЕДЫ ============

  /**
   * Получить список тредов с пагинацией
   * GET /admin/threads?page=1&limit=20&search=&sortBy=createdAt&sortOrder=desc
   */
  @Get('threads')
  async getThreads(@Query() query: PaginationQueryDto) {
    return this.adminService.getThreads(query);
  }

  /**
   * Удалить тред
   * DELETE /admin/threads/:threadId
   */
  @Delete('threads/:threadId')
  @HttpCode(HttpStatus.OK)
  async deleteThread(@Param('threadId') threadId: string) {
    return this.adminService.deleteThread(threadId);
  }

  // ============ ОТВЕТЫ ============

  /**
   * Получить список ответов с пагинацией
   * GET /admin/replies?page=1&limit=20&search=&sortBy=createdAt&sortOrder=desc
   */
  @Get('replies')
  async getReplies(@Query() query: PaginationQueryDto) {
    return this.adminService.getReplies(query);
  }

  /**
   * Удалить ответ
   * DELETE /admin/replies/:replyId
   */
  @Delete('replies/:replyId')
  @HttpCode(HttpStatus.OK)
  async deleteReply(@Param('replyId') replyId: string) {
    return this.adminService.deleteReply(replyId);
  }

  // ============ МЕДИАФАЙЛЫ ============

  /**
   * Получить список медиафайлов с пагинацией
   * GET /admin/media?page=1&limit=20&search=&sortBy=createdAt&sortOrder=desc
   */
  @Get('media')
  async getMediaFiles(@Query() query: PaginationQueryDto) {
    return this.adminService.getMediaFiles(query);
  }
}
