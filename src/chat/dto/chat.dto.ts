import { IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO для получения сообщений чата с пагинацией
 */
export class GetMessagesDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 50;
}

/**
 * DTO для создания чата (параметр маршрута)
 */
export class CreateChatDto {
  @IsNotEmpty()
  otherUserId: string;
}
