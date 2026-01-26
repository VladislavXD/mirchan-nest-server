-- ============================================
-- БЕЗОПАСНАЯ МИГРАЦИЯ ДЛЯ ПРОДАКШЕНА
-- Применять вручную через Render Shell или psql
-- ============================================

-- 1. Добавить contentSpoiler если его нет
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Post' AND column_name = 'contentSpoiler'
  ) THEN
    ALTER TABLE "Post" ADD COLUMN "contentSpoiler" BOOLEAN NOT NULL DEFAULT false;
    RAISE NOTICE 'Added contentSpoiler column';
  ELSE
    RAISE NOTICE 'contentSpoiler already exists';
  END IF;
END$$;

-- 2. Добавить updatedAt если его нет
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Post' AND column_name = 'updatedAt'
  ) THEN
    ALTER TABLE "Post" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    RAISE NOTICE 'Added updatedAt column';
  ELSE
    RAISE NOTICE 'updatedAt already exists';
  END IF;
END$$;

-- 3. Конвертировать content из TEXT в JSONB (если ещё TEXT)
DO $$
BEGIN
  -- Проверяем тип колонки content
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Post' 
    AND column_name = 'content' 
    AND data_type = 'text'
  ) THEN
    -- Создаём временную колонку JSONB
    ALTER TABLE "Post" ADD COLUMN "content_jsonb" JSONB;
    
    -- Копируем данные, оборачивая текст в JSON строку
    UPDATE "Post" SET "content_jsonb" = to_jsonb("content"::text);
    
    -- Удаляем старую TEXT колонку
    ALTER TABLE "Post" DROP COLUMN "content";
    
    -- Переименовываем временную в content
    ALTER TABLE "Post" RENAME COLUMN "content_jsonb" TO "content";
    
    -- Делаем NOT NULL
    ALTER TABLE "Post" ALTER COLUMN "content" SET NOT NULL;
    
    RAISE NOTICE 'Converted content from TEXT to JSONB';
  ELSE
    RAISE NOTICE 'content is already JSONB or not TEXT';
  END IF;
END$$;

-- 4. Добавить связь MediaFile -> Post если её нет
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'MediaFile' AND column_name = 'postId'
  ) THEN
    ALTER TABLE "MediaFile" ADD COLUMN "postId" TEXT;
    CREATE INDEX IF NOT EXISTS "MediaFile_postId_idx" ON "MediaFile"("postId");
    
    -- Добавить foreign key
    ALTER TABLE "MediaFile" ADD CONSTRAINT "MediaFile_postId_fkey" 
      FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    
    RAISE NOTICE 'Added postId to MediaFile';
  ELSE
    RAISE NOTICE 'postId already exists in MediaFile';
  END IF;
END$$;

-- 5. Добавить MediaType ENUM если его нет
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MediaType') THEN
    CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'GIF');
    RAISE NOTICE 'Created MediaType enum';
  ELSE
    RAISE NOTICE 'MediaType enum already exists';
  END IF;
END$$;

-- 6. Конвертировать MediaFile.type из TEXT в ENUM
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'MediaFile' 
    AND column_name = 'type' 
    AND data_type = 'text'
  ) THEN
    -- Добавить временную колонку с ENUM
    ALTER TABLE "MediaFile" ADD COLUMN "type_enum" "MediaType";
    
    -- Копировать данные с приведением типа
    UPDATE "MediaFile" SET "type_enum" = 
      CASE 
        WHEN UPPER("type") = 'IMAGE' THEN 'IMAGE'::"MediaType"
        WHEN UPPER("type") = 'VIDEO' THEN 'VIDEO'::"MediaType"
        WHEN UPPER("type") = 'GIF' THEN 'GIF'::"MediaType"
        ELSE 'IMAGE'::"MediaType" -- default fallback
      END;
    
    -- Удалить старую TEXT колонку
    ALTER TABLE "MediaFile" DROP COLUMN "type";
    
    -- Переименовать временную
    ALTER TABLE "MediaFile" RENAME COLUMN "type_enum" TO "type";
    
    -- Сделать NOT NULL
    ALTER TABLE "MediaFile" ALTER COLUMN "type" SET NOT NULL;
    
    RAISE NOTICE 'Converted MediaFile.type from TEXT to ENUM';
  ELSE
    RAISE NOTICE 'MediaFile.type is already ENUM';
  END IF;
END$$;

-- 7. Добавить новые поля в MediaFile если их нет
DO $$
BEGIN
  -- previewUrl
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'MediaFile' AND column_name = 'previewUrl'
  ) THEN
    ALTER TABLE "MediaFile" ADD COLUMN "previewUrl" TEXT;
    RAISE NOTICE 'Added previewUrl to MediaFile';
  END IF;
  
  -- spoiler
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'MediaFile' AND column_name = 'spoiler'
  ) THEN
    ALTER TABLE "MediaFile" ADD COLUMN "spoiler" BOOLEAN NOT NULL DEFAULT false;
    RAISE NOTICE 'Added spoiler to MediaFile';
  END IF;
  
  -- nsfw
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'MediaFile' AND column_name = 'nsfw'
  ) THEN
    ALTER TABLE "MediaFile" ADD COLUMN "nsfw" BOOLEAN NOT NULL DEFAULT false;
    RAISE NOTICE 'Added nsfw to MediaFile';
  END IF;
END$$;

-- 8. Создать индекс на MediaFile.type если его нет
CREATE INDEX IF NOT EXISTS "MediaFile_type_idx" ON "MediaFile"("type");

-- ============================================
-- ПРОВЕРКА РЕЗУЛЬТАТА
-- ============================================
SELECT 'Checking Post columns...' as status;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'Post' 
ORDER BY ordinal_position;

SELECT 'Checking MediaFile columns...' as status;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'MediaFile' 
ORDER BY ordinal_position;

SELECT '✅ Migration completed successfully!' as status;
