import { 
	Injectable, 
	NotFoundException, 
	ForbiddenException,
	BadRequestException,
	InternalServerErrorException
} from '@nestjs/common'
import { CreatePostDto } from './dto/create-post.dto'
import { UpdatePostDto } from './dto/update-post.dto'
import { PrismaService } from '../prisma/prisma.service'
import { CloudinaryService } from '../cloudinary/cloudinary.service'
import { RedisService } from '../redis/redis.service'

/**
 * Сервис для работы с постами.
 * 
 * Предоставляет методы для создания, получения, обновления и удаления постов.
 */
@Injectable()
export class PostService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly cloudinary: CloudinaryService,
		private readonly redis: RedisService
	) {}

	/**
	 * Создание нового поста.
	 * 
	 * @param userId - ID автора поста
	 * @param createPostDto - Данные для создания поста
	 * @returns Созданный пост с автором, лайками и комментариями
	 */
	async create(userId: string, createPostDto: CreatePostDto) {
		const { content, contentSpoiler, emojiUrls, mediaFiles, mediaSpoilers } = createPostDto

		if (!content) {
			throw new BadRequestException('Содержимое поста обязательно')
		}

		try {
			// Загружаем все медиа файлы в Cloudinary
			const uploadedMedia: Array<{
				url: string
				publicId: string
				previewUrl?: string
				name?: string
				size?: number
				mimeType: string
				type: 'IMAGE' | 'VIDEO' | 'GIF'
				width?: number
				height?: number
				duration?: number
				spoiler: boolean
			}> = []

			if (mediaFiles && mediaFiles.length > 0) {
				for (let i = 0; i < mediaFiles.length; i++) {
					const mediaFile = mediaFiles[i]
					const { buffer, originalname, mimetype, size } = mediaFile
					
					if (!buffer || !mimetype) continue

					try {
						// Определяем тип медиа и resourceType для Cloudinary
						let mediaType: 'IMAGE' | 'VIDEO' | 'GIF' = 'IMAGE'
						let resourceType: 'image' | 'video' | 'auto' = 'auto'
						
						if (mimetype.startsWith('video/')) {
							mediaType = 'VIDEO'
							resourceType = 'video'
						} else if (mimetype === 'image/gif') {
							mediaType = 'GIF'
							resourceType = 'image'
						} else if (mimetype.startsWith('image/')) {
							resourceType = 'image'
						} else {
							resourceType = 'auto'
						}

						console.log(`Uploading file ${i}: ${originalname}, mimetype: ${mimetype}, resourceType: ${resourceType}, mediaType: ${mediaType}`)

						const filename = `post_${userId}_${Date.now()}_${i}`
						const uploadResult = await this.cloudinary.uploadBuffer(
							buffer,
							filename,
							'mirchanPost',
							resourceType
						)

						console.log(`Successfully uploaded: ${uploadResult.secure_url}`)

						// Проверяем, есть ли спойлер для этого файла (по индексу)
						const hasSpoiler = mediaSpoilers ? mediaSpoilers[i] === true : false

						uploadedMedia.push({
							url: uploadResult.secure_url,
							publicId: uploadResult.public_id,
							previewUrl: uploadResult.eager?.[0]?.secure_url, // Превью если есть
							name: originalname,
							size,
							mimeType: mimetype,
							type: mediaType,
							width: uploadResult.width,
							height: uploadResult.height,
							duration: uploadResult.duration,
							spoiler: hasSpoiler
						})
					} catch (uploadError) {
						console.error(`Cloudinary upload error for file ${originalname} (${mimetype}):`, uploadError)
						// Продолжаем загрузку остальных файлов
					}
				}
			}

			// Создаём пост с медиа файлами
			const post = await this.prisma.post.create({
				data: {
					content: typeof content === 'string' ? content : JSON.stringify(content),
					contentSpoiler: contentSpoiler || false,
					authorId: userId,
					emojiUrls: emojiUrls || [],
					media: {
						create: uploadedMedia
					}
				},
				include: {
					author: {
						include: {
							followers: true,
							following: true
						}
					},
					likes: true,
					comments: true,
					media: true // Включаем медиа файлы
				}
			})

			return post
		} catch (err) {
			console.error('Create post error:', err)
			throw new InternalServerErrorException('Ошибка при создании поста')
		}
	}

	/**
	 * Получение всех постов с сортировкой по дате создания.
	 * Добавляет likeByUser для авторизованного пользователя, но не требует авторизации.
	 * 
	 * @param userId - ID текущего пользователя (опционально)
	 * @returns Массив постов с автором, лайками, комментариями и likeByUser
	 */
	async findAll(userId?: string | null) {
		try {
			const posts = await this.prisma.post.findMany({
				include: {
					author: {
						include: {
							followers: true,
							following: true
						}
					},
					likes: true,
					comments: true,
					media: true // Включаем медиа файлы
				},
				orderBy: {
					createdAt: 'desc'
				}
			})

			return posts.map(post => ({
				...post,
				likeByUser: userId ? post.likes.some(like => like.userId === userId) : false
			}))
		} catch (err) {
			console.error('Get all posts error:', err)
			throw new InternalServerErrorException('Ошибка при получении постов')
		}
	}

	/**
	 * Получение поста по ID.
	 * 
	 * @param id - ID поста
	 * @param userId - ID текущего пользователя (опционально) для вычисления likeByUser
	 * @returns Пост с автором, лайками, комментариями и likeByUser
	 */
	async findOne(id: string, userId?: string | null) {
		try {
			const post = await this.prisma.post.findUnique({
				where: { id },
				include: {
					comments: {
						include: {
							user: true
						}
					},
					likes: true,
					author: {
						include: {
							followers: true,
							following: true
						}
					},
					media: true // Включаем медиа файлы
				}
			})

			if (!post) {
				throw new NotFoundException('Пост не найден')
			}

			return {
				...post,
				likeByUser: userId ? post.likes.some(like => like.userId === userId) : false
			}
		} catch (err) {
			if (err instanceof NotFoundException) {
				throw err
			}
			console.error('Get post by id error:', err)
			throw new InternalServerErrorException('Ошибка при получении поста')
		}
	}

	/**
	 * Получение постов конкретного пользователя.
	 * 
	 * @param userId - ID пользователя
	 * @returns Массив постов пользователя
	 */
	async findByUserId(userId: string) {
		try {
			const posts = await this.prisma.post.findMany({
				where: {
					authorId: userId
				},
				include: {
					likes: true,
					author: {
						include: {
							followers: true,
							following: true
						}
					},
					comments: true,
					media: true // Включаем медиа файлы
				},
				orderBy: {
					createdAt: 'desc'
				}
			})

			return posts
		} catch (err) {
			console.error('Error from findByUserId:', err)
			throw new InternalServerErrorException('Ошибка при получении постов пользователя')
		}
	}

	/**
	 * Обновление поста.
	 * 
	 * @param id - ID поста
	 * @param userId - ID текущего пользователя
	 * @param updatePostDto - Данные для обновления
	 * @returns Обновлённый пост
	 */
	async update(id: string, userId: string, updatePostDto: UpdatePostDto) {
		const { content, contentSpoiler, emojiUrls } = updatePostDto

		try {
			const post = await this.prisma.post.findUnique({ 
				where: { id },
				include: { media: true }
			})

			if (!post) {
				throw new NotFoundException('Пост не найден')
			}

			if (post.authorId !== userId) {
				throw new ForbiddenException('Нет доступа')
			}

			const updated = await this.prisma.post.update({
				where: { id },
				data: {
					...(content ? { content: typeof content === 'string' ? content : JSON.stringify(content) } : {}),
					...(typeof contentSpoiler === 'boolean' ? { contentSpoiler } : {}),
					...(emojiUrls ? { emojiUrls } : {})
				},
				include: {
					comments: true,
					likes: true,
					media: true, // Включаем медиа файлы
					author: {
						include: { 
							followers: true, 
							following: true 
						}
					}
				}
			})

			return updated
		} catch (err) {
			if (err instanceof NotFoundException || err instanceof ForbiddenException) {
				throw err
			}
			console.error('UpdatePost error:', err)
			throw new InternalServerErrorException('Ошибка при обновлении поста')
		}
	}

	/**
	 * Удаление поста.
	 * 
	 * @param id - ID поста
	 * @param userId - ID текущего пользователя
	 */
	async remove(id: string, userId: string) {
		const post = await this.prisma.post.findUnique({ 
			where: { id },
			include: { media: true }
		})

		if (!post) {
			throw new NotFoundException('Пост не найден')
		}

		if (post.authorId !== userId) {
			throw new ForbiddenException('Нет доступа')
		}

		try {
			// Удаляем все медиа файлы из Cloudinary
			if (post.media && post.media.length > 0) {
				for (const mediaFile of post.media) {
					try {
						await this.cloudinary.deleteFile(mediaFile.publicId)
					} catch (deleteError) {
						console.error('Error deleting media from Cloudinary:', deleteError)
						// Продолжаем даже если не удалось удалить один файл
					}
				}
			}

			// Транзакция: удаляем медиа, комментарии, лайки, затем сам пост
			const transaction = await this.prisma.$transaction([
				this.prisma.mediaFile.deleteMany({ where: { postId: id } }),
				this.prisma.comment.deleteMany({ where: { postId: id } }),
				this.prisma.like.deleteMany({ where: { postId: id } }),
				this.prisma.post.delete({ where: { id } })
			])

			return transaction
		} catch (err) {
			console.error('Delete post error:', err)
			throw new InternalServerErrorException('Ошибка при удалении поста')
		}
	}

	/**
	 * Добавление единичного просмотра поста с использованием Redis.
	 * 
	 * @param postId - ID поста
	 * @param userId - ID пользователя
	 * @returns Количество просмотров и сообщение
	 */
	async addView(postId: string, userId: string) {
		try {
			if (!postId) {
				throw new BadRequestException('ID поста обязателен')
			}

			// Проверяем, существует ли пост
			const existingPost = await this.prisma.post.findUnique({
				where: { id: postId },
				select: {
					id: true,
					views: true,
					authorId: true
				}
			})

			if (!existingPost) {
				throw new NotFoundException('Пост не найден')
			}

			// Автор не может просматривать свой пост
			if (existingPost.authorId === userId) {
				const viewsCount = await this.redis.getViewsCount(postId)
				return {
					message: 'Автор не может просматривать свой пост',
					viewsCount: viewsCount || existingPost.views.length
				}
			}

			// Проверяем в Redis, был ли уже просмотр
			const hasViewed = await this.redis.hasViewed(postId, userId)
			
			if (hasViewed) {
				const viewsCount = await this.redis.getViewsCount(postId)
				return {
					message: 'Просмотр уже учтен',
					viewsCount
				}
			}

			// Добавляем просмотр в Redis
			const wasAdded = await this.redis.addView(postId, userId)

			if (wasAdded) {
				// Асинхронно обновляем БД (не блокируем ответ)
				this.syncViewToDatabase(postId, userId).catch(err => 
					console.error('Error syncing view to DB:', err)
				)

				const viewsCount = await this.redis.getViewsCount(postId)
				return {
					message: 'Просмотр добавлен',
					viewsCount
				}
			}

			// Если Redis вернул false (уже существует), возвращаем текущий счётчик
			const viewsCount = await this.redis.getViewsCount(postId)
			return {
				message: 'Просмотр уже учтен',
				viewsCount
			}
		} catch (error) {
			if (error instanceof NotFoundException || error instanceof BadRequestException) {
				throw error
			}
			console.error('Error adding view:', error)
			throw new InternalServerErrorException('Ошибка при добавлении просмотра')
		}
	}

	/**
	 * Синхронизирует просмотр из Redis в БД (асинхронно).
	 * 
	 * @param postId - ID поста
	 * @param userId - ID пользователя
	 */
	private async syncViewToDatabase(postId: string, userId: string): Promise<void> {
		try {
			const post = await this.prisma.post.findUnique({
				where: { id: postId },
				select: { views: true }
			})

			if (!post) return

			// Проверяем, нет ли уже в БД (на случай race condition)
			if (!post.views.includes(userId)) {
				await this.prisma.post.update({
					where: { id: postId },
					data: {
						views: [...post.views, userId]
					}
				})
			}
		} catch (error) {
			console.error('Failed to sync view to database:', error)
		}
	}

	/**
	 * Батчевое добавление просмотров с использованием Redis.
	 * 
	 * @param postIds - Массив ID постов
	 * @param userId - ID пользователя
	 * @returns Количество обработанных просмотров
	 */
	async addViewsBatch(postIds: string[], userId: string) {
		try {
			if (!Array.isArray(postIds) || postIds.length === 0) {
				throw new BadRequestException('Массив ID постов обязателен')
			}

			// Ограничиваем размер батча
			if (postIds.length > 20) {
				throw new BadRequestException('Слишком много постов в батче (максимум 20)')
			}

			console.log('Получен батч просмотров:', { postIds, userId })

			// Получаем все посты, которые существуют и не принадлежат автору
			const allPosts = await this.prisma.post.findMany({
				where: {
					id: { in: postIds },
					authorId: { not: userId } // Исключаем посты автора
				},
				select: {
					id: true,
					views: true
				}
			})

			if (allPosts.length === 0) {
				return {
					message: 'Нет постов для просмотра',
					processedCount: 0
				}
			}

			// Фильтруем посты, которые еще не просматривались (проверяем Redis)
			const postsToView: Array<{ postId: string; userId: string }> = []
			
			for (const post of allPosts) {
				const hasViewed = await this.redis.hasViewed(post.id, userId)
				if (!hasViewed) {
					postsToView.push({ postId: post.id, userId })
				}
			}

			console.log('Найдено постов для просмотра:', postsToView.length)

			if (postsToView.length === 0) {
				return {
					message: 'Нет новых постов для просмотра',
					processedCount: 0
				}
			}

			// Добавляем просмотры в Redis батчем
			const results = await this.redis.addViewsBatch(postsToView)
			const addedCount = results.filter(Boolean).length

			// Асинхронно синхронизируем с БД
			this.syncViewsBatchToDatabase(postsToView).catch(err =>
				console.error('Error syncing views batch to DB:', err)
			)

			console.log('Успешно добавлено просмотров:', addedCount)

			return {
				message: `Добавлено просмотров: ${addedCount}`,
				processedCount: addedCount,
				postIds: postsToView.map(v => v.postId)
			}
		} catch (error) {
			if (error instanceof BadRequestException) {
				throw error
			}
			console.error('Error adding views batch:', error)
			throw new InternalServerErrorException('Ошибка при добавлении просмотров')
		}
	}

	/**
	 * Синхронизирует батч просмотров из Redis в БД (асинхронно).
	 * 
	 * @param views - Массив просмотров { postId, userId }
	 */
	private async syncViewsBatchToDatabase(
		views: Array<{ postId: string; userId: string }>
	): Promise<void> {
		try {
			// Группируем по postId
			const viewsByPost = new Map<string, string[]>()
			
			for (const { postId, userId } of views) {
				if (!viewsByPost.has(postId)) {
					viewsByPost.set(postId, [])
				}
				viewsByPost.get(postId)!.push(userId)
			}

			// Обновляем каждый пост
			const updatePromises = Array.from(viewsByPost.entries()).map(
				async ([postId, userIds]) => {
					const post = await this.prisma.post.findUnique({
						where: { id: postId },
						select: { views: true }
					})

					if (!post) return

					// Добавляем только те userId, которых ещё нет
					const newUserIds = userIds.filter(uid => !post.views.includes(uid))
					
					if (newUserIds.length > 0) {
						await this.prisma.post.update({
							where: { id: postId },
							data: {
								views: [...post.views, ...newUserIds]
							}
						})
					}
				}
			)

			await Promise.all(updatePromises)
			console.log('Views batch synced to database successfully')
		} catch (error) {
			console.error('Failed to sync views batch to database:', error)
		}
	}
}
