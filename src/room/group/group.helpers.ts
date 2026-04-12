import { Chat, User } from '@prisma/client';

export const GROUP_AVATAR_FOLDER = 'mirchanRooms/mirchanGroups';

export const GROUP_INCLUDE = {
  participants: {
    select: {
      id: true,
      name: true,
      username: true,
      avatarUrl: true,
      lastSeen: true,
    },
  },
  admins: {
    select: {
      id: true,
      name: true,
      username: true,
      avatarUrl: true,
    },
  },
} as const;

export const GROUP_DETAIL_INCLUDE = {
  ...GROUP_INCLUDE,
  messages: {
    orderBy: {
      createdAt: 'asc',
    },
    take: 100,
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          bio: true,
          lastSeen: true,
        },
      },
    },
  },
} as const;

export const normalizeMemberIds = (memberIds?: string[]): string[] => {
  if (!memberIds || !Array.isArray(memberIds)) {
    return [];
  }

  return [...new Set(memberIds.map((id) => id.trim()).filter(Boolean))];
};

export const hasAdminAccess = (admins: Pick<User, 'id'>[], userId: string): boolean => {
  return admins.some((admin) => admin.id === userId);
};

export const hasParticipantAccess = (group: Pick<Chat, 'isPrivate'> & { participants: Pick<User, 'id'>[] }, userId: string): boolean => {
  if (!group.isPrivate) {
    return true;
  }

  return group.participants.some((participant) => participant.id === userId);
};
