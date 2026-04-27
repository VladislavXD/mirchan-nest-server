import { 
  Controller, 
  Get, 
  Patch, 
  Param, 
  Query, 
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { Authorization } from '../auth/decorators/auth.decorator';
import { Authorized } from '../auth/decorators/authorized.decorator';
import { GetNotificationsDto } from './dto/get-notifications.dto';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Authorization()
  @HttpCode(HttpStatus.OK)
  @Get()
  async getNotifications(
    @Authorized('id') userId: string,
    @Query() dto: GetNotificationsDto
  ) {
    return this.notificationService.getUserNotifications(userId, dto);
  }

  @Authorization()
  @HttpCode(HttpStatus.OK)
  @Get('unread-count')
  async getUnreadCount(@Authorized('id') userId: string) {
    return this.notificationService.getUnreadCount(userId);
  }

  @Authorization()
  @HttpCode(HttpStatus.OK)
  @Patch('read-all')
  async markAllAsRead(@Authorized('id') userId: string) {
    return this.notificationService.markAllAsRead(userId);
  }

  @Authorization()
  @HttpCode(HttpStatus.OK)
  @Patch(':id/read')
  async markAsRead(
    @Authorized('id') userId: string,
    @Param('id') id: string
  ) {
    return this.notificationService.markAsRead(id, userId);
  }
}
