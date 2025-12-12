# Admin API Documentation

## Обзор

Admin API предоставляет функциональность управления системой для администраторов.

**Базовый URL**: `/admin`

**Требования безопасности**:
- Все эндпоинты требуют аутентификации (JWT токен)
- Все эндпоинты требуют роли `ADMIN`
- Используется декоратор `@Authorization(UserRole.ADMIN)`

## Аутентификация

Все запросы должны включать JWT токен в заголовке:

```http
Authorization: Bearer <your_jwt_token>
```

Токен должен содержать пользователя с ролью `ADMIN`, иначе вернется ошибка `403 Forbidden`.

---

## Эндпоинты

### 📊 Статистика

#### Получить общую статистику системы

```http
GET /admin/stats
```

**Ответ**:
```json
{
  "users": {
    "total": 1500,
    "active": 1200,
    "admins": 5
  },
  "boards": {
    "total": 25,
    "active": 20
  },
  "threads": {
    "total": 5000,
    "today": 150
  },
  "replies": {
    "total": 25000,
    "today": 800
  },
  "media": {
    "total": 10000,
    "totalSize": 5242880000
  }
}
```

---

### 👥 Пользователи

#### Получить список пользователей

```http
GET /admin/users?page=1&limit=20&search=&role=&sortBy=createdAt&sortOrder=desc
```

**Query параметры**:
- `page` (optional, default: 1) - Номер страницы
- `limit` (optional, default: 20) - Количество записей на странице
- `search` (optional) - Поиск по email или имени
- `role` (optional) - Фильтр по роли: `regular` | `admin`
- `sortBy` (optional, default: `createdAt`) - Поле сортировки
- `sortOrder` (optional, default: `desc`) - Направление сортировки: `asc` | `desc`

**Ответ**:
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "REGULAR",
      "isActive": true,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "lastSeen": "2025-12-12T10:00:00.000Z",
      "provider": "local",
      "_count": {
        "post": 50,
        "comments": 200,
        "likes": 300
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1500,
    "pages": 75
  }
}
```

#### Обновить данные пользователя

```http
PUT /admin/users/:userId
```

**Body**:
```json
{
  "username": "new_username",
  "email": "newemail@example.com",
  "role": "admin",
  "isActive": true,
  "password": "new_password"
}
```

**Примечание**: Все поля опциональны. `password` будет захэширован через argon2.

**Ответ**:
```json
{
  "id": "uuid",
  "username": "new_username",
  "email": "newemail@example.com",
  "role": "ADMIN",
  "isActive": true,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-12-12T10:00:00.000Z",
  "_count": {
    "posts": 50,
    "replies": 200
  }
}
```

#### Обновить роль пользователя

```http
PUT /admin/users/:userId/role
```

**Body**:
```json
{
  "role": "admin"
}
```

**Допустимые значения**: `regular` | `admin`

**Ответ**:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "ADMIN",
  "isActive": true
}
```

#### Переключить статус активности пользователя

```http
PATCH /admin/users/:userId/status
```

**Ответ**:
```json
{
  "id": "uuid",
  "isActive": false
}
```

#### Удалить пользователя

```http
DELETE /admin/users/:userId
```

**Ответ**:
```json
{
  "message": "User deleted successfully"
}
```

**Примечание**: Удаляются также все связанные данные (посты, комментарии, лайки, подписки).

---

### 📋 Доски

#### Получить список досок

```http
GET /admin/boards?page=1&limit=20&search=&sortBy=createdAt&sortOrder=desc
```

**Query параметры**: Аналогичны параметрам для пользователей.

**Ответ**:
```json
{
  "boards": [
    {
      "id": "uuid",
      "name": "tech",
      "title": "Technology",
      "description": "Tech discussions",
      "isNsfw": false,
      "isActive": true,
      "maxFileSize": 5242880,
      "allowedFileTypes": ["jpg", "png", "gif"],
      "postsPerPage": 15,
      "threadsPerPage": 10,
      "bumpLimit": 500,
      "imageLimit": 150,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "_count": {
        "threads": 1000
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 25,
    "pages": 2
  }
}
```

#### Создать доску

```http
POST /admin/boards
```

**Body**:
```json
{
  "name": "tech",
  "title": "Technology",
  "description": "Tech discussions",
  "isNsfw": false,
  "maxFileSize": 5242880,
  "allowedFileTypes": ["jpg", "jpeg", "png", "gif", "webp"],
  "postsPerPage": 15,
  "threadsPerPage": 10,
  "bumpLimit": 500,
  "imageLimit": 150
}
```

**Обязательные поля**: `name`, `title`

**Ответ**: `201 Created`
```json
{
  "id": "uuid",
  "name": "tech",
  "title": "Technology",
  // ... остальные поля
}
```

#### Обновить доску

```http
PUT /admin/boards/:boardId
```

**Body** (все поля опциональны):
```json
{
  "title": "New Title",
  "description": "Updated description",
  "allowedFileTypes": ["jpg", "png"],
  "maxFileSize": 10485760,
  "bumpLimit": 1000,
  "isActive": false
}
```

**Ответ**:
```json
{
  "id": "uuid",
  "title": "New Title",
  // ... обновленные поля
}
```

#### Удалить доску

```http
DELETE /admin/boards/:boardId
```

**Ответ**:
```json
{
  "message": "Board deleted successfully"
}
```

---

### 🧵 Треды

#### Получить список тредов

```http
GET /admin/threads?page=1&limit=20&search=&sortBy=createdAt&sortOrder=desc
```

**Ответ**:
```json
{
  "threads": [
    {
      "id": "uuid",
      "title": "Thread title",
      "content": "Thread content",
      "boardId": "board-uuid",
      "createdAt": "2025-12-12T10:00:00.000Z",
      "board": {
        "name": "tech",
        "title": "Technology"
      },
      "_count": {
        "replies": 50
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5000,
    "pages": 250
  }
}
```

#### Удалить тред

```http
DELETE /admin/threads/:threadId
```

**Ответ**:
```json
{
  "message": "Thread deleted successfully"
}
```

**Примечание**: Удаляются также все ответы и медиафайлы треда.

---

### 💬 Ответы

#### Получить список ответов

```http
GET /admin/replies?page=1&limit=20&search=&sortBy=createdAt&sortOrder=desc
```

**Ответ**:
```json
{
  "replies": [
    {
      "id": "uuid",
      "content": "Reply content",
      "threadId": "thread-uuid",
      "createdAt": "2025-12-12T10:00:00.000Z",
      "thread": {
        "title": "Thread title",
        "board": {
          "name": "tech"
        }
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 25000,
    "pages": 1250
  }
}
```

#### Удалить ответ

```http
DELETE /admin/replies/:replyId
```

**Ответ**:
```json
{
  "message": "Reply deleted successfully"
}
```

**Примечание**: Удаляются также связанные медиафайлы.

---

### 🖼️ Медиафайлы

#### Получить список медиафайлов

```http
GET /admin/media?page=1&limit=20&search=&sortBy=createdAt&sortOrder=desc
```

**Ответ**:
```json
{
  "mediaFiles": [
    {
      "id": "uuid",
      "url": "https://cloudinary.com/...",
      "publicId": "cloudinary_public_id",
      "type": "image",
      "name": "screenshot.png",
      "size": 524288,
      "threadId": "thread-uuid",
      "replyId": null,
      "createdAt": "2025-12-12T10:00:00.000Z",
      "thread": {
        "title": "Thread title"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 10000,
    "pages": 500
  }
}
```

---

## Коды ошибок

| Код | Описание |
|-----|----------|
| `200` | Успешный запрос |
| `201` | Ресурс создан |
| `400` | Неверные входные данные (валидация не пройдена) |
| `401` | Не авторизован (отсутствует токен) |
| `403` | Доступ запрещен (недостаточно прав, требуется роль ADMIN) |
| `404` | Ресурс не найден |
| `500` | Внутренняя ошибка сервера |

---

## Примеры использования

### cURL

**Получить статистику:**
```bash
curl -X GET \
  http://localhost:3000/admin/stats \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

**Обновить роль пользователя:**
```bash
curl -X PUT \
  http://localhost:3000/admin/users/user-uuid/role \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"role": "admin"}'
```

**Создать доску:**
```bash
curl -X POST \
  http://localhost:3000/admin/boards \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "anime",
    "title": "Anime & Manga",
    "description": "Discussions about anime and manga"
  }'
```

### JavaScript/TypeScript (fetch)

```typescript
const token = 'YOUR_JWT_TOKEN';

// Получить пользователей
const users = await fetch('http://localhost:3000/admin/users?role=admin&page=1', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
}).then(res => res.json());

// Обновить пользователя
const updatedUser = await fetch('http://localhost:3000/admin/users/user-uuid', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    role: 'admin',
    isActive: true
  })
}).then(res => res.json());

// Удалить тред
await fetch('http://localhost:3000/admin/threads/thread-uuid', {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## Заметки по безопасности

1. **Защита на уровне контроллера**: Весь контроллер защищен декоратором `@Authorization(UserRole.ADMIN)`
2. **Валидация DTO**: Все входные данные валидируются через class-validator
3. **Маппинг ролей**: Входные значения `regular`/`admin` автоматически преобразуются в `REGULAR`/`ADMIN` enum
4. **Каскадное удаление**: При удалении пользователя/треда/ответа удаляются связанные данные
5. **Хэширование паролей**: Пароли хэшируются через argon2 перед сохранением

---

## Changelog

### v1.0.0 (2025-12-12)
- ✅ Миграция с Express на NestJS
- ✅ Обновление системы ролей (REGULAR, ADMIN)
- ✅ Полная валидация через DTO
- ✅ Защита через guards и декораторы
- ✅ 15 эндпоинтов для управления системой
- ✅ Интеграция с Prisma ORM
- ✅ Cloudinary для управления медиафайлами
