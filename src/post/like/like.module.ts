import { Module } from '@nestjs/common'
import { LikeService } from './like.service'
import { LikeController } from './like.controller'
import { PrismaModule } from 'src/prisma/prisma.module'
import { AuthModule } from 'src/auth/auth.module'
import { UserModule } from 'src/user/user.module'

@Module({
	imports: [PrismaModule, AuthModule, UserModule],
	controllers: [LikeController],
	providers: [LikeService],
	exports: [LikeService]
})
export class LikeModule {}
