# Admin Roles Update - December 12, 2025

## Изменения в системе ролей

### До изменений
Система поддерживала три роли:
- `user` / `USER`
- `moderator` / `MODERATOR`
- `admin` / `ADMIN`

### После изменений
Система поддерживает только две роли:
- `regular` / `REGULAR` (обычный пользователь)
- `admin` / `ADMIN` (администратор)

## Обновленные файлы

### 1. Prisma Schema (`prisma/schema.prisma`)
```prisma
enum UserRole {
  REGULAR
  ADMIN
}

model User {
  role UserRole @default(REGULAR)
  // ...
}
```

### 2. Admin DTOs (`src/admin/dto/admin.dto.ts`)

**UpdateUserRoleDto:**
```typescript
export class UpdateUserRoleDto {
  @IsString()
  role!: 'regular' | 'admin';
}
```

**UpdateUserDto:**
```typescript
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  role?: 'regular' | 'admin';
  // ...
}
```

**GetUsersQueryDto:**
```typescript
export class GetUsersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  role?: 'regular' | 'admin';
}
```

### 3. Admin Service (`src/admin/admin.service.ts`)

**Маппинг ролей:**
Входящие значения в нижнем регистре (`regular`, `admin`) автоматически преобразуются в значения enum Prisma (`REGULAR`, `ADMIN`).

**getStats():**
- Удален подсчет модераторов
- Статистика теперь включает только admins

**getUsers():**
```typescript
// Автоматический маппинг фильтра ролей
if (role) {
  const roleMap: Record<string, string> = { 
    regular: 'REGULAR', 
    admin: 'ADMIN' 
  };
  where.role = roleMap[role] || role.toUpperCase();
}
```

**updateUserRole():**
```typescript
const roleMap = {
  regular: 'REGULAR',
  admin: 'ADMIN',
} as const;

if (!(dto.role in roleMap)) {
  throw new Error('Invalid role. Allowed: regular, admin');
}

return this.prisma.user.update({
  where: { id: userId },
  data: { role: roleMap[dto.role] },
  // ...
});
```

**updateUser():**
```typescript
if (dto.role !== undefined) {
  const roleMap: Record<string, string> = { 
    regular: 'REGULAR', 
    admin: 'ADMIN' 
  };
  const mappedRole = roleMap[dto.role.toLowerCase()];
  if (!mappedRole) {
    throw new Error('Invalid role. Allowed: regular, admin');
  }
  updateData.role = mappedRole;
}
```

## API Contracts

### Входящие данные (API requests)
Клиент отправляет роли в **нижнем регистре**:
- `regular`
- `admin`

### Исходящие данные (API responses)
Сервер возвращает роли в **верхнем регистре** (как в БД):
- `REGULAR`
- `ADMIN`

### Примеры использования

**Обновление роли пользователя:**
```typescript
// Request
PUT /admin/users/:id/role
{
  "role": "admin"
}

// Response
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "ADMIN",
  "isActive": true
}
```

**Фильтрация пользователей по роли:**
```typescript
// Request
GET /admin/users?role=regular&page=1&limit=20

// Response
{
  "users": [...],
  "pagination": {...}
}
```

## Миграция данных

### Если в продакшене есть пользователи с ролью MODERATOR:

1. **Перед миграцией схемы:**
```sql
-- Преобразовать всех модераторов в админов или обычных пользователей
UPDATE users 
SET role = 'ADMIN' 
WHERE role = 'MODERATOR';

-- Или в обычных пользователей:
UPDATE users 
SET role = 'REGULAR' 
WHERE role = 'MODERATOR';
```

2. **После этого можно применять новую схему:**
```bash
npx prisma migrate dev --name remove_moderator_role
```

## Валидация

- Входные значения валидируются на уровне DTO
- Маппинг происходит в сервисах перед записью в БД
- Некорректные роли выбрасывают исключение с понятным сообщением

## Обратная совместимость

⚠️ **BREAKING CHANGE**: Роль `moderator` больше не поддерживается.

Клиентские приложения должны быть обновлены для работы только с двумя ролями:
- `regular` (обычный пользователь)
- `admin` (администратор)
