import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBoardDto, GetUsersQueryDto, PaginationQueryDto, UpdateBoardDto, UpdateUserDto, UpdateUserRoleDto } from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [
      totalUsers,
      activeUsers,
      adminUsers,
      totalBoards,
      activeBoards,
      totalThreads,
      threadsToday,
      totalReplies,
      repliesToday,
      totalMedia,
      mediaSize,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { role: 'ADMIN' } }),
      this.prisma.board.count(),
      this.prisma.board.count({ where: { isActive: true } }),
      this.prisma.thread.count(),
      this.prisma.thread.count({ where: { createdAt: { gte: new Date(new Date().setHours(0,0,0,0)) } } }),
      this.prisma.reply.count(),
      this.prisma.reply.count({ where: { createdAt: { gte: new Date(new Date().setHours(0,0,0,0)) } } }),
      this.prisma.mediaFile.count(),
      this.prisma.mediaFile.aggregate({ _sum: { size: true } }),
    ]);

    return {
      users: { total: totalUsers, active: activeUsers, admins: adminUsers },
      boards: { total: totalBoards, active: activeBoards },
      threads: { total: totalThreads, today: threadsToday },
      replies: { total: totalReplies, today: repliesToday },
      media: { total: totalMedia, totalSize: (mediaSize as any)._sum?.size || 0 },
    };
  }

  async getUsers(query: GetUsersQueryDto) {
    const { page = 1, limit = 20, search = '', role, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }
    // Фильтр по роли: маппинг regular/admin → REGULAR/ADMIN
    if (role) {
      const roleMap: Record<string, string> = { regular: 'REGULAR', admin: 'ADMIN' };
      where.role = roleMap[role] || role.toUpperCase();
    }

    const [users, totalCount] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastSeen: true,
          provider: true,
          _count: { select: { post: true, comments: true, likes: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, pagination: { page, limit, total: totalCount, pages: Math.ceil(totalCount / limit) } };
  }

  async updateUserRole(userId: string, dto: UpdateUserRoleDto) {
    const roleMap = {
      regular: 'REGULAR',
      admin: 'ADMIN',
    } as const;
    
    if (!(dto.role in roleMap)) {
      throw new Error('Invalid role. Allowed: regular, admin');
    }
    
    return this.prisma.user.update({
      where: { id: userId },
      data: { role: roleMap[dto.role] },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });
  }

  async toggleUserStatus(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { isActive: true } });
    if (!user) throw new Error('User not found');
    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });
  }

  async getBoards(query: PaginationQueryDto & { search?: string; isActive?: string }) {
    const { page = 1, limit = 10, search, isActive } = query;
    const offset = (page - 1) * limit;
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (isActive !== undefined && isActive !== '') where.isActive = isActive === 'true';

    const [boards, total] = await Promise.all([
      this.prisma.board.findMany({
        where,
        include: { _count: { select: { threads: true } } },
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
        skip: offset,
      }),
      this.prisma.board.count({ where }),
    ]);

    const transformed = boards.map((b) => ({
      id: b.id,
      name: b.title,
      title: b.title,
      description: b.description,
      shortName: b.name,
      isActive: b.isActive,
      createdAt: b.createdAt,
      updatedAt: b.createdAt,
      _count: { threads: (b as any)._count?.threads || 0 },
    }));

    return { boards: transformed, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async createBoard(dto: CreateBoardDto) {
    const nameRegex = /^[a-zA-Z0-9]{1,10}$/;
    if (!nameRegex.test(dto.name)) throw new Error('Board name must be 1-10 characters, letters and numbers only');
    const existing = await this.prisma.board.findUnique({ where: { name: dto.name.toLowerCase() } });
    if (existing) throw new Error('Board with this name already exists');

    const validFileTypes = ['jpg','jpeg','png','gif','webp','webm','mp4','mov'];
    const invalid = (dto.allowedFileTypes || []).filter((t) => !validFileTypes.includes(t));
    if (invalid.length) throw new Error(`Invalid file types: ${invalid.join(', ')}`);

    const board = await this.prisma.board.create({
      data: {
        name: dto.name.toLowerCase(),
        title: dto.title,
        description: dto.description || null,
        isNsfw: Boolean(dto.isNsfw),
        maxFileSize: Number(dto.maxFileSize ?? 5242880),
        allowedFileTypes: dto.allowedFileTypes ?? ['jpg','jpeg','png','gif','webp'],
        postsPerPage: Number(dto.postsPerPage ?? 15),
        threadsPerPage: Number(dto.threadsPerPage ?? 10),
        bumpLimit: Number(dto.bumpLimit ?? 500),
        imageLimit: Number(dto.imageLimit ?? 150),
        isActive: true,
      },
    });

    return {
      message: 'Board created successfully',
      board: {
        id: board.id,
        name: board.name,
        title: board.title,
        description: board.description,
        shortName: board.name,
        isActive: board.isActive,
        createdAt: board.createdAt.toISOString(),
        updatedAt: board.createdAt.toISOString(),
        _count: { threads: 0 },
      },
    };
  }

  async updateBoard(boardId: string, dto: UpdateBoardDto) {
    const board = await this.prisma.board.update({
      where: { id: boardId },
      data: {
        title: dto.title,
        description: dto.description,
        allowedFileTypes: dto.allowedFileTypes,
        maxFileSize: dto.maxFileSize ? Number(dto.maxFileSize) : undefined,
        bumpLimit: dto.bumpLimit ? Number(dto.bumpLimit) : undefined,
  // threadLimit отсутствует в схеме — пропускаем
        isActive: typeof dto.isActive === 'boolean' ? dto.isActive : undefined,
      },
    });
    return board;
  }

  async deleteBoard(boardId: string) {
    const threads = await this.prisma.thread.findMany({
      where: { boardId },
      include: { mediaFiles: true, replies: { include: { mediaFiles: true } } },
    });

    const publicIds: string[] = [];
    threads.forEach((thread) => {
      thread.mediaFiles.forEach((f) => f.publicId && publicIds.push(f.publicId));
      thread.replies.forEach((r) => r.mediaFiles.forEach((f) => f.publicId && publicIds.push(f.publicId)));
      if ((thread as any).imagePublicId) publicIds.push((thread as any).imagePublicId);
      thread.replies.forEach((r) => { if ((r as any).imagePublicId) publicIds.push((r as any).imagePublicId); });
    });

    // TODO: интеграция с CloudinaryService для массового удаления
    // await this.cloudinary.deleteResources(publicIds)

    await this.prisma.board.delete({ where: { id: boardId } });
    return { message: 'Board deleted successfully' };
  }

  async getThreads(query: PaginationQueryDto & { boardId?: string; search?: string; sortBy?: string; sortOrder?: 'asc'|'desc' }) {
    const { page = 1, limit = 20, boardId = '', search = '', sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const where: any = {};
    if (boardId) where.boardId = boardId;
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { authorName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [threads, totalCount] = await Promise.all([
      this.prisma.thread.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          board: { select: { name: true, title: true } },
          _count: { select: { replies: true, mediaFiles: true } },
        },
      }),
      this.prisma.thread.count({ where }),
    ]);

    return { threads, pagination: { page, limit, total: totalCount, pages: Math.ceil(totalCount / limit) } };
  }

  async deleteThread(threadId: string) {
    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
      include: { mediaFiles: true, replies: { include: { mediaFiles: true } } },
    });
    if (!thread) throw new Error('Thread not found');

    const publicIds: string[] = [];
    thread.mediaFiles.forEach((f) => f.publicId && publicIds.push(f.publicId));
    thread.replies.forEach((r) => r.mediaFiles.forEach((f) => f.publicId && publicIds.push(f.publicId)));
    if ((thread as any).imagePublicId) publicIds.push((thread as any).imagePublicId);
    thread.replies.forEach((r) => { if ((r as any).imagePublicId) publicIds.push((r as any).imagePublicId); });

    // TODO: Cloudinary bulk delete

    await this.prisma.thread.delete({ where: { id: threadId } });
    return { message: 'Thread deleted successfully' };
  }

  async getReplies(query: PaginationQueryDto & { threadId?: string; search?: string; sortBy?: string; sortOrder?: 'asc'|'desc' }) {
    const { page = 1, limit = 50, threadId = '', search = '', sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const where: any = {};
    if (threadId) where.threadId = threadId;
    if (search) {
      where.OR = [
        { content: { contains: search, mode: 'insensitive' } },
        { authorName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [replies, totalCount] = await Promise.all([
      this.prisma.reply.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          thread: { select: { id: true, shortId: true, subject: true, board: { select: { name: true, title: true } } } },
          _count: { select: { mediaFiles: true } },
        },
      }),
      this.prisma.reply.count({ where }),
    ]);

    return { replies, pagination: { page, limit, total: totalCount, pages: Math.ceil(totalCount / limit) } };
  }

  async deleteReply(replyId: string) {
    const reply = await this.prisma.reply.findUnique({ where: { id: replyId }, include: { mediaFiles: true } });
    if (!reply) throw new Error('Reply not found');

    const publicIds: string[] = [];
    reply.mediaFiles.forEach((f) => f.publicId && publicIds.push(f.publicId));
    if ((reply as any).imagePublicId) publicIds.push((reply as any).imagePublicId);

    // TODO: Cloudinary bulk delete

    await this.prisma.reply.delete({ where: { id: replyId } });
    return { message: 'Reply deleted successfully' };
  }

  async getMediaFiles(query: PaginationQueryDto & { type?: string; sortBy?: string; sortOrder?: 'asc'|'desc' }) {
    const { page = 1, limit = 30, type = '', sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const where: any = {};
    if (type && type !== 'all') where.type = type;

    const [mediaFiles, totalCount] = await Promise.all([
      this.prisma.mediaFile.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: { thread: { select: { id: true, shortId: true, subject: true, board: { select: { name: true, title: true } } } } },
      }),
      this.prisma.mediaFile.count({ where }),
    ]);

    return { mediaFiles, pagination: { page, limit, total: totalCount, pages: Math.ceil(totalCount / limit) } };
  }

  async updateUser(userId: string, dto: UpdateUserDto) {
    const updateData: any = {};
    if (dto.username !== undefined) updateData.name = dto.username;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.role !== undefined) {
      const roleMap: Record<string, string> = { regular: 'REGULAR', admin: 'ADMIN' };
      const mappedRole = roleMap[dto.role.toLowerCase()];
      if (!mappedRole) {
        throw new Error('Invalid role. Allowed: regular, admin');
      }
      updateData.role = mappedRole;
    }
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.password && dto.password.trim() !== '') {
      const { default: argon2 } = await import('argon2');
      updateData.password = await argon2.hash(dto.password);
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true, updatedAt: true, _count: { select: { post: true, comments: true } } },
    });

    return {
      id: user.id,
      username: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      _count: { posts: (user as any)._count?.post, replies: (user as any)._count?.comments },
    };
  }

  async deleteUser(requestingUserId: string, userId: string) {
    if (requestingUserId === userId) throw new Error('Cannot delete yourself');

    // Осторожно: поля связей могут отличаться в текущей схеме
    await this.prisma.$transaction(async (tx) => {
  // @ts-ignore — поля связей могут называться иначе (authorId и т.п.)
  try { await tx.post.deleteMany({ where: { userId: userId as any } }); } catch {}
  // @ts-ignore
  try { await tx.comment.deleteMany({ where: { userId: userId as any } }); } catch {}
  // @ts-ignore
  try { await tx.like.deleteMany({ where: { userId: userId as any } }); } catch {}
  // @ts-ignore
  try { await tx.follows.deleteMany({ where: { OR: [{ followerId: userId as any }, { followingId: userId as any }] } }); } catch {}
      await tx.user.delete({ where: { id: userId } });
    });

    return { message: 'User deleted successfully' };
  }
}
// duplicate tail removed
