import { Module } from '@nestjs/common';
import { FollowService } from './follow.service';
import { FollowController } from './follow.controller';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [UserModule],
  controllers: [FollowController],
  providers: [FollowService],
  exports: [FollowService]
})
export class FollowModule {}
