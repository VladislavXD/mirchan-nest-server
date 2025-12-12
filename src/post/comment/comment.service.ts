import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { CreateCommentDto } from './dto/create-comment.dto'
import { PrismaService } from 'src/prisma/prisma.service'

@Injectable()
export class CommentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateCommentDto) {
    const { postId, content } = dto
    return this.prisma.comment.create({
      data: { postId, userId, content },
    })
  }

  async remove(id: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id } })
    if (!comment) throw new NotFoundException('Комментарий не найден')
    if (comment.userId !== userId) throw new ForbiddenException('Нет доступа')
    await this.prisma.comment.delete({ where: { id } })
    return comment
  }
}
