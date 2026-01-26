# 🚀 Инструкция по применению миграции на продакшене

## Проблема
На продакшене отсутствуют поля:
- `Post.contentSpoiler` (Boolean)
- `Post.updatedAt` (DateTime)
- `Post.content` (должен быть JSONB, а не TEXT)
- `MediaFile.postId` (для связи с постами)
- И другие поля согласно новой схеме

## ✅ Решение: Ручное применение SQL

### Шаг 1: Подключись к Render Shell

1. Зайди на [Render Dashboard](https://dashboard.render.com/)
2. Выбери свой NestJS сервис
3. Нажми **Shell** (справа вверху)

### Шаг 2: Скопируй SQL скрипт

Открой файл `manual-migration-prod.sql` и скопируй **весь** его содержимый.

### Шаг 3: Примени миграцию

В Render Shell выполни:

```bash
# Подключись к PostgreSQL
psql $DATABASE_URL

# Вставь SQL скрипт (Ctrl+Shift+V или правой кнопкой)
# Скрипт автоматически применит все изменения
```

Альтернативно, через одну команду:

```bash
psql $DATABASE_URL < manual-migration-prod.sql
```

Или прямо в Shell Render:

```bash
cat << 'EOF' | psql $DATABASE_URL
-- Вставь сюда содержимое manual-migration-prod.sql
EOF
```

### Шаг 4: Проверь результат

SQL скрипт автоматически выведет:
- Список колонок таблицы `Post`
- Список колонок таблицы `MediaFile`
- Сообщение об успешном завершении

Убедись что видишь:
- ✅ `Post.contentSpoiler` (boolean)
- ✅ `Post.content` (jsonb)
- ✅ `Post.updatedAt` (timestamp)
- ✅ `MediaFile.postId` (text)
- ✅ `MediaFile.type` (MediaType enum)

### Шаг 5: Пометь миграции как применённые

После успешного применения SQL, помечаем миграции:

```bash
# В Render Shell или локально подключившись к прод БД
npx prisma migrate resolve --applied 20260126150000_add_content_spoiler
npx prisma migrate resolve --applied 20260126172023_fix_post
npx prisma migrate resolve --applied 20260126172404_add_content_spoiler_and_media
```

Это запишет в таблицу `_prisma_migrations` что миграции применены.

### Шаг 6: Перезапусти сервер

В Render Dashboard:
- Нажми **Manual Deploy** → **Deploy latest commit**

Или в Shell:
```bash
# Если есть PM2
pm2 restart all
```

### Шаг 7: Проверь API

```bash
curl https://mirchan-expres-api.onrender.com/posts
```

Должны вернуться посты без ошибки `Post.contentSpoiler does not exist`.

---

## 🔧 Что делает SQL скрипт

1. ✅ Добавляет `contentSpoiler` (если нет)
2. ✅ Добавляет `updatedAt` (если нет)
3. ✅ Конвертирует `content: TEXT → JSONB` безопасно
4. ✅ Добавляет `MediaFile.postId` + foreign key
5. ✅ Создаёт `MediaType` ENUM
6. ✅ Конвертирует `MediaFile.type: TEXT → ENUM`
7. ✅ Добавляет `previewUrl`, `spoiler`, `nsfw` в MediaFile
8. ✅ Создаёт индексы

**Скрипт идемпотентный** - можно запускать несколько раз, он не сломает существующие данные!

---

## ⚠️ Если что-то пошло не так

### Ошибка: "column already exists"
Это ОК! Скрипт пропустит существующие колонки.

### Ошибка: "type already exists"
Это ОК! Скрипт пропустит существующий ENUM.

### Ошибка при конвертации TEXT → JSONB
Проверь что в `Post.content` нет некорректных данных:

```sql
-- Найди проблемные записи
SELECT id, content FROM "Post" 
WHERE length(content) > 0 
LIMIT 10;
```

Если есть - удали или исправь вручную перед миграцией.

---

## 📊 Бэкап (опционально)

Перед применением можно сделать бэкап:

```bash
# В Render Shell
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

Но скрипт безопасен и не удаляет данные!

---

## ✅ Финальная проверка

После всего убедись:

```bash
# Проверь схему
psql $DATABASE_URL -c "\d \"Post\""
psql $DATABASE_URL -c "\d \"MediaFile\""

# Проверь миграции
npx prisma migrate status
```

Должно быть: **"Database schema is up to date!"**

---

**Автор:** AI Assistant  
**Дата:** 26 января 2026  
**Версия:** 2.1.0
