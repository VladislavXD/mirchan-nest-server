# Quick Start - Media & Spoilers

## Что было сделано

### ✅ База данных
- Добавлено поле `contentSpoiler` в модель Post
- Создана модель `MediaFile` для хранения медиа
- Добавлен enum `MediaType` (IMAGE, VIDEO, GIF)
- Поддержка связей: Post → MediaFile, Thread → MediaFile, Reply → MediaFile

### ✅ Backend (NestJS)
- `CreatePostDto`: Новые поля для медиа и спойлеров
- `PostService.create()`: Загрузка множественных файлов в Cloudinary
- `PostService.remove()`: Удаление всех медиа из Cloudinary
- `PostController`: FilesInterceptor для приема до 30 файлов
- Все методы возвращают `media: MediaFile[]`

### ✅ Документация
- `MEDIA_SPOILERS_FEATURE.md` - Полное описание фичи
- Примеры запросов и ответов API

## Следующие шаги

### 1. Применить миграцию БД

**Опция A: Сброс БД (DEV ONLY!)**
```bash
cd nestjs-server
npx prisma migrate reset
npx prisma migrate dev --name initial
```

**Опция B: Создать миграцию без сброса**
```bash
cd nestjs-server
npx prisma migrate dev --name add_media_and_spoilers
```

### 2. Обновить Frontend

#### Express API (если используется)
Проверьте, использует ли Express API те же модели. Если да:
1. Скопируйте `schema.prisma` в `express-api/prisma/`
2. Запустите `npx prisma generate` в `express-api/`
3. Обновите контроллеры и сервисы аналогично NestJS

#### Next.js Client
Обновите типы и API calls:

```typescript
// client-next/src/types/post.ts
interface MediaFile {
  id: string;
  url: string;
  publicId: string;
  previewUrl?: string;
  name?: string;
  size?: number;
  mimeType: string;
  type: 'IMAGE' | 'VIDEO' | 'GIF';
  width?: number;
  height?: number;
  duration?: number;
  spoiler: boolean;
  nsfw: boolean;
  createdAt: string;
}

interface Post {
  id: string;
  content: string | object;
  contentSpoiler: boolean; // ✅ НОВОЕ
  media: MediaFile[];      // ✅ НОВОЕ (было imageUrl)
  emojiUrls: string[];
  author: User;
  likes: Like[];
  comments: Comment[];
  views: string[];
  createdAt: string;
  updatedAt: string;
}
```

Обновите RTK Query / API service:
```typescript
// client-next/src/services/post.service.ts
createPost: builder.mutation<Post, FormData>({
  query: (formData) => ({
    url: '/posts',
    method: 'POST',
    body: formData,
  }),
}),
```

### 3. Обновить UI компоненты

#### MinimalPostForm
Уже готов! (`MediaPreviewSlider` + множественные файлы)

Добавить чекбокс для `contentSpoiler`:
```tsx
<Checkbox
  isSelected={contentSpoiler}
  onValueChange={setContentSpoiler}
>
  Скрыть текст под спойлером
</Checkbox>
```

#### PostCard - отображение спойлеров

```tsx
// Компонент для текста со спойлером
{post.contentSpoiler && !showContent ? (
  <div 
    className="blur-md cursor-pointer"
    onClick={() => setShowContent(true)}
  >
    {post.content}
  </div>
) : (
  <div>{post.content}</div>
)}

// Компонент для медиа со спойлером
{media.spoiler && !revealed ? (
  <div className="relative">
    <div className="blur-xl">{/* Image */}</div>
    <button onClick={() => setRevealed(true)}>
      Показать спойлер
    </button>
  </div>
) : (
  <Image src={media.url} ... />
)}
```

### 4. Тестирование

```bash
# Создать пост с медиа и спойлерами
curl -X POST http://localhost:3000/posts \
  -H "Authorization: Bearer $TOKEN" \
  -F "content=Тестовый пост со спойлером" \
  -F "contentSpoiler=true" \
  -F "media=@photo1.jpg" \
  -F "media=@video.mp4" \
  -F "media=@photo2.jpg" \
  -F "mediaSpoilers=[0,2]"

# Получить посты с медиа
curl http://localhost:3000/posts
```

## Чек-лист

- [ ] Применена миграция БД
- [ ] Prisma Client сгенерирован
- [ ] Backend запускается без ошибок
- [ ] Frontend типы обновлены
- [ ] MinimalPostForm отправляет множественные файлы
- [ ] PostCard отображает медиа из массива
- [ ] Компонент спойлера для текста
- [ ] Компонент спойлера для медиа
- [ ] Тестирование создания поста
- [ ] Тестирование удаления поста

## Миграция старых постов

Если в БД есть старые посты с `imageUrl`, создайте скрипт:

```typescript
// nestjs-server/scripts/migrate-old-posts.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const posts = await prisma.$queryRaw`
    SELECT id, "imageUrl" 
    FROM "Post" 
    WHERE "imageUrl" IS NOT NULL
  `;

  for (const post of posts) {
    // Извлекаем publicId из URL
    const publicId = extractPublicId(post.imageUrl);
    
    await prisma.mediaFile.create({
      data: {
        url: post.imageUrl,
        publicId,
        type: 'IMAGE',
        mimeType: 'image/jpeg', // или определить из URL
        postId: post.id
      }
    });
  }

  console.log(`Migrated ${posts.length} posts`);
}

main();
```

Запуск:
```bash
ts-node scripts/migrate-old-posts.ts
```
