import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UserModule } from '../user/user.module';

/**
 * Модуль администрирования.
 * Предоставляет функциональность управления пользователями, досками, тредами и медиафайлами.
 */
@Module({
  imports: [PrismaModule, UserModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
