import { JwtModuleOptions } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'

export const getJwtConfig = (
	configService: ConfigService
): JwtModuleOptions => ({
	secret: configService.getOrThrow<string>('JWT_SECRET'),
	signOptions: {
		expiresIn: configService.getOrThrow('JWT_EXPIRATION')
	}
})
