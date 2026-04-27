import { Module } from '@nestjs/common';
import { FollowService } from './follow.service';
import { FollowController } from './follow.controller';
import { UserModule } from '../../user/user.module';
import { NotificationModule } from '../../notification/notification.module';

@Module({
  imports: [UserModule, NotificationModule],
  controllers: [FollowController],
  providers: [FollowService],
  exports: [FollowService]
})
export class FollowModule {}
