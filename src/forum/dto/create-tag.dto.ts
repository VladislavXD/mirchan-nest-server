import { IsString, IsOptional, IsHexColor } from 'class-validator';

export class CreateTagDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsString()
  @IsHexColor()
  @IsOptional()
  color?: string;
}
