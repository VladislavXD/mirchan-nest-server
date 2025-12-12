import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { NewsService } from './news.service';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  /**
   * Получение топ новостей
   * GET /news/headlines?lang=ru&category=technology
   */
  @Get('headlines')
  async getHeadlines(
    @Query('lang') lang: string = 'ru',
    @Query('category') category: string = 'technology',
  ) {
    try {
      return await this.newsService.getHeadlines(lang, category);
    } catch (error) {
      throw new HttpException(
        'Ошибка при получении новостей',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Поиск новостей
   * GET /news/search?q=react&pageSize=5
   */
  @Get('search')
  async searchNews(
    @Query('q') query: string,
    @Query('pageSize') pageSize: string = '5',
  ) {
    if (!query) {
      throw new HttpException(
        'Параметр q обязателен',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      return await this.newsService.searchNews(query, parseInt(pageSize, 10));
    } catch (error) {
      throw new HttpException(
        'Ошибка при поиске новостей',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
