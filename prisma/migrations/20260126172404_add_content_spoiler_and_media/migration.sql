-- AlterTable: Add contentSpoiler column and convert content to JSONB
-- Step 1: Add contentSpoiler with default false
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "contentSpoiler" BOOLEAN NOT NULL DEFAULT false;

-- Step 2: Convert content column from TEXT to JSONB safely
-- First, create a temporary JSONB column
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "content_temp" JSONB;

-- Copy existing content as JSON strings (wrap TEXT in quotes to make valid JSON)
UPDATE "Post" SET "content_temp" = to_jsonb("content"::text);

-- Drop old TEXT column and rename temp to content
ALTER TABLE "Post" DROP COLUMN "content";
ALTER TABLE "Post" RENAME COLUMN "content_temp" TO "content";

-- Make content NOT NULL (should already have data from previous UPDATE)
ALTER TABLE "Post" ALTER COLUMN "content" SET NOT NULL;
