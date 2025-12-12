import { IsBoolean, IsEmail, IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class GetUsersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  role?: 'regular' | 'admin';
}

export class UpdateUserRoleDto {
  @IsString()
  role!: 'regular' | 'admin';
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  role?: 'regular' | 'admin';

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  password?: string;
}

export class CreateBoardDto {
  @IsString()
  name!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isNsfw?: boolean = false;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  maxFileSize?: number = 5242880;

  @IsOptional()
  allowedFileTypes?: string[] = ['jpg','jpeg','png','gif','webp'];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  postsPerPage?: number = 15;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  threadsPerPage?: number = 10;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  bumpLimit?: number = 500;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  imageLimit?: number = 150;
}

export class UpdateBoardDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  allowedFileTypes?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  maxFileSize?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  bumpLimit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  threadLimit?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}
