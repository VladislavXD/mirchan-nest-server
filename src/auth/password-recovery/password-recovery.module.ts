import { Module } from '@nestjs/common'



import { PasswordRecoveryController } from './password-recovery.controller'
import { PasswordRecoveryService } from './password-recovery.service'
import { UserService } from 'src/user/user.service'
import { MailService } from 'src/libs/mail/mail.service'
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module'

@Module({
	imports: [CloudinaryModule],
	controllers: [PasswordRecoveryController],
	providers: [PasswordRecoveryService, UserService, MailService]
})
export class PasswordRecoveryModule {}
