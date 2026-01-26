import { Controller, Post, Body, HttpCode, HttpStatus, Get, Req, Delete, Param } from '@nestjs/common';
import { NoticeService } from './notice.service';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { Authorization } from '../auth/decorators/auth.decorator';
import { UserRole } from '@prisma/client';

@Controller('notices')
export class NoticeController {
  constructor(private readonly noticeService: NoticeService) {}



  /**
   * Получение всех уведомлений — доступно только администраторам
   */
  @Authorization(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @Get('admin')
  async findAll() {
    return this.noticeService.findAll();
  }

  /**
   * Получение активных уведомлений (active=true и expiredAt > now)
   */
  @HttpCode(HttpStatus.OK)
  @Get()
  async findActive() {
    return this.noticeService.findActive();
  }

  /**
   * Создание notice — доступно только администраторам
   */
  @Authorization(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @Post()
  async create(@Req() req: any, @Body() dto: CreateNoticeDto) {
    const adminId = req?.session?.userId;
    return this.noticeService.create(adminId, dto);
  }

  
  /**   * Удаление notice — доступно только администраторам
   */
  @Authorization(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.noticeService.deleteNotice(id);
  }
}
