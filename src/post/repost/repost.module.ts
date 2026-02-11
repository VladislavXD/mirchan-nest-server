import { Module } from '@nestjs/common';
import { RepostService } from './repost.service';
import { RepostController, UserRepostController } from './repost.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UserModule } from 'src/user/user.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    PrismaModule,
    UserModule,
    AuthModule
  ],
  controllers: [RepostController, UserRepostController],
  providers: [RepostService],
  exports: [RepostService]
})
export class RepostModule {}
