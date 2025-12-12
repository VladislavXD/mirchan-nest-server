import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthMethod } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {hash} from 'argon2'
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { generateAvatar } from 'src/libs/common/utils/generateAvatar';
import { UpdateUserDto } from './dto/update-user.dto';


@Injectable()
export class UserService {
	public constructor(
		private readonly prismaService: PrismaService,
		private readonly cloudinaryService: CloudinaryService
	){} 

	public async findById(id: string){
		const user = await this.prismaService.user.findUnique({
			where: {id},
			include: {
				accounts: true,
				
				followers: true,
				following: true,
				_count: {
					select: {
						post: true,
						followers: true,
						following: true
					}
				}
			}
		})
		if (!user){
			throw new NotFoundException('User not found. Please check the entered data.')
		}

	
		return user
	}

	public async findByPublicId(userId: string){
		const user = await this.prismaService.user.findUnique({
			where: {id: userId},
			include: {
				accounts: true,
				followers: true,
				following: true,
				_count: {
					select: {
						post: true,
						followers: true,
						following: true
					}
				}
			}
		})
		if (!user){
			throw new NotFoundException('User not found. Please check the entered data.')
		}

	
		return user
	}

	public async findByEmail(email: string){
		const user = await this.prismaService.user.findUnique({
			where: {email},
			include: {
				accounts: true,
			}
		})
		return user
	}

	public async create(
		email: string, 
		password: string, 
		name: string, 
		method: AuthMethod,
		isVerified: boolean,
		avatarUrl?: string,
	){
		let finalAvatarUrl: string | null = null;

		if (avatarUrl) {
			// Google OAuth: сохраняем URL напрямую без загрузки
			finalAvatarUrl = avatarUrl;
		} else {
			// Email регистрация: генерируем аватар через DiceBear и загружаем в Cloudinary
			const avatarName = `${name}_${Date.now()}`;
			const avatarBuffer = await generateAvatar(name);
			
			const uploadResult = await this.cloudinaryService.uploadBuffer(
				avatarBuffer, 
				avatarName,
				'mirchanAvatars'
			);
			finalAvatarUrl = uploadResult.secure_url;
		}

		const user = await this.prismaService.user.create({
			data: {
				email,
				password: password ? await hash(password) : null,
				name,
				method,
				isVerified,
				avatarUrl: finalAvatarUrl,

			},
			include: {
				accounts: true,
				followers: true,
				following: true,
				_count: {
					select: {
						post: true,
						followers: true,
						following: true
					}
				}
			}

		})
		
		return user;
	}



	public async  update(id: string, dto: UpdateUserDto){
		const user = await this.findById(id)

		// Обработка аватарки если передан новый файл
		let newAvatarUrl: string | undefined = undefined

		if (dto.avatarBuffer) {
			const oldUrl = user.avatarUrl
			const isCloudinary = oldUrl && /res\.cloudinary\.com\//.test(oldUrl)

			// Загружаем пользовательский файл в Cloudinary
			const safeNameBase = (dto.avatarOriginalFilename || user.name || 'avatar')
				.replace(/[^a-zA-Z0-9_-]/g, '_')
			const avatarName = `${safeNameBase}_${Date.now()}`
			const uploadResult = await this.cloudinaryService.uploadBuffer(
				dto.avatarBuffer, 
				avatarName, 
				'mirchanAvatars'
			)
			newAvatarUrl = uploadResult.secure_url

			// Удаляем старую аватарку из Cloudinary если она там хранилась
			if (isCloudinary) {
				try {
					await this.cloudinaryService.deleteByUrl(oldUrl!)
				} catch (e) {
					// Логируем, но не прерываем процесс обновления
					if (process.env.NODE_ENV === 'development') {
						console.warn('Не удалось удалить старую аватарку:', e)
					}
				}
			}
		}

		const updateUser = await this.prismaService.user.update({
			where: {id: user.id},
			data: {
				email: dto.email,
				name: dto.name,
				isTwoFactorEnabled: dto.isTwoFactorEnabled,
				dateOfBirth: dto.dateOfBirth,
				bio: dto.bio,
				status: dto.status,
				username: dto.username,
				backgroundUrl: dto.backgroundUrl,
				usernameFrameUrl: dto.usernameFrameUrl,
				avatarFrameUrl: dto?.avatarFrameUrl,
				location: dto.location,
				...(newAvatarUrl && { avatarUrl: newAvatarUrl }),
			}
		})

		return updateUser
	}


	/**
	 * Умный поиск пользователей с нормализацией Unicode
	 * Поддерживает:
	 * - Упоминания через @username
	 * - Поиск по имени и email (case-insensitive)
	 * - Нормализация диакритических знаков (ё→е, é→e, etc.)
	 * - Ранжирование результатов для @-запросов
	 */
	public async searchUser(query: string) {
		try {
			// Утилита Unicode-нормализации: NFKD, удаление диакритики, только буквы/цифры, toLowerCase
			const normalize = (str = ''): string => {
				return str
					.normalize('NFKD')
					.replace(/\p{Diacritic}/gu, '') // Убирает диакритические знаки
					.replace(/[^\p{Letter}\p{Number}]+/gu, '') // Только буквы и цифры Unicode
					.toLowerCase();
			};

			const raw = (query || '').toString().trim();
			const isMention = raw.startsWith('@');
			const qClean = raw.replace(/^@/, ''); // Убираем @ для поиска
			const qNorm = normalize(qClean);

			const LIMIT = 12;

			// Блокируем слишком короткие запросы
			// Для @-запросов разрешаем минимум 1 символ, для обычных - минимум 2
			if (!qClean || (qNorm.length < 2 && !(isMention && qClean.length >= 1))) {
				return [];
			}

			// Первичный быстрый поиск по БД (name/email contains, case-insensitive)
			const primary = await this.prismaService.user.findMany({
				where: {
					OR: [
						{ name: { contains: qClean, mode: 'insensitive' } },
						{ email: { contains: qClean, mode: 'insensitive' } },
					],
				},
				take: LIMIT,
				select: {
					id: true,
					name: true,
					email: true,
					avatarUrl: true,
					bio: true,
					followers: {
						select: { id: true }
					},
				},
			});

			// Если результатов мало, делаем расширенный поиск по всем пользователям
			let results = primary;
			
			if (results.length < LIMIT) {
				const candidates = await this.prismaService.user.findMany({
					where: {},
					take: 200, // Берем больше кандидатов для фильтрации
					select: {
						id: true,
						name: true,
						email: true,
						avatarUrl: true,
						bio: true,
						followers: {
							select: { id: true }
						},
					},
				});

				const seen = new Set(results.map((u) => u.id));
				
				// Фильтруем кандидатов по нормализованным строкам
				const extra = candidates.filter((u) => {
					if (seen.has(u.id)) return false;
					
					const nName = normalize(u.name || '');
					const nEmail = normalize(u.email || '');
					
					if (isMention) {
						// Для @упоминаний требуем совпадение префикса в имени
						return nName.startsWith(qNorm);
					}
					
					// Для обычного поиска ищем вхождение в имени или email
					return nName.includes(qNorm) || nEmail.includes(qNorm);
				});

				results = [...results, ...extra].slice(0, LIMIT);
			}

			// Сортировка: для @-запросов сначала точные/префиксные совпадения
			if (isMention) {
				results.sort((a, b) => {
					const an = normalize(a.name || '');
					const bn = normalize(b.name || '');
					
					// Скоринг: 0 = начинается с запроса, 1 = содержит, 2 = не совпадает
					const aScore = an.startsWith(qNorm) ? 0 : an.includes(qNorm) ? 1 : 2;
					const bScore = bn.startsWith(qNorm) ? 0 : bn.includes(qNorm) ? 1 : 2;
					
					return aScore - bScore;
				});
			}

			// Форматируем результаты
			const usersWithFollowCount = results.map((user) => ({
				id: user.id,
				name: user.name,
				avatarUrl: user.avatarUrl,
				bio: user.bio,
				followersCount: user.followers?.length || 0,
			}));

			return usersWithFollowCount;
			
		} catch (error) {
			console.error('Search users error:', error);
			throw new Error('Ошибка поиска пользователей');
		}
	}
}
