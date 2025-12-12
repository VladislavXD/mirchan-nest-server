import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';

export class CreateReplyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  content: string;

  @IsString()
  @IsOptional()
  authorName?: string;
}
