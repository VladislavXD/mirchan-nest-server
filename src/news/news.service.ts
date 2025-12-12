import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

interface NewsCache {
  headlines: Record<string, any>;
  headlinesTime: number | null;
  search: Map<string, { data: any; timestamp: number }>;
}

@Injectable()
export class NewsService {
  private readonly logger = new Logger(NewsService.name);
  private readonly API_KEY = 'c3aee40fa7bd44689311929ecb336252';
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 минут
  
  private newsCache: NewsCache = {
    headlines: {},
    headlinesTime: null,
    search: new Map(),
  };

  /**
   * Получение топ новостей
   */
  async getHeadlines(lang: string = 'ru', category: string = 'technology') {
    const cacheKey = `${lang}-${category}`;

    // Проверяем кэш
    if (
      this.newsCache.headlines[cacheKey] &&
      this.newsCache.headlinesTime &&
      Date.now() - this.newsCache.headlinesTime < this.CACHE_DURATION
    ) {
      this.logger.log('Возвращаем новости из кэша');
      return this.newsCache.headlines[cacheKey];
    }

    try {
      // Запрос к NewsAPI
      this.logger.log('Запрашиваем новости с NewsAPI...');
      const response = await axios.get('https://newsapi.org/v2/everything', {
        params: {
          language: lang,
          q: category,
          sortBy: 'publishedAt',
          pageSize: 10,
          apiKey: this.API_KEY,
        },
        headers: {
          'User-Agent': 'MirChan/1.0',
        },
      });

      // Сохраняем в кэш
      this.newsCache.headlines[cacheKey] = response.data;
      this.newsCache.headlinesTime = Date.now();

      return response.data;
    } catch (error) {
      this.logger.error('Ошибка при получении новостей:', error.message);
      // Возвращаем демо-новости
      return this.getMockNews();
    }
  }

  /**
   * Поиск новостей
   */
  async searchNews(query: string, pageSize: number = 5) {
    const cacheKey = `search-${query}-${pageSize}`;

    // Проверяем кэш
    const cached = this.newsCache.search.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      this.logger.log('Возвращаем результаты поиска из кэша');
      return cached.data;
    }

    try {
      // Запрос к NewsAPI
      const response = await axios.get('https://newsapi.org/v2/everything', {
        params: {
          q: query,
          language: 'ru',
          sortBy: 'publishedAt',
          pageSize,
          apiKey: this.API_KEY,
        },
        headers: {
          'User-Agent': 'MirChan/1.0',
        },
      });

      // Сохраняем в кэш
      this.newsCache.search.set(cacheKey, {
        data: response.data,
        timestamp: Date.now(),
      });

      return response.data;
    } catch (error) {
      this.logger.error('Ошибка при поиске новостей:', error.message);
      return {
        error: 'Ошибка при поиске новостей',
        articles: [],
        status: 'error',
        totalResults: 0,
      };
    }
  }

  /**
   * Демо-новости (fallback)
   */
  private getMockNews() {
    return {
      articles: [
        {
          author: 'TechCrunch',
          content:
            'Искусственный интеллект продолжает развиваться невероятными темпами...',
          description:
            'Новые технологии ИИ меняют мир программирования и разработки.',
          publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          source: { id: 'techcrunch', name: 'TechCrunch' },
          title: 'ИИ революционизирует разработку программного обеспечения',
          url: 'https://techcrunch.com/ai-development',
          urlToImage:
            'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=200&fit=crop',
        },
        {
          author: 'Wired',
          content:
            'React 19 приносит долгожданные улучшения в производительности...',
          description:
            'React 19 и Next.js 15 приносят множество улучшений для разработчиков.',
          publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          source: { id: 'wired', name: 'Wired' },
          title: 'React 19: что нового для веб-разработчиков',
          url: 'https://wired.com/react-19-features',
          urlToImage:
            'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=200&fit=crop',
        },
        {
          author: 'TechNews',
          content:
            'Облачные технологии становятся всё более доступными для стартапов...',
          description:
            'Новые сервисы делают облачную разработку проще и дешевле.',
          publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          source: { id: 'technews', name: 'TechNews' },
          title: 'Облачные платформы 2025: обзор лучших решений',
          url: 'https://technews.com/cloud-2025',
          urlToImage:
            'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=200&fit=crop',
        },
        {
          author: 'DevToday',
          content:
            'TypeScript 5.4 принес значительные улучшения в производительность...',
          description:
            'Статистика использования и новые фичи TypeScript 5.4.',
          publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          source: { id: 'devtoday', name: 'DevToday' },
          title:
            'TypeScript 5.4: улучшения производительности и новый синтаксис',
          url: 'https://devtoday.com/typescript-5-4',
          urlToImage:
            'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400&h=200&fit=crop',
        },
        {
          author: 'JavaScript Weekly',
          content:
            'React Native и Flutter продолжают конкуренцию за рынок мобильной разработки...',
          description:
            'Сравнение популярных фреймворков для мобильной разработки.',
          publishedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
          source: { id: 'jsweekly', name: 'JavaScript Weekly' },
          title: 'Мобильная разработка 2025: React Native vs Flutter',
          url: 'https://jsweekly.com/mobile-development-2025',
          urlToImage:
            'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=200&fit=crop',
        },
      ],
      status: 'ok',
      totalResults: 5,
    };
  }
}
