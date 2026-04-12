import { ChatType } from '@prisma/client';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AddMembersDto, CreateGroupDto, UpdateGroupDto } from './dto/group.dto';
import {
  GROUP_AVATAR_FOLDER,
	GROUP_DETAIL_INCLUDE,
  GROUP_INCLUDE,
  hasAdminAccess,
  hasParticipantAccess,
  normalizeMemberIds,
} from './group.helpers';

@Injectable()
export class GroupService {
	constructor(
		private readonly prismaService: PrismaService,
		private readonly cloudinaryService: CloudinaryService,
	) {}

	private async findGroupOrThrow(groupId: string, withMessages = false) {
		const group = await this.prismaService.chat.findFirst({
			where: {
				id: groupId,
				type: ChatType.GROUP,
			},
			include: withMessages ? GROUP_DETAIL_INCLUDE : GROUP_INCLUDE,
		});

		if (!group) {
			throw new NotFoundException('Группа не найдена');
		}

		return group;
	}

	private async assertCanViewGroup(userId: string, groupId: string, withMessages = false) {
		const group = await this.findGroupOrThrow(groupId, withMessages);

		if (!hasParticipantAccess(group, userId)) {
			throw new ForbiddenException('Нет доступа к приватной группе');
		}

		return group;
	}

	private async assertAdmin(userId: string, groupId: string) {
		const group = await this.findGroupOrThrow(groupId);

		if (!hasAdminAccess(group.admins, userId)) {
			throw new ForbiddenException('Только администратор группы может выполнить это действие');
		}

		return group;
	}

	private async uploadAvatar(userId: string, avatar?: any) {
		if (!avatar?.buffer) {
			return null;
		}

		const uploadResult = await this.cloudinaryService.uploadBuffer(
			avatar.buffer,
			`group_${userId}_${Date.now()}`,
			GROUP_AVATAR_FOLDER,
			'image',
		);

		return uploadResult.secure_url;
	}

	private async deleteOldAvatar(avatarUrl?: string | null) {
		if (!avatarUrl) {
			return;
		}

		await this.cloudinaryService.deleteByUrl(avatarUrl);
	}

	public async createGroup(userId: string, dto: CreateGroupDto, avatar?: string) {
		const { name, description, isPrivate = false } = dto;
		const memberIds = normalizeMemberIds(dto.memberIds);

		const participantIds = [...new Set([userId, ...memberIds])];
		const avatarUrl = await this.uploadAvatar(userId, avatar);

		return this.prismaService.chat.create({
			data: {
				type: ChatType.GROUP,
				name,
				description,
				isPrivate,
				avatarUrl,
				participants: {
					connect: participantIds.map((id) => ({ id })),
				},
				admins: {
					connect: { id: userId },
				},
			},
			include: GROUP_INCLUDE,
		});
	}

	public async getUserGroups(userId: string) {
		return this.prismaService.chat.findMany({
			where: {
				type: ChatType.GROUP,
				participants: {
					some: { id: userId },
				},
			},
			include: GROUP_INCLUDE,
			orderBy: {
				updatedAt: 'desc',
			},
		});
	}

	public async getGroupById(userId: string, groupId: string) {
		return this.assertCanViewGroup(userId, groupId, true);
	}

	public async updateGroup(userId: string, groupId: string, dto: UpdateGroupDto, avatar?: any) {
		const group = await this.assertAdmin(userId, groupId);

		const { name, description, isPrivate } = dto;
		let avatarUrl = group.avatarUrl;

		if (avatar?.buffer) {
			await this.deleteOldAvatar(group.avatarUrl);
			avatarUrl = await this.uploadAvatar(userId, avatar);
		}

		return this.prismaService.chat.update({
			where: { id: groupId },
			data: {
				name,
				description,
				isPrivate,
				avatarUrl,
			},
			include: GROUP_INCLUDE,
		});
	}

	public async deleteGroup(userId: string, groupId: string) {
		const group = await this.assertAdmin(userId, groupId);

		await this.deleteOldAvatar(group.avatarUrl);

		await this.prismaService.chat.delete({
			where: { id: groupId },
		});

		return { message: 'Группа удалена' };
	}

	public async addMembers(userId: string, groupId: string, dto: AddMembersDto) {
		await this.assertAdmin(userId, groupId);

		const memberIds = normalizeMemberIds(dto.memberIds).filter((id) => id !== userId);

		if (memberIds.length === 0) {
			return this.findGroupOrThrow(groupId);
		}

		return this.prismaService.chat.update({
			where: { id: groupId },
			data: {
				participants: {
					connect: memberIds.map((id) => ({ id })),
				},
			},
			include: GROUP_INCLUDE,
		});
	}

	public async removeMember(userId: string, groupId: string, targetUserId: string) {
		const group = await this.findGroupOrThrow(groupId);

		const isRequesterAdmin = hasAdminAccess(group.admins, userId);
		const isSelfRemove = userId === targetUserId;

		if (!isRequesterAdmin && !isSelfRemove) {
			throw new ForbiddenException('Только администратор может удалять других участников');
		}

		const remainingAdmins = group.admins.filter((admin) => admin.id !== targetUserId);

		if (group.admins.some((admin) => admin.id === targetUserId) && remainingAdmins.length === 0) {
			const nextAdmin = group.participants.find((participant) => participant.id !== targetUserId);

			if (!nextAdmin) {
				throw new ForbiddenException('Нельзя удалить единственного участника-админа');
			}

			await this.prismaService.chat.update({
				where: { id: groupId },
				data: {
					admins: {
						connect: { id: nextAdmin.id },
					},
				},
			});
		}

		return this.prismaService.chat.update({
			where: { id: groupId },
			data: {
				participants: {
					disconnect: { id: targetUserId },
				},
				admins: {
					disconnect: { id: targetUserId },
				},
			},
			include: GROUP_INCLUDE,
		});
	}

	public async addAdmin(userId: string, groupId: string, targetUserId: string) {
		await this.assertAdmin(userId, groupId);

		return this.prismaService.chat.update({
			where: { id: groupId },
			data: {
				admins: {
					connect: { id: targetUserId },
				},
			},
			include: GROUP_INCLUDE,
		});
	}

	public async removeAdmin(userId: string, groupId: string, targetUserId: string) {
		const group = await this.assertAdmin(userId, groupId);

		if (!hasAdminAccess(group.admins, targetUserId)) {
			return group;
		}

		if (group.admins.length <= 1) {
			throw new ForbiddenException('В группе должен оставаться хотя бы один администратор');
		}

		return this.prismaService.chat.update({
			where: { id: groupId },
			data: {
				admins: {
					disconnect: { id: targetUserId },
				},
			},
			include: GROUP_INCLUDE,
		});
	}

	public async joinGroup(userId: string, groupId: string) {
		const group = await this.findGroupOrThrow(groupId);

		if (group.isPrivate) {
			throw new ForbiddenException('Нельзя вступить в приватную группу без приглашения');
		}

		return this.prismaService.chat.update({
			where: { id: groupId },
			data: {
				participants: {
					connect: { id: userId },
				},
			},
			include: GROUP_INCLUDE,
		});
	}

	public async leaveGroup(userId: string, groupId: string) {
		return this.removeMember(userId, groupId, userId);
	}
}
