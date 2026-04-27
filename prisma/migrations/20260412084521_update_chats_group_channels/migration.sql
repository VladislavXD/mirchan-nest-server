-- Minimal migration for chat/group/channel update.
-- Safe to run on partially-applied environments.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ChatType') THEN
    CREATE TYPE "ChatType" AS ENUM ('DIRECT', 'GROUP', 'CHANNEL');
  ELSE
    ALTER TYPE "ChatType" ADD VALUE IF NOT EXISTS 'DIRECT';
    ALTER TYPE "ChatType" ADD VALUE IF NOT EXISTS 'GROUP';
    ALTER TYPE "ChatType" ADD VALUE IF NOT EXISTS 'CHANNEL';
  END IF;
END
$$;

ALTER TABLE "MediaFile" ADD COLUMN IF NOT EXISTS "messageId" TEXT;

ALTER TABLE "Chat" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;
ALTER TABLE "Chat" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "Chat" ADD COLUMN IF NOT EXISTS "isPrivate" BOOLEAN;
ALTER TABLE "Chat" ADD COLUMN IF NOT EXISTS "name" TEXT;
ALTER TABLE "Chat" ADD COLUMN IF NOT EXISTS "type" "ChatType";

ALTER TABLE "Chat" ALTER COLUMN "isPrivate" SET DEFAULT false;
UPDATE "Chat" SET "isPrivate" = false WHERE "isPrivate" IS NULL;
ALTER TABLE "Chat" ALTER COLUMN "isPrivate" SET NOT NULL;

UPDATE "Chat" SET "type" = 'DIRECT' WHERE "type" IS NULL;
ALTER TABLE "Chat" ALTER COLUMN "type" SET NOT NULL;

ALTER TABLE "Chat" DROP COLUMN IF EXISTS "participants";

CREATE TABLE IF NOT EXISTS "_ChatParticipants" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "_ChatAdmins" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "_ChatParticipants_AB_unique" ON "_ChatParticipants"("A", "B");
CREATE INDEX IF NOT EXISTS "_ChatParticipants_B_index" ON "_ChatParticipants"("B");
CREATE UNIQUE INDEX IF NOT EXISTS "_ChatAdmins_AB_unique" ON "_ChatAdmins"("A", "B");
CREATE INDEX IF NOT EXISTS "_ChatAdmins_B_index" ON "_ChatAdmins"("B");
CREATE INDEX IF NOT EXISTS "MediaFile_messageId_idx" ON "MediaFile"("messageId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'MediaFile_messageId_fkey'
  ) THEN
    ALTER TABLE "MediaFile"
      ADD CONSTRAINT "MediaFile_messageId_fkey"
      FOREIGN KEY ("messageId") REFERENCES "Message"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'Message_senderId_fkey'
  ) THEN
    ALTER TABLE "Message"
      ADD CONSTRAINT "Message_senderId_fkey"
      FOREIGN KEY ("senderId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = '_ChatParticipants_A_fkey'
  ) THEN
    ALTER TABLE "_ChatParticipants"
      ADD CONSTRAINT "_ChatParticipants_A_fkey"
      FOREIGN KEY ("A") REFERENCES "Chat"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = '_ChatParticipants_B_fkey'
  ) THEN
    ALTER TABLE "_ChatParticipants"
      ADD CONSTRAINT "_ChatParticipants_B_fkey"
      FOREIGN KEY ("B") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = '_ChatAdmins_A_fkey'
  ) THEN
    ALTER TABLE "_ChatAdmins"
      ADD CONSTRAINT "_ChatAdmins_A_fkey"
      FOREIGN KEY ("A") REFERENCES "Chat"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = '_ChatAdmins_B_fkey'
  ) THEN
    ALTER TABLE "_ChatAdmins"
      ADD CONSTRAINT "_ChatAdmins_B_fkey"
      FOREIGN KEY ("B") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;