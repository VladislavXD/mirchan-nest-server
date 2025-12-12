import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { IS_DEV_ENV } from './libs/common/utils/is-dev.util';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { RedisModule } from './redis/redis.module';
import { PostModule } from './post/post.module';
import { ProviderModule } from './auth/provider/provider.module';
import { MailModule } from './libs/mail/mail.module';
import { EmailConfirmationModule } from './auth/email-confirmation/email-confirmation.module';
import { PasswordRecoveryModule } from './auth/password-recovery/password-recovery.module';
import { TwoFactorAuthModule } from './auth/two-factor-auth/two-factor-auth.module';
import { FollowModule } from './user/follow/follow.module';
import { CommentModule } from './post/comment/comment.module';
import { LikeModule } from './post/like/like.module';
import { NewsModule } from './news/news.module';
import { ForumModule } from './forum/forum.module';
import { ChatModule } from './chat/chat.module';
import { AdminModule } from './admin/admin.module';
import { ScheduleModule } from '@nestjs/schedule';



@Module({
  imports: [
    ConfigModule.forRoot({
      ignoreEnvFile: !IS_DEV_ENV,
      isGlobal: true
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    RedisModule,
    CloudinaryModule,
    AuthModule,
    UserModule,
    PostModule,
    ProviderModule,
    MailModule,
    EmailConfirmationModule,
    PasswordRecoveryModule,
    TwoFactorAuthModule,
    FollowModule,
    CommentModule,
    LikeModule,
    NewsModule,
    ForumModule,
    ChatModule,
    AdminModule
  ],
})
export class AppModule {}
