# Chat Migration - Express.js → NestJS

## ✅ Completed Migration

Миграция чатов из Express.js в NestJS успешно завершена.

## 📂 Structure

```
nestjs-server/src/chat/
├── dto/
│   └── chat.dto.ts         # DTOs для параметров запросов
├── chat.service.ts          # Бизнес-логика чатов
├── chat.controller.ts       # REST API endpoints
└── chat.module.ts           # Модуль с зависимостями
```

## 🔌 API Endpoints

### 1. GET /chats
Получить список всех чатов пользователя

**Auth**: Required  
**Response**: Array<Chat>

```json
[
  {
    "id": "chat-id",
    "participants": ["user-id-1", "user-id-2"],
    "lastMessageAt": "2024-12-08T...",
    "messages": [...],
    "otherParticipant": {
      "id": "user-id",
      "name": "John Doe",
      "avatarUrl": "...",
      "bio": "..."
    },
    "unreadCount": 3,
    "isOnline": true
  }
]
```

### 2. GET /chats/:otherUserId
Получить или создать чат с пользователем

**Auth**: Required  
**Params**: `otherUserId` - ID собеседника  
**Response**: Chat with messages

```json
{
  "id": "chat-id",
  "participants": ["user-id-1", "user-id-2"],
  "messages": [
    {
      "id": "message-id",
      "content": "Hello!",
      "senderId": "user-id",
      "sender": {
        "id": "user-id",
        "name": "John",
        "avatarUrl": "..."
      },
      "isRead": false,
      "createdAt": "2024-12-08T..."
    }
  ],
  "otherParticipant": {...},
  "unreadCount": 0,
  "isOnline": true
}
```

### 3. GET /chats/:chatId/messages
Получить сообщения чата с пагинацией

**Auth**: Required  
**Params**: `chatId`  
**Query**: `page` (default: 1), `limit` (default: 50)  
**Response**: Paginated messages

```json
{
  "messages": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "hasMore": true
  }
}
```

### 4. PUT /chats/:chatId/read
Отметить сообщения как прочитанные

**Auth**: Required  
**Params**: `chatId`  
**Response**: Update result

```json
{
  "message": "Сообщения отмечены как прочитанные",
  "count": 5
}
```

### 5. DELETE /chats/:chatId
Удалить чат

**Auth**: Required  
**Params**: `chatId`  
**Response**: Confirmation

```json
{
  "message": "Чат успешно удален"
}
```

## 🔧 Features

### ✅ Implemented

1. **Authorization**: Все endpoints требуют авторизации через `@Authorization()` decorator
2. **Socket Service Integration**: Получение статусов онлайн через HTTP запросы
3. **Auto-create chats**: Создание чата при первом сообщении
4. **Unread count**: Подсчет непрочитанных сообщений
5. **Pagination**: Пагинация для старых сообщений
6. **Message sender info**: Информация об отправителях в каждом сообщении
7. **Validation**: DTO валидация для query параметров
8. **Error handling**: Правильная обработка ошибок (NotFoundException, BadRequestException)
9. **Cascade delete**: Автоматическое удаление сообщений при удалении чата

### 📝 Key Differences from Express

**Express.js**:
```javascript
router.get('/chats', authenticateToken, ChatController.getUserChats)
```

**NestJS**:
```typescript
@Authorization()
@HttpCode(HttpStatus.OK)
@Get()
async getUserChats(@Authorized('id') userId: string) {
  return this.chatService.getUserChats(userId);
}
```

## 🔗 Dependencies

```typescript
// chat.module.ts
@Module({
  imports: [
    PrismaModule,      // Database access
    AuthModule,        // Authentication
    UserModule,        // User service
    ConfigModule       // Environment variables
  ],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService]
})
```

## 🌐 Socket Service Integration

Чаты интегрированы с Socket Service для получения статусов онлайн:

```typescript
// Получение статуса одного пользователя
GET ${SOCKET_SERVICE_URL}/api/users/:userId/online
→ { "isOnline": true }

// Получение статусов нескольких пользователей
POST ${SOCKET_SERVICE_URL}/api/users/online-status
Body: { "userIds": ["id1", "id2"] }
→ { "id1": true, "id2": false }
```

**Fallback**: Если Socket Service недоступен, `isOnline` будет `false`, но запрос не упадет.

## 🧪 Testing

```bash
# Запустить NestJS сервер
cd nestjs-server
yarn start:dev

# Проверить endpoints
GET http://localhost:4000/chats
GET http://localhost:4000/chats/:otherUserId
GET http://localhost:4000/chats/:chatId/messages?page=1&limit=50
PUT http://localhost:4000/chats/:chatId/read
DELETE http://localhost:4000/chats/:chatId
```

## 🔐 Security

1. **Authentication**: Все endpoints защищены `@Authorization()` decorator
2. **Access Control**: Пользователь может работать только со своими чатами
3. **Input Validation**: Query параметры валидируются через DTOs
4. **User Verification**: Проверка существования собеседника перед созданием чата
5. **Self-chat Prevention**: Нельзя создать чат с самим собой

## 📊 Database Schema

```prisma
model Chat {
  id            String    @id @default(auto()) @map("_id") @db.ObjectId
  participants  String[]  @db.ObjectId
  lastMessageAt DateTime  @default(now())
  createdAt     DateTime  @default(now())
  messages      Message[]
}

model Message {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  chatId    String   @db.ObjectId
  chat      Chat     @relation(fields: [chatId], references: [id], onDelete: Cascade)
  senderId  String   @db.ObjectId
  content   String
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

## 🚀 Next Steps

1. ✅ Migrate chats to NestJS
2. ⏳ Update frontend to use new NestJS endpoints
3. ⏳ Test real-time messaging with Socket Service
4. ⏳ Add file upload support for chat messages
5. ⏳ Add typing indicators
6. ⏳ Add message reactions

## 📚 Related Documentation

- `express-api/controllers/chat_controller.js` - Original Express implementation
- `express-api/routes/index.js` - Express routes
- `CHAT_TESTING.md` - Testing procedures
- `SOCKET_MIGRATION_COMPLETE.md` - Socket.IO migration guide
