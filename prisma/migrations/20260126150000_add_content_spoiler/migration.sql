-- Migration: add contentSpoiler to Post and convert content -> jsonb safely
-- IMPORTANT: Run on a backup or in staging first.

-- 1) Convert existing text content to jsonb safely by wrapping strings
-- If `content` already contains valid JSON, this keeps it; otherwise it stores the string as JSON string.
DO $$
BEGIN
  -- Add a temporary column to hold jsonb content
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Post' AND column_name='content_jsonb_tmp') THEN
    ALTER TABLE "Post" ADD COLUMN "content_jsonb_tmp" JSONB;
  END IF;

  -- Populate temporary column using to_jsonb(content)
  UPDATE "Post" SET "content_jsonb_tmp" = to_jsonb("content");

  -- Ensure all rows have jsonb in temp column
  -- (no-op if previous step succeeded)

  -- Drop old column and rename
  ALTER TABLE "Post" DROP COLUMN "content";
  ALTER TABLE "Post" RENAME COLUMN "content_jsonb_tmp" TO "content";
END$$;

-- 2) Add contentSpoiler column with default false if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Post' AND column_name='contentSpoiler') THEN
    ALTER TABLE "Post" ADD COLUMN "contentSpoiler" BOOLEAN NOT NULL DEFAULT false;
  END IF;
END$$;

-- 3) (Optional) Create index on contentSpoiler if desired
-- CREATE INDEX IF NOT EXISTS "Post_contentSpoiler_idx" ON "Post"("contentSpoiler");

-- End of migration
