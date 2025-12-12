import { IsString, IsOptional, IsBoolean, IsInt, Min, Max, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBoardDto {
  @IsString()
  name: string;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isNsfw?: boolean;

  @IsInt()
  @Min(10)
  @Max(50)
  @IsOptional()
  threadsPerPage?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
