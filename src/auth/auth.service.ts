import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { UserService } from 'src/user/user.service';
import { AuthMethod, User } from '@prisma/client';
import { generateAvatar } from '../libs/common/utils/generateAvatar';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { Request, Response } from 'express';
import { LoginDto } from './dto/login.dto';
import { verify } from 'argon2';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProviderService } from './provider/provider.service';
import { EmailConfirmationService } from './email-confirmation/email-confirmation.service';
import { TwoFactorAuthService } from './two-factor-auth/two-factor-auth.service';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class AuthService {
	public constructor(
		private readonly userService: UserService,
		private readonly cloudinaryService: CloudinaryService,
		private readonly configService: ConfigService,
		private readonly prismaService: PrismaService,
		private readonly providerService: ProviderService,
		private readonly emailConfirmationService: EmailConfirmationService,
		private readonly twoFactorAuthService: TwoFactorAuthService,
		private readonly redisService: RedisService
	){}

	public async register(req: Request, dto: RegisterDto){
		const isExist = await  this.userService.findByEmail(dto.email)

		if(isExist){
			throw new ConflictException(' Registration failed. User with this email already exists. Please use another email or sign in.')
		}

	
		const avatarName = `${dto.name}_${Date.now()}`;
		const avatarBuffer = await generateAvatar(dto.name);

		const uploadResult = await this.cloudinaryService.uploadBuffer(
			avatarBuffer,
			avatarName,
						'mirchanAvatars'
					);

		const avatarUrl = uploadResult.secure_url;

		const newUser  = await this.userService.create(
			dto.email,
			dto.password,
			dto.name,
			AuthMethod.CREDENTIALS,
			false,
			avatarUrl
		)
		await this.emailConfirmationService.sendVerificationToken(newUser.email)
		return { message: 'Вы успешно зарегестрировались. Пожалуйста, проверьте вашу электронную почту, чтобы подтвердить адрес и активировать аккаунт.'}

	}

	public async login(req: Request, dto: LoginDto){
		const user = await this.userService.findByEmail(dto.email)

		if(!user || !user.password){
			throw new NotFoundException('Invalid email or password. Please try again or reset your password.')
		}

		const isValidPassword = await verify(user.password, dto.password)

		if(!isValidPassword){
			throw new NotFoundException('Invalid email or password. Please try again or reset your password.')
		}

		if(!user.isVerified){
			await this.emailConfirmationService.sendVerificationToken(user.email)
			throw new ConflictException('Your email is not verified. A new verification email has been sent to your email address. Please verify your email before logging in.')
		}

		if (user.isTwoFactorEnabled) {
			if (!dto.code) {
				await this.twoFactorAuthService.sendTwoFactorToken(user.email)

				return {
					message:
						'Проверьте вашу почту. Требуется код двухфакторной аутентификации.'
				}
			}

			await this.twoFactorAuthService.validateTwoFactorToken(
				user.email,
				dto.code
			)
		}

		return this.saveSession(req, user)
	}

	public async logout(req: Request, res: Response):Promise<void>{
		return new Promise((resolve, reject)=> {
			req.session.destroy(err=> {
				if(err){
					return reject(
						new InternalServerErrorException(
							'Logout failed. Unable to destroy session. Please check your session configuration.'
						)
					)
				}
				res.clearCookie(
					this.configService.getOrThrow<string>('SESSION_NAME')
				)
				resolve()
			}
		)
		})
	}
	public async extractProfileFromCode(
		req: Request,
		provider: string,
		code: string
	) {
		const providerInstance = this.providerService.findByService(provider)

		if (!providerInstance) {
			throw new NotFoundException(`OAuth provider '${provider}' not found or not supported.`)
		}

		const profile = await providerInstance.findUserByCode(code)

		const account = await this.prismaService.account.findFirst({
			where: {
				id: profile.id,
				provider: profile.provider
			}
		})

		let user = account?.userId
			? await this.userService.findById(account.userId)
			: null

		if (user) {
			return this.saveSession(req, user)
		}

		user = await this.userService.create(
			profile.email,
			'',
			profile.name,
			AuthMethod[profile.provider.toUpperCase()],
			true,
			profile.picture,
		)

		if (!account) {
			await this.prismaService.account.create({
				data: {
					userId: user.id,
					type: 'oauth',
					provider: profile.provider,
					accessToken: profile.access_token,
					refreshToken: profile.refresh_token,
					expiresAt: profile.expires_at || 0
				}
			})
		}

		return this.saveSession(req, user)
	}


	public async saveSession(req: Request, user: User) {
		return new Promise(async (resolve, reject) => {
			req.session.userId = user.id

			// Кэшируем данные пользователя для Socket.IO
			try {
				await this.redisService.cacheUserData(user.id, {
					id: user.id,
					name: user.username || user.name || 'Unknown',
					email: user.email,
					avatarUrl: user.avatarUrl,
					lastSeen: user.lastSeen || new Date()
				})
			} catch (cacheError) {
				console.error('Failed to cache user data:', cacheError)
				// Не прерываем логин из-за ошибки кэширования
			}

			req.session.save(err => {
				if (err) {
					return reject(
						new InternalServerErrorException(
							`Failed to save session. Please check your session configuration. Error: ${err.message}`
						)
					)
				}

				resolve({
					user
				})
			})
		})
	}

}
