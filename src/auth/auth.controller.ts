import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import type { Request, Response } from 'express';
import { LoginDto } from './dto/login.dto';
import { Recaptcha } from '@nestlab/google-recaptcha';
import { ProviderService } from './provider/provider.service';
import { ConfigService } from '@nestjs/config';
import { AuthProviderGuard } from './guards/provider.guard';
import { UserService } from 'src/user/user.service';


@Controller('auth')
export class AuthController {
  public constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
		private readonly providerService: ProviderService,
    private readonly userService: UserService
  ) {}


  @Recaptcha()
  @Post('register')
  @HttpCode(HttpStatus.OK)
  public async register(@Req() req: Request,@Body() dto: RegisterDto){
    return this.authService.register(req, dto)
  }


  @Recaptcha()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  public async login(@Req() req: Request,@Body() dto: LoginDto){
    return this.authService.login(req, dto)
  }

  	/**
	 * Обработка колбэка от провайдера аутентификации.
	 * @param req - Объект запроса Express.
	 * @param res - Объект ответа Express.
	 * @param code - Код авторизации, полученный от провайдера.
	 * @param provider - Название провайдера аутентификации.
	 * @returns Перенаправление на страницу настроек.
	 * @throws BadRequestException - Если код авторизации не был предоставлен.
	 */
  @UseGuards(AuthProviderGuard)
	@Get('/oauth/callback/:provider')
	public async callback(
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response,
		@Query('code') code: string,
		@Param('provider') provider: string
	) {
		if (!code) {
			throw new BadRequestException(
				'Не был предоставлен код авторизации.'
			)
		}

		await this.authService.extractProfileFromCode(req, provider, code)

		return res.redirect(
			`${this.configService.getOrThrow<string>('ALLOWED_ORIGIN')}/en/dashboard/settings`
		)
	}


  	/**
	 * Подключение пользователя к провайдеру аутентификации.
	 * @param provider - Название провайдера аутентификации.
	 * @returns URL для аутентификации через провайдера.
	 */
	@UseGuards(AuthProviderGuard)
	@Get('/oauth/connect/:provider')
	public async connect(@Param('provider') provider: string) {
		const providerInstance = this.providerService.findByService(provider)

		return {
			url: providerInstance?.getAuthUrl() ,
		}
	}

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  public async logout(@Req() req: Request, @Res({passthrough: true}) res: 
  Response){
    return this.authService.logout(req, res)
  }

  /**
   * Получить информацию о текущем пользователе из сессии
   * Используется Socket.IO Service для проверки аутентификации
   */
  @Get('me')
  @HttpCode(HttpStatus.OK)
  public async getCurrentUser(@Req() req: Request) {
    // Проверяем наличие сессии и userId
    const userId = (req.session as any)?.userId;
    
    if (!userId) {
      throw new BadRequestException('Not authenticated');
    }

    // Получаем полные данные пользователя
    const user = await this.userService.findById(userId);
    
    // Возвращаем необходимые данные для Socket.IO Service
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      lastSeen: user.lastSeen
    };
  }
    

}
