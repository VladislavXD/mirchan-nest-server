import { IsNotEmpty, IsOptional, IsString, IsBoolean, IsISO8601, IsInt, Min, Max, IsUrl } from 'class-validator';

export class CreateNoticeDto {
  @IsNotEmpty()
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsISO8601()
  expiredAt?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsUrl()
  emojiUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  durationDays?: number;
}
