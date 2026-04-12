import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Authorization } from 'src/auth/decorators/auth.decorator';
import { Authorized } from 'src/auth/decorators/authorized.decorator';
import { GroupService } from './group.service';
import {
  AddMembersDto,
  CreateGroupDto,
  MemberActionDto,
  UpdateGroupDto,
} from './dto/group.dto';

@Controller('groups')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Authorization()
  @HttpCode(HttpStatus.CREATED)
  @Post()
  @UseInterceptors(
    FileInterceptor('avatar', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return callback(
            new BadRequestException('Разрешены только изображения (jpg, jpeg, png, gif, webp)'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async createGroup(
    @Authorized('id') userId: string,
    @Body() dto: CreateGroupDto,
    @UploadedFile() avatar?: string,
  ) {
    return this.groupService.createGroup(userId, dto, avatar);
  }

  @Authorization()
  @HttpCode(HttpStatus.OK)
  @Get()
  async getUserGroups(@Authorized('id') userId: string) {
    return this.groupService.getUserGroups(userId);
  }

  @Authorization()
  @HttpCode(HttpStatus.OK)
  @Get(':groupId')
  async getGroupById(
    @Authorized('id') userId: string,
    @Param('groupId') groupId: string,
  ) {
    return this.groupService.getGroupById(userId, groupId);
  }

  @Authorization()
  @HttpCode(HttpStatus.OK)
  @Patch(':groupId')
  @UseInterceptors(
    FileInterceptor('avatar', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return callback(
            new BadRequestException('Разрешены только изображения (jpg, jpeg, png, gif, webp)'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async updateGroup(
    @Authorized('id') userId: string,
    @Param('groupId') groupId: string,
    @Body() dto: UpdateGroupDto,
    @UploadedFile() avatar?: string,
  ) {
    return this.groupService.updateGroup(userId, groupId, dto, avatar);
  }

  @Authorization()
  @HttpCode(HttpStatus.OK)
  @Delete(':groupId')
  async deleteGroup(
    @Authorized('id') userId: string,
    @Param('groupId') groupId: string,
  ) {
    return this.groupService.deleteGroup(userId, groupId);
  }

  @Authorization()
  @HttpCode(HttpStatus.OK)
  @Post(':groupId/members')
  async addMembers(
    @Authorized('id') userId: string,
    @Param('groupId') groupId: string,
    @Body() dto: AddMembersDto,
  ) {
    return this.groupService.addMembers(userId, groupId, dto);
  }

  @Authorization()
  @HttpCode(HttpStatus.OK)
  @Delete(':groupId/members/:targetUserId')
  async removeMember(
    @Authorized('id') userId: string,
    @Param('groupId') groupId: string,
    @Param('targetUserId') targetUserId: string,
  ) {
    return this.groupService.removeMember(userId, groupId, targetUserId);
  }

  @Authorization()
  @HttpCode(HttpStatus.OK)
  @Post(':groupId/admins')
  async addAdmin(
    @Authorized('id') userId: string,
    @Param('groupId') groupId: string,
    @Body() dto: MemberActionDto,
  ) {
    return this.groupService.addAdmin(userId, groupId, dto.targetUserId);
  }

  @Authorization()
  @HttpCode(HttpStatus.OK)
  @Delete(':groupId/admins/:targetUserId')
  async removeAdmin(
    @Authorized('id') userId: string,
    @Param('groupId') groupId: string,
    @Param('targetUserId') targetUserId: string,
  ) {
    return this.groupService.removeAdmin(userId, groupId, targetUserId);
  }

  @Authorization()
  @HttpCode(HttpStatus.OK)
  @Post(':groupId/join')
  async joinGroup(
    @Authorized('id') userId: string,
    @Param('groupId') groupId: string,
  ) {
    return this.groupService.joinGroup(userId, groupId);
  }

  @Authorization()
  @HttpCode(HttpStatus.OK)
  @Post(':groupId/leave')
  async leaveGroup(
    @Authorized('id') userId: string,
    @Param('groupId') groupId: string,
  ) {
    return this.groupService.leaveGroup(userId, groupId);
  }
}
