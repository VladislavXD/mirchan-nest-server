import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { CreateThreadDto } from './dto/create-thread.dto';
import { CreateReplyDto } from './dto/create-reply.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateTagDto } from './dto/create-tag.dto';
import { generatePosterHash, generateShortId } from './utils/forum.utils';

@Injectable()
export class ForumService {
  private readonly logger = new Logger(ForumService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  // ═══════════════════════════════════════════════════════════════
  // BOARDS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Получить все активные борды
   */
  async getBoards() {
    return this.prisma.board.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        title: true,
        description: true,
        isNsfw: true,
        threadsPerPage: true,
        _count: {
          select: { threads: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Получить борд по имени
   */
  async getBoardByName(boardName: string) {
    const board = await this.prisma.board.findUnique({
      where: { name: boardName },
      select: {
        id: true,
        name: true,
        title: true,
        description: true,
        isNsfw: true,
        isActive: true,
        threadsPerPage: true,
        createdAt: true,
        _count: {
          select: { threads: true },
        },
      },
    });

    if (!board || !board.isActive) {
      throw new NotFoundException('Board not found');
    }

    return board;
  }

  /**
   * Получить треды борда с пагинацией и фильтрацией
   */
  async getBoardThreads(
    boardName: string,
    page: number = 1,
    tagSlug?: string,
  ) {
    const board = await this.prisma.board.findUnique({
      where: { name: boardName },
    });

    if (!board || !board.isActive) {
      throw new NotFoundException('Board not found');
    }

    const skip = (page - 1) * board.threadsPerPage;

    const where = {
      boardId: board.id,
      isArchived: false,
      ...(tagSlug ? { threadTags: { some: { tag: { slug: tagSlug } } } } : {}),
    };

    const [threads, totalThreads] = await Promise.all([
      this.prisma.thread.findMany({
        where,
        include: {
          mediaFiles: true,
          threadTags: { include: { tag: true } },
          _count: { select: { replies: true } },
          replies: {
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              shortId: true,
              content: true,
              authorName: true,
              postNumber: true,
              createdAt: true,
              mediaFiles: true,
            },
          },
        },
        orderBy: [{ isPinned: 'desc' }, { lastBumpAt: 'desc' }],
        skip,
        take: board.threadsPerPage,
      }),
      this.prisma.thread.count({ where }),
    ]);

    return {
      board: {
        id: board.id,
        name: board.name,
        title: board.title,
        description: board.description,
        isNsfw: board.isNsfw,
      },
      threads,
      pagination: {
        page,
        threadsPerPage: board.threadsPerPage,
        totalThreads,
        totalPages: Math.ceil(totalThreads / board.threadsPerPage),
      },
    };
  }

  /**
   * Создать новый борд
   */
  async createBoard(createBoardDto: CreateBoardDto) {
    // Проверка уникальности имени
    const existing = await this.prisma.board.findUnique({
      where: { name: createBoardDto.name },
    });

    if (existing) {
      throw new BadRequestException('Board with this name already exists');
    }

    return this.prisma.board.create({
      data: {
        name: createBoardDto.name,
        title: createBoardDto.title,
        description: createBoardDto.description,
        isNsfw: createBoardDto.isNsfw || false,
        threadsPerPage: createBoardDto.threadsPerPage || 15,
        isActive: createBoardDto.isActive !== false,
      },
    });
  }

  /**
   * Обновить борд
   */
  async updateBoard(boardName: string, updateBoardDto: UpdateBoardDto) {
    const board = await this.prisma.board.findUnique({
      where: { name: boardName },
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    return this.prisma.board.update({
      where: { id: board.id },
      data: updateBoardDto,
    });
  }

  /**
   * Деактивировать борд
   */
  async deactivateBoard(boardName: string) {
    const board = await this.prisma.board.findUnique({
      where: { name: boardName },
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    return this.prisma.board.update({
      where: { id: board.id },
      data: { isActive: false },
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // THREADS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Получить тред по ID
   */
  async getThread(boardName: string, threadId: string) {
    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
      include: {
        mediaFiles: true,
        threadTags: { include: { tag: true } },
        board: { select: { name: true, title: true } },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: { mediaFiles: true },
        },
        _count: { select: { replies: true } },
      },
    });

    if (!thread || thread.board.name !== boardName) {
      throw new NotFoundException('Thread not found');
    }

    return thread;
  }

  /**
   * Создать новый тред
   */
  async createThread(
    boardName: string,
    createThreadDto: CreateThreadDto,
    ip: string,
    files?: any[],
  ) {
    const board = await this.prisma.board.findUnique({
      where: { name: boardName },
    });

    if (!board || !board.isActive) {
      throw new NotFoundException('Board not found');
    }

    const shortId = generateShortId();
    const posterHash = generatePosterHash(ip, boardName);

    // Upload media files if present
    const mediaFiles: any[] = [];
    if (files && files.length > 0) {
      for (const file of files) {
        try {
          const result = await this.cloudinary.uploadBuffer(
            file.buffer,
            `${Date.now()}_${file.originalname}`,
            `forum/${boardName}`,
          );

          mediaFiles.push({
            url: result.secure_url,
            previewUrl: result.secure_url, // TODO: Generate thumbnail
            publicId: result.public_id,
            mimeType: file.mimetype,
            size: file.size,
            type: result.resource_type === 'image' ? 'image' : 'video',
          });
        } catch (error) {
          this.logger.error('File upload error:', error);
        }
      }
    }

    return this.prisma.thread.create({
      data: {
        shortId,
        subject: createThreadDto.subject,
        content: createThreadDto.content,
        authorName: createThreadDto.authorName || 'Anonymous',
        posterHash,
        boardId: board.id,
        isPinned: createThreadDto.isPinned || false,
        mediaFiles: {
          create: mediaFiles,
        },
        ...(createThreadDto.tagIds && {
          threadTags: {
            create: createThreadDto.tagIds.map((tagId) => ({ tagId })),
          },
        }),
      },
      include: {
        mediaFiles: true,
        threadTags: { include: { tag: true } },
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // REPLIES
  // ═══════════════════════════════════════════════════════════════

  /**
   * Создать ответ в треде
   */
  async createReply(
    boardName: string,
    threadId: string,
    createReplyDto: CreateReplyDto,
    ip: string,
    files?: any[],
  ) {
    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
      include: {
        board: true,
        _count: { select: { replies: true } },
      },
    });

    if (!thread || thread.board.name !== boardName) {
      throw new NotFoundException('Thread not found');
    }

    const shortId = generateShortId();
    const posterHash = generatePosterHash(ip, boardName);
    const postNumber = thread._count.replies + 1;

    // Upload media files
    const mediaFiles: any[] = [];
    if (files && files.length > 0) {
      for (const file of files) {
        try {
          const result = await this.cloudinary.uploadBuffer(
            file.buffer,
            `${Date.now()}_${file.originalname}`,
            `forum/${boardName}/${threadId}`,
          );

          mediaFiles.push({
            url: result.secure_url,
            previewUrl: result.secure_url,
            publicId: result.public_id,
            mimeType: file.mimetype,
            size: file.size,
            type: result.resource_type === 'image' ? 'image' : 'video',
          });
        } catch (error) {
          this.logger.error('File upload error:', error);
        }
      }
    }

    // Create reply and update thread bump time
    const reply = await this.prisma.reply.create({
      data: {
        shortId,
        content: createReplyDto.content,
        authorName: createReplyDto.authorName || 'Anonymous',
        posterHash,
        postNumber,
        threadId: thread.id,
        mediaFiles: {
          create: mediaFiles,
        },
      },
      include: {
        mediaFiles: true,
      },
    });

    // Bump thread
    await this.prisma.thread.update({
      where: { id: threadId },
      data: { lastBumpAt: new Date() },
    });

    return reply;
  }

  // ═══════════════════════════════════════════════════════════════
  // CATEGORIES
  // ═══════════════════════════════════════════════════════════════

  /**
   * Получить все категории
   */
  async getCategories() {
    const rootCategories = await this.prisma.categories.findMany({
      where: { parentId: null },
      include: {
        children: {
          include: {
            children: true,
            _count: {
              select: { threads: true },
            },
          },
        },
        _count: {
          select: { threads: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return rootCategories;
  }

  /**
   * Получить категорию по slug
   */
  async getCategoryBySlug(slug: string) {
    const category = await this.prisma.categories.findUnique({
      where: { slug },
      include: {
        parent: true,
        children: {
          include: {
            _count: {
              select: { threads: true },
            },
          },
        },
        _count: { select: { threads: true } },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  /**
   * Получить треды категории с пагинацией и фильтрацией по тегу
   */
  async getCategoryThreads(
    slug: string,
    page: number = 1,
    limit: number = 10,
    tagSlug?: string,
  ) {
    const category = await this.prisma.categories.findUnique({
      where: { slug },
    });

    if (!category) {
      throw new NotFoundException(`Category with slug '${slug}' not found`);
    }

    const where: any = {
      categoryId: category.id,
      isArchived: false,
    };

    // Фильтр по тегу
    if (tagSlug) {
      where.threadTags = {
        some: {
          tag: { slug: tagSlug },
        },
      };
    }

    const [threads, total] = await Promise.all([
      this.prisma.thread.findMany({
        where,
        include: {
          mediaFiles: true,
          board: { select: { name: true, title: true } },
          threadTags: {
            include: { tag: true },
          },
          _count: {
            select: { replies: true },
          },
        },
        orderBy: [{ isPinned: 'desc' }, { lastBumpAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.thread.count({ where }),
    ]);

    return {
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        color: category.color,
        imageUrl: category.imageUrl,
      },
      threads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Создать тред внутри категории
   */
  async createThreadInCategory(
    slug: string,
    createThreadDto: CreateThreadDto,
    ip: string,
    files?: any[],
  ) {
    const category = await this.prisma.categories.findUnique({
      where: { slug },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Определяем борд (для лимитов файлов). Берем первый активный.
    const board = await this.prisma.board.findFirst({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    if (!board) {
      throw new BadRequestException('No active boards available');
    }

    const shortId = generateShortId();
    const posterHash = generatePosterHash(ip, board.name);

    // Upload media files if present
    const mediaFiles: any[] = [];
    if (files && files.length > 0) {
      for (const file of files) {
        try {
          const result = await this.cloudinary.uploadBuffer(
            file.buffer,
            `${Date.now()}_${file.originalname}`,
            `forum/${board.name}`,
          );

          mediaFiles.push({
            url: result.secure_url,
            previewUrl: result.secure_url,
            publicId: result.public_id,
            mimeType: file.mimetype,
            size: file.size,
            type: result.resource_type === 'image' ? 'image' : 'video',
          });
        } catch (error) {
          this.logger.error('File upload error:', error);
        }
      }
    }

    return this.prisma.thread.create({
      data: {
        shortId,
        subject: createThreadDto.subject,
        content: createThreadDto.content,
        authorName: createThreadDto.authorName || 'Anonymous',
        posterHash,
        boardId: board.id,
        categoryId: category.id,
        isPinned: createThreadDto.isPinned || false,
        mediaFiles: {
          create: mediaFiles,
        },
        ...(createThreadDto.tagIds && {
          threadTags: {
            create: createThreadDto.tagIds.map((tagId) => ({ tagId })),
          },
        }),
      },
      include: {
        mediaFiles: true,
        threadTags: { include: { tag: true } },
        board: { select: { name: true, title: true } },
        category: { select: { name: true, slug: true } },
      },
    });
  }

  /**
   * Получить тред категории по slug треда
   */
  async getThreadByCategoryAndSlug(categorySlug: string, threadSlug: string) {
    const category = await this.prisma.categories.findUnique({
      where: { slug: categorySlug },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const thread = await this.prisma.thread.findFirst({
      where: {
        categoryId: category.id,
        OR: [
          { slug: threadSlug },
          { id: threadSlug },
          { shortId: threadSlug },
        ],
      },
      include: {
        mediaFiles: true,
        threadTags: { include: { tag: true } },
        board: { select: { name: true, title: true } },
        category: { select: { name: true, slug: true } },
        replies: {
          include: {
            mediaFiles: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: { replies: true },
        },
      },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    return thread;
  }

  /**
   * Создать ответ в треде категории
   */
  async createReplyInCategory(
    categorySlug: string,
    threadId: string,
    createReplyDto: CreateReplyDto,
    ip: string,
    files?: any[],
  ) {
    const category = await this.prisma.categories.findUnique({
      where: { slug: categorySlug },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const thread = await this.prisma.thread.findFirst({
      where: {
        categoryId: category.id,
        OR: [
          { id: threadId },
          { shortId: threadId },
          { slug: threadId },
        ],
      },
      include: { board: true },
    });

    if (!thread || thread.isArchived) {
      throw new NotFoundException('Thread not found or archived');
    }

    if (thread.isLocked) {
      throw new BadRequestException('Thread is locked');
    }

    const posterHash = generatePosterHash(ip, thread.board.name);

    // Получаем следующий номер поста
    const replyCount = await this.prisma.reply.count({
      where: { threadId: thread.id },
    });
    const postNumber = replyCount + 2; // +1 для самого треда, +1 для нового ответа
    const shortId = generateShortId();

    // Upload media files if present
    const mediaFiles: any[] = [];
    if (files && files.length > 0) {
      for (const file of files) {
        try {
          const result = await this.cloudinary.uploadBuffer(
            file.buffer,
            `${Date.now()}_${file.originalname}`,
            `forum/${thread.board.name}`,
          );

          mediaFiles.push({
            url: result.secure_url,
            previewUrl: result.secure_url,
            publicId: result.public_id,
            mimeType: file.mimetype,
            size: file.size,
            type: result.resource_type === 'image' ? 'image' : 'video',
          });
        } catch (error) {
          this.logger.error('File upload error:', error);
        }
      }
    }

    // Создаем ответ и обновляем lastBumpAt треда
    const reply = await this.prisma.reply.create({
      data: {
        shortId,
        postNumber,
        content: createReplyDto.content,
        authorName: createReplyDto.authorName || 'Anonymous',
        posterHash,
        threadId: thread.id,
        mediaFiles: {
          create: mediaFiles,
        },
      },
      include: {
        mediaFiles: true,
      },
    });

    // Обновляем lastBumpAt треда
    await this.prisma.thread.update({
      where: { id: thread.id },
      data: { lastBumpAt: new Date() },
    });

    return reply;
  }

  /**
   * Создать категорию
   */
  async createCategory(createCategoryDto: CreateCategoryDto) {
    return this.prisma.categories.create({
      data: createCategoryDto,
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // TAGS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Получить все теги
   */
  async getTags() {
    return this.prisma.tag.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        color: true,
        _count: { select: { threadTags: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Создать тег
   */
  async createTag(createTagDto: CreateTagDto) {
    return this.prisma.tag.create({
      data: createTagDto,
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // STATS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Получить статистику форума
   */
  async getForumStats() {
    const [totalThreads, totalReplies, totalBoards] = await Promise.all([
      this.prisma.thread.count({ where: { isArchived: false } }),
      this.prisma.reply.count(),
      this.prisma.board.count({ where: { isActive: true } }),
    ]);

    return {
      totalThreads,
      totalReplies,
      totalPosts: totalThreads + totalReplies,
      totalBoards,
    };
  }

  /**
   * Получить последние треды с пагинацией
   */
  async getLatestThreads(page: number = 1, limit: number = 20, nsfw: string = '0') {
    const skip = (page - 1) * limit;
    const includeNsfw = nsfw === '1';

    const where: any = {
      isArchived: false,
    };

    // Фильтр по NSFW
    if (!includeNsfw) {
      where.board = {
        isNsfw: false,
      };
    }

    const [threads, total] = await Promise.all([
      this.prisma.thread.findMany({
        where,
        include: {
          mediaFiles: {
            take: 1,
            orderBy: { createdAt: 'asc' },
          },
          threadTags: {
            include: {
              tag: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  icon: true,
                  color: true,
                },
              },
            },
          },
          board: {
            select: {
              name: true,
              title: true,
            },
          },
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
          replies: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              authorName: true,
              createdAt: true,
            },
          },
          _count: {
            select: { replies: true },
          },
        },
        orderBy: { lastBumpAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.thread.count({ where }),
    ]);

    // Трансформируем данные для удобства frontend
    const items = threads.map((thread) => {
      const lastReply = thread.replies[0];
      const firstMediaFile = thread.mediaFiles[0];

      return {
        id: thread.id,
        shortId: thread.shortId,
        subject: thread.subject,
        content: thread.content,
        previewUrl: firstMediaFile?.previewUrl || null,
        imageUrl: firstMediaFile?.url || null,
        createdAt: thread.createdAt,
        lastBumpAt: thread.lastBumpAt,
        lastReplyAt: lastReply?.createdAt || null,
        lastReplyAuthorName: lastReply?.authorName || null,
        replyCount: thread._count.replies,
        board: thread.board,
        category: thread.category,
        tags: thread.threadTags.map((tt) => tt.tag),
        isPinned: thread.isPinned,
        isLocked: thread.isLocked,
        slug: thread.slug,
      };
    });

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Получить последние посты (replies)
   */
  async getLatestPosts(limit: number = 10) {
    return this.prisma.reply.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        shortId: true,
        content: true,
        authorName: true,
        createdAt: true,
        thread: {
          select: {
            id: true,
            shortId: true,
            subject: true,
            board: {
              select: { name: true, title: true },
            },
          },
        },
      },
    });
  }
}
