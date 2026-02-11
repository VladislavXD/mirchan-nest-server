import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';


// Сервис для управления репостами.
@Injectable()
export class RepostService {
  constructor(private readonly prisma: PrismaService){}


	async create(userId: string, postId: string, comment?: string){
		try{
			const post = await this.prisma.post.findUnique({
				where: {id: postId},
				select: {id: true}
			})
			if (!post){
				throw new BadRequestException('Пост не найден')
			}
			const existingRepost = await this.prisma.repost.findFirst({
				where: {
					userId,
					postId
				}
			})
			if (existingRepost){
				throw new BadRequestException('Вы уже репостнули этот пост')
			}

			const [repost] = await this.prisma.$transaction([
        this.prisma.repost.create({
          data: {
            userId,
            postId,
            repostComment: comment
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                avatarUrl: true
              }
            },
            post: {
              include: {
                author: {
                  select: {
                    id: true,
                    username: true,
                    name: true,
										avatarUrl: true
                  }
                },
                media: true
              }
            }
          }
        }),
        // Увеличиваем счётчик репостов
        this.prisma.post.update({
          where: { id: postId },
          data: { repostCount: { increment: 1 } }
        })
      ]);

			return repost

		}catch(err){
			if (err instanceof NotFoundException || err instanceof BadRequestException) {
        throw err;
      }
			throw new BadRequestException('Ошибка при создании репоста')
		}
	}

	async delete(userId: string, postId: string){
    try{
        // Проверяем существование репоста
      const repost = await this.prisma.repost.findUnique({
        where: {
          userId_postId: { 
            userId,
            postId
          }
        }
      });

      if (!repost) {
        throw new NotFoundException('Репост не найден');
      }

      // Удаляем репост и уменьшаем счётчик в транзакции
      await this.prisma.$transaction([
        this.prisma.repost.delete({
          where: {
            userId_postId: { 
              userId,
              postId
            }
          }
        }),
        this.prisma.post.update({
          where: { id: postId },
          data: { repostCount: { decrement: 1 } }
        })
      ]);

      return { message: 'Репост удалён' };
        }catch(err){
            if (err instanceof NotFoundException) {
        throw err;
      }
        throw new BadRequestException('Ошибка при удалении репоста')
    }
    }

		/**
   * Проверить, репостил ли пользователь пост
   * @param userId - ID пользователя
   * @param postId - ID поста
   * @returns true если репост существует
   */
  async hasReposted(userId: string, postId: string): Promise<boolean> {
    const repost = await this.prisma.repost.findUnique({
      where: {
        userId_postId: {
          userId,
          postId
        }
      }
    });

    return !!repost;
  }

  /**
   * Получить все репосты пользователя
   * @param userId - ID пользователя
   * @param limit - Лимит результатов
   * @param cursor - Курсор для пагинации
   * @returns Массив репостов с постами
   */
  async getUserReposts(userId: string, limit = 20, cursor?: string) {
    const reposts = await this.prisma.repost.findMany({
      where: { userId },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1
      }),
      orderBy: { createdAt: 'desc' },
      include: {
        post: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                name: true,
                avatarUrl: true
              }
            },
            media: true,
            likes: true, // Добавляем массив лайков для вычисления likeByUser
            comments: true,
            _count: {
              select: {
                likes: true,
                comments: true,
                reposts: true
              }
            }
          }
        }
      }
    });

    const hasMore = reposts.length > limit;
    const items = hasMore ? reposts.slice(0, -1) : reposts;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return {
      items,
      nextCursor,
      hasMore
    };
  }

	async getPostReposters(postId: string, limit = 20) {
    const reposts = await this.prisma.repost.findMany({
      where: { postId },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true
          }
        }
      }
    });

    return reposts.map(repost => ({
      ...repost.user,
      repostedAt: repost.createdAt,
      repostComment: repost.repostComment
    }));
  }

}
