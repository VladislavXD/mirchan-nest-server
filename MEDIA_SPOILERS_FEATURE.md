# Media & Spoilers Feature - Backend Implementation

## Обзор

Добавлена поддержка множественных медиа файлов (фото и видео) и спойлеров для постов.

## Изменения в схеме базы данных

### Модель Post
```prisma
model Post {
  id             String      @id @default(uuid())
  content        Json        // Текстовый контент (JSON)
  contentSpoiler Boolean     @default(false) // ✅ НОВОЕ: Спойлер для текста
  media          MediaFile[] // ✅ НОВОЕ: Массив медиа файлов
  emojiUrls      String[]    @default([])
  author         User        @relation(...)
  authorId       String
  likes          Like[]
  views          String[]    @default([])
  comments       Comment[]
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt // ✅ НОВОЕ
}
```

### Модель MediaFile (новая)
```prisma
model MediaFile {
  id         String    @id @default(uuid())
  url        String    // URL в Cloudinary
  publicId   String    // Public ID для удаления
  previewUrl String?   // Превью/thumbnail
  name       String?   // Оригинальное имя
  size       Int?      // Размер в байтах
  mimeType   String    // MIME тип
  type       MediaType // IMAGE | VIDEO | GIF
  width      Int?
  height     Int?
  duration   Int?      // Для видео
  spoiler    Boolean   @default(false) // ✅ Спойлер для медиа
  nsfw       Boolean   @default(false) // ✅ NSFW контент
  
  // Связи
  postId   String?
  post     Post?   @relation(...)
  threadId String?
  thread   Thread? @relation(...)
  replyId  String?
  reply    Reply?  @relation(...)
  
  createdAt DateTime @default(now())
}

enum MediaType {
  IMAGE
  VIDEO
  GIF
}
```

## API Endpoints

### POST /posts - Создание поста

**Ограничения:**
- До 30 медиа файлов одновременно
- Максимальный размер файла: 100MB
- Форматы: jpg, jpeg, png, gif, webp, mp4, webm, ogg

**Request (multipart/form-data):**
```typescript
{
  content: string | object,           // Текстовый контент
  contentSpoiler: boolean,            // Спойлер для текста
  emojiUrls: string[],                // Массив URL emoji
  mediaSpoilers: number[],            // Индексы файлов со спойлером [0, 2]
  media: File[]                       // Массив файлов
}
```

**Response:**
```typescript
{
  id: string,
  content: Json,
  contentSpoiler: boolean,
  media: MediaFile[],                 // ✅ Массив медиа
  emojiUrls: string[],
  author: User,
  likes: Like[],
  comments: Comment[],
  views: string[],
  createdAt: Date,
  updatedAt: Date
}
```

### PATCH /posts/:id - Обновление поста

**Request:**
```typescript
{
  content?: string | object,
  contentSpoiler?: boolean,
  emojiUrls?: string[]
}
```

**Note:** Пока не поддерживается обновление медиа файлов (можно добавить позже).

### GET /posts - Получение всех постов
Включает `media: true` в response.

### GET /posts/:id - Получение одного поста
Включает `media: true` в response.

### DELETE /posts/:id - Удаление поста
Автоматически удаляет все связанные медиа файлы из Cloudinary.

## DTOs

### CreatePostDto
```typescript
export class CreatePostDto {
  mediaFiles?: MediaFileDto[]         // ✅ Массив медиа
  content: string | object
  contentSpoiler?: boolean            // ✅ Спойлер для текста
  emojiUrls?: string[]
  mediaSpoilers?: number[]            // ✅ Индексы со спойлером
}

export class MediaFileDto {
  buffer?: Buffer
  originalname?: string
  mimetype?: string
  size?: number
  spoiler?: boolean
}
```

### UpdatePostDto
Наследует от `PartialType(CreatePostDto)` - все поля опциональны.

## Логика сервиса

### PostService.create()
1. Загружает все медиа файлы в Cloudinary
2. Определяет тип медиа (IMAGE/VIDEO/GIF) по MIME типу
3. Проверяет массив `mediaSpoilers` для каждого файла
4. Создает записи MediaFile с связью к Post
5. Возвращает пост с включенными медиа

### PostService.remove()
1. Загружает пост с медиа файлами
2. Удаляет каждый медиа файл из Cloudinary по `publicId`
3. Удаляет записи MediaFile из БД
4. Удаляет комментарии, лайки
5. Удаляет пост

## Примеры использования

### Создание поста с медиа и спойлерами (Frontend)
```typescript
const formData = new FormData();
formData.append('content', 'Мой пост со спойлером!');
formData.append('contentSpoiler', 'true'); // Текст под спойлером

// Добавляем файлы
mediaFiles.forEach(file => {
  formData.append('media', file);
});

// Указываем, какие файлы со спойлером (по индексу)
formData.append('mediaSpoilers', JSON.stringify([0, 2])); // 1-й и 3-й файлы

const response = await fetch('/posts', {
  method: 'POST',
  body: formData,
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Response с медиа
```json
{
  "id": "uuid",
  "content": "Мой пост со спойлером!",
  "contentSpoiler": true,
  "media": [
    {
      "id": "uuid",
      "url": "https://res.cloudinary.com/.../image.jpg",
      "publicId": "mirchanPost/post_...",
      "previewUrl": "https://res.cloudinary.com/.../thumb.jpg",
      "name": "photo.jpg",
      "size": 1024000,
      "mimeType": "image/jpeg",
      "type": "IMAGE",
      "width": 1920,
      "height": 1080,
      "spoiler": true,
      "nsfw": false,
      "createdAt": "2026-01-18T..."
    },
    {
      "id": "uuid",
      "url": "https://res.cloudinary.com/.../video.mp4",
      "type": "VIDEO",
      "duration": 30,
      "spoiler": false,
      ...
    }
  ],
  "emojiUrls": [],
  "createdAt": "2026-01-18T...",
  "updatedAt": "2026-01-18T..."
}
```

## Миграция данных

**⚠️ ВАЖНО:** Старые посты с полем `imageUrl` нужно мигрировать!

### Скрипт миграции (TODO)
```typescript
// nestjs-server/scripts/migrate-posts-to-media.ts
async function migrateOldPosts() {
  const oldPosts = await prisma.post.findMany({
    where: {
      imageUrl: { not: null }
    }
  });

  for (const post of oldPosts) {
    // Создать MediaFile из imageUrl
    await prisma.mediaFile.create({
      data: {
        url: post.imageUrl,
        publicId: extractPublicId(post.imageUrl),
        type: 'IMAGE',
        postId: post.id
      }
    });
  }
}
```

## Известные ограничения

- ❌ Нет обновления медиа файлов через PATCH (можно добавить)
- ❌ Нет batch загрузки (все файлы загружаются последовательно)
- ❌ Нет прогресса загрузки
- ❌ Нет автоматического сжатия изображений
- ❌ Нет генерации превью для видео (Cloudinary может это делать)

## TODO

1. **Миграция старых постов**: Создать скрипт для конвертации `imageUrl` → `MediaFile`
2. **Batch upload**: Использовать `Promise.all()` для параллельной загрузки
3. **Сжатие**: Настроить Cloudinary transformations для автосжатия
4. **Превью видео**: Включить генерацию thumbnail для видео
5. **Обновление медиа**: Добавить endpoint для добавления/удаления медиа в существующих постах
6. **NSFW detection**: Интеграция с Cloudinary moderation API
