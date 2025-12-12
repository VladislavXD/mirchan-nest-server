import { IsString, IsOptional, IsBoolean, IsArray, MaxLength, MinLength } from 'class-validator';

export class CreateThreadDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  subject: string;

  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  content: string;

  @IsString()
  @IsOptional()
  authorName?: string;

  @IsArray()
  @IsOptional()
  tagIds?: string[];

  @IsBoolean()
  @IsOptional()
  isPinned?: boolean;
}
