/*
  Warnings:

  - You are about to drop the column `thumbnailUrl` on the `MediaFile` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `Post` table. All the data in the column will be lost.
  - Changed the type of `type` on the `MediaFile` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `updatedAt` to the `Post` table without a default value. This is not possible if the table is not empty.
  - Made the column `content` on table `Post` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'GIF');

-- AlterTable
ALTER TABLE "MediaFile" DROP COLUMN "thumbnailUrl",
ADD COLUMN     "nsfw" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "postId" TEXT,
ADD COLUMN     "previewUrl" TEXT,
ADD COLUMN     "spoiler" BOOLEAN NOT NULL DEFAULT false,
DROP COLUMN "type",
ADD COLUMN     "type" "MediaType" NOT NULL;

-- AlterTable
ALTER TABLE "Post" DROP COLUMN "imageUrl",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "emojiUrls" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "content" SET NOT NULL;

-- CreateIndex
CREATE INDEX "MediaFile_postId_idx" ON "MediaFile"("postId");

-- CreateIndex
CREATE INDEX "MediaFile_type_idx" ON "MediaFile"("type");

-- AddForeignKey
ALTER TABLE "MediaFile" ADD CONSTRAINT "MediaFile_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
