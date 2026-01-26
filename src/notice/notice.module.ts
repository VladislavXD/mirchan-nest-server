import { Module } from '@nestjs/common';
import { NoticeService } from './notice.service';
import { NoticeController } from './notice.controller';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  controllers: [NoticeController],
  providers: [NoticeService],
})
export class NoticeModule {}
