import { Module } from '@nestjs/common'



import { PasswordRecoveryController } from './password-recovery.controller'
import { PasswordRecoveryService } from './password-recovery.service'
import { UserService } from '../../user/user.service'
import { MailService } from '../../libs/mail/mail.service'
import { CloudinaryModule } from '../../cloudinary/cloudinary.module'

@Module({
	imports: [CloudinaryModule],
	controllers: [PasswordRecoveryController],
	providers: [PasswordRecoveryService, UserService, MailService]
})
export class PasswordRecoveryModule {}
