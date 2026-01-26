import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNoticeDto } from './dto/create-notice.dto';

@Injectable()
export class NoticeService {
	constructor(private readonly prisma: PrismaService) {}

	public async create(authorId: string, dto: CreateNoticeDto) {
		const { content, type, expiredAt, active, title, emojiUrl, durationDays } = dto;

		// Compute expiry date: explicit expiredAt > durationDays > default 7 days
		let expiry: Date;
		if (expiredAt) {
			expiry = new Date(expiredAt);
			if (isNaN(expiry.getTime())) throw new BadRequestException('expiredAt is invalid date');
		} else if (typeof durationDays === 'number') {
			expiry = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
		} else {
			expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
		}

		const data: any = {
			userId: authorId,
			content,
			type: type || 'default',
			expiredAt: expiry,
			active: typeof active === 'boolean' ? active : true,
			emojiUrl,
		};

		if (typeof title === 'string') data.title = title;
		if (typeof emojiUrl === 'string') data.emojiUrl = emojiUrl;

		const notice = await this.prisma.notice.create({
			data,
		});

		return notice;
	}

	public async findActive() {
		const now = new Date();
		return this.prisma.notice.findMany({
			where: {
				active: true,
				expiredAt: {
					gt: now,
				},
			},
			orderBy: { createdAt: 'desc' },
		});
	}

	public async findAll() {
		return this.prisma.notice.findMany({
			orderBy: { createdAt: 'desc' },
		});
	}


	public async deleteNotice(noticeId: string){
		return this.prisma.notice.delete({
			where: {id: noticeId}
		})
	}
}

