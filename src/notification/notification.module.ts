import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [PrismaModule, RedisModule, AuthModule, UserModule],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
