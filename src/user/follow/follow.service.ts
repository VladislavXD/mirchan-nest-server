import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FollowService {
	public constructor(
		private readonly prismaService: PrismaService
	) {}

	/**
	 * Подписаться на пользователя
	 */
	public async followUser(followerId: string, followingId: string) {
		// Проверка: нельзя подписаться на самого себя
		if (followerId === followingId) {
			throw new BadRequestException('You cannot follow yourself');
		}

		// Проверяем существование пользователя, на которого подписываются
		const userToFollow = await this.prismaService.user.findUnique({
			where: { id: followingId }
		});

		if (!userToFollow) {
			throw new NotFoundException('User not found');
		}

		// Проверяем, не подписан ли уже
		const existingFollow = await this.prismaService.follows.findUnique({
			where: {
				followerId_followingId: {
					followerId,
					followingId
				}
			}
		});

		if (existingFollow) {
			throw new ConflictException('Already following this user');
		}

		// Создаем подписку
		const follow = await this.prismaService.follows.create({
			data: {
				followerId,
				followingId
			},
			include: {
				following: {
					select: {
						id: true,
						username: true,
						name: true,
						avatarUrl: true,
						bio: true
					}
				}
			}
		});

		return {
			message: 'Successfully followed user',
			follow
		};
	}

	/**
	 * Отписаться от пользователя
	 */
	public async unfollowUser(followerId: string, followingId: string) {
		// Проверяем, существует ли подписка
		const existingFollow = await this.prismaService.follows.findUnique({
			where: {
				followerId_followingId: {
					followerId,
					followingId
				}
			}
		});

		if (!existingFollow) {
			throw new NotFoundException('You are not following this user');
		}

		// Удаляем подписку
		await this.prismaService.follows.delete({
			where: {
				followerId_followingId: {
					followerId,
					followingId
				}
			}
		});

		return {
			message: 'Successfully unfollowed user'
		};
	}

	/**
	 * Получить список подписчиков пользователя
	 */
	public async getFollowers(userId: string, page: number = 1, limit: number = 20) {
		const skip = (page - 1) * limit;

		const [followers, total] = await Promise.all([
			this.prismaService.follows.findMany({
				where: { followingId: userId },
				skip,
				take: limit,
				include: {
					follower: {
						select: {
							id: true,
							username: true,
							name: true,
							avatarUrl: true,
							bio: true,
							isVerified: true
						}
					}
				},
				orderBy: { createdAt: 'desc' }
			}),
			this.prismaService.follows.count({
				where: { followingId: userId }
			})
		]);

		return {
			followers: followers.map(f => f.follower),
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit)
		};
	}

	/**
	 * Получить список подписок пользователя
	 */
	public async getFollowing(userId: string, page: number = 1, limit: number = 20) {
		const skip = (page - 1) * limit;

		const [following, total] = await Promise.all([
			this.prismaService.follows.findMany({
				where: { followerId: userId },
				skip,
				take: limit,
				include: {
					following: {
						select: {
							id: true,
							username: true,
							name: true,
							avatarUrl: true,
							bio: true,
							isVerified: true
						}
					}
				},
				orderBy: { createdAt: 'desc' }
			}),
			this.prismaService.follows.count({
				where: { followerId: userId }
			})
		]);

		return {
			following: following.map(f => f.following),
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit)
		};
	}

	/**
	 * Проверить, подписан ли текущий пользователь на другого
	 */
	public async isFollowing(followerId: string, followingId: string): Promise<boolean> {
		const follow = await this.prismaService.follows.findUnique({
			where: {
				followerId_followingId: {
					followerId,
					followingId
				}
			}
		});

		return !!follow;
	}

	/**
	 * Получить статистику подписок пользователя
	 */
	public async getFollowStats(userId: string) {
		const [followersCount, followingCount] = await Promise.all([
			this.prismaService.follows.count({
				where: { followingId: userId }
			}),
			this.prismaService.follows.count({
				where: { followerId: userId }
			})
		]);

		return {
			followersCount,
			followingCount
		};
	}
}
