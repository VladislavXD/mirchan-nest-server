import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { NotificationType, Notification } from '@prisma/client';
import { GetNotificationsDto } from './dto/get-notifications.dto';

interface CreateNotificationParams {
  type: NotificationType;
  userId: string;
  issuerId?: string;
  postId?: string;
  commentId?: string;
  chatId?: string;
  message?: string;
  metadata?: any;
}

interface AggregatedActorSnapshot {
  id: string;
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
}

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private isAggregatableType(type: NotificationType): boolean {
    switch (type) {
      case NotificationType.NEW_FOLLOWER:
      case NotificationType.LIKE_POST:
      case NotificationType.LIKE_COMMENT:
        return true;
      default:
        return false;
    }
  }

  private canAggregate(params: CreateNotificationParams): boolean {
    if (params.type === NotificationType.NEW_FOLLOWER) {
      return true;
    }

    if (params.type === NotificationType.LIKE_POST) {
      return Boolean(params.postId);
    }

    if (params.type === NotificationType.LIKE_COMMENT) {
      return Boolean(params.commentId);
    }

    return false;
  }

  private buildAggregationWhere(params: CreateNotificationParams) {
    const where: Record<string, string> = {
      type: params.type,
      userId: params.userId,
    };

    if (params.type === NotificationType.LIKE_POST && params.postId) {
      where.postId = params.postId;
    }

    if (params.type === NotificationType.LIKE_COMMENT && params.commentId) {
      where.commentId = params.commentId;
    }

    return where;
  }

  private normalizeMetadata(metadata?: any) {
    return metadata ? JSON.parse(JSON.stringify(metadata)) : {};
  }

  private extractActors(metadata: any): AggregatedActorSnapshot[] {
    const actors = metadata?.aggregate?.actors;

    if (!Array.isArray(actors)) {
      return [];
    }

    return actors.filter(Boolean).map((actor: AggregatedActorSnapshot) => ({
      id: actor.id,
      name: actor.name ?? null,
      username: actor.username ?? null,
      avatarUrl: actor.avatarUrl ?? null,
    }));
  }

  private buildAggregatedMessage(
    type: NotificationType,
    actorName: string,
    totalActors: number,
  ): string {
    const suffix = totalActors === 1 ? '' : ` и ещё ${totalActors - 1} ${totalActors - 1 === 1 ? 'человек' : 'человека'}`;

    switch (type) {
      case NotificationType.NEW_FOLLOWER:
        return totalActors === 1
          ? `${actorName} подписался на вас`
          : `${actorName}${suffix} подписались на вас`;
      case NotificationType.LIKE_POST:
        return totalActors === 1
          ? `${actorName} лайкнул ваш пост`
          : `${actorName}${suffix} лайкнули ваш пост`;
      case NotificationType.LIKE_COMMENT:
        return totalActors === 1
          ? `${actorName} лайкнул ваш комментарий`
          : `${actorName}${suffix} лайкнули ваш комментарий`;
      default:
        return totalActors === 1
          ? `${actorName} совершил новое действие`
          : `${actorName}${suffix} совершили новое действие`;
    }
  }

  /**
   * Получить список уведомлений пользователя с пагинацией
   */
  async getUserNotifications(userId: string, dto: GetNotificationsDto) {
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          issuer: {
            select: {
              id: true,
              username: true,
              name: true,
              avatarUrl: true,
            },
          },
          post: {
            select: { id: true },
          },
          comment: {
            select: { id: true, content: true },
          },
          chat: {
            select: { id: true, type: true, name: true },
          }
        },
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);

    return {
      data: notifications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Получить количество непрочитанных уведомлений
   */
  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return { count };
  }

  /**
   * Отметить одно уведомление как прочитанное
   */
  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Уведомление не найдено');
    }

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  /**
   * Отметить все уведомления пользователя как прочитанные
   */
  async markAllAsRead(userId: string): Promise<{ updatedCount: number }> {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return { updatedCount: result.count };
  }

  /**
   * Внутренний метод: Создать уведомление и отправить в Redis Pub/Sub
   * Используется другими сервисами или через EventEmitter
   */
  async createNotification(params: CreateNotificationParams): Promise<Notification> {
    const shouldAggregate = this.isAggregatableType(params.type) && this.canAggregate(params);
    const baseMetadata = this.normalizeMetadata(params.metadata);
    let notification: Notification;

    if (shouldAggregate) {
      const where = this.buildAggregationWhere(params);
      const existingNotification = await this.prisma.notification.findFirst({
        where,
        select: {
          id: true,
          issuerId: true,
          message: true,
          metadata: true,
          postId: true,
          commentId: true,
          chatId: true,
        },
      });

      const existingActors = this.extractActors(existingNotification?.metadata);
      const issuerSnapshot = params.issuerId
        ? await this.prisma.user.findUnique({
            where: { id: params.issuerId },
            select: {
              id: true,
              name: true,
              username: true,
              avatarUrl: true,
            },
          })
        : null;

      const newActor: AggregatedActorSnapshot | null = params.issuerId
        ? {
            id: params.issuerId,
            name: issuerSnapshot?.name ?? null,
            username: issuerSnapshot?.username ?? null,
            avatarUrl: issuerSnapshot?.avatarUrl ?? null,
          }
        : null;

      const mergedActors = new Map<string, AggregatedActorSnapshot>();

      for (const actor of existingActors) {
        mergedActors.set(actor.id, actor);
      }

      if (newActor) {
        mergedActors.set(newActor.id, newActor);
      }

      const actors = Array.from(mergedActors.values());
      const totalActors = Math.max(actors.length, 1);
      const displayActor = newActor?.name || newActor?.username || issuerSnapshot?.name || issuerSnapshot?.username || 'Пользователь';
      const aggregatedMessage = this.buildAggregatedMessage(params.type, displayActor, totalActors);

      const aggregatedMetadata = {
        ...baseMetadata,
        aggregate: {
          count: totalActors,
          actors,
          lastActorId: newActor?.id ?? existingNotification?.issuerId ?? null,
          updatedAt: new Date().toISOString(),
        },
      };

      const data = {
        type: params.type,
        userId: params.userId,
        issuerId: newActor?.id ?? existingNotification?.issuerId ?? params.issuerId ?? null,
        postId: params.postId ?? existingNotification?.postId ?? null,
        commentId: params.commentId ?? existingNotification?.commentId ?? null,
        chatId: params.chatId ?? existingNotification?.chatId ?? null,
        message: params.message ?? aggregatedMessage,
        metadata: aggregatedMetadata,
        isRead: false,
      };

      notification = existingNotification
        ? await this.prisma.notification.update({
            where: { id: existingNotification.id },
            data,
            include: {
              issuer: { select: { id: true, username: true, avatarUrl: true } },
            },
          })
        : await this.prisma.notification.create({
            data,
            include: {
              issuer: { select: { id: true, name: true, username: true, avatarUrl: true } },
            },
          });
    } else {
      notification = await this.prisma.notification.create({
        data: {
          type: params.type,
          userId: params.userId,
          issuerId: params.issuerId ?? null,
          postId: params.postId ?? null,
          commentId: params.commentId ?? null,
          chatId: params.chatId ?? null,
          message: params.message ?? null,
          metadata: Object.keys(baseMetadata).length ? baseMetadata : undefined,
        },
        include: {
          issuer: { select: { id: true, name: true, username: true, avatarUrl: true } }
        }
      });
    }

    // Публикуем событие в Redis канал, чтобы WebSocket сервер мог его перехватит 
    // и отправить нужному клиенту в реальном времени
    await this.redis.publish('notifications_channel', {
      event: 'new_notification',
      data: notification,
    });

    return notification;
  }
}
