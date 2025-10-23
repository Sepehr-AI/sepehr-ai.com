/*
  Warnings:

  - You are about to drop the column `cost` on the `ImageModel` table. All the data in the column will be lost.
  - You are about to drop the column `imageInput` on the `ImageModel` table. All the data in the column will be lost.
  - You are about to drop the column `ratios` on the `ImageModel` table. All the data in the column will be lost.
  - You are about to drop the column `allowedReferenceImages` on the `VideoModel` table. All the data in the column will be lost.
  - You are about to drop the column `audio` on the `VideoModel` table. All the data in the column will be lost.
  - You are about to drop the column `cost` on the `VideoModel` table. All the data in the column will be lost.
  - You are about to drop the column `durations` on the `VideoModel` table. All the data in the column will be lost.
  - You are about to drop the column `endImage` on the `VideoModel` table. All the data in the column will be lost.
  - You are about to drop the column `firstFrameImage` on the `VideoModel` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `VideoModel` table. All the data in the column will be lost.
  - You are about to drop the column `lastFrameImage` on the `VideoModel` table. All the data in the column will be lost.
  - You are about to drop the column `ratios` on the `VideoModel` table. All the data in the column will be lost.
  - You are about to drop the column `startImage` on the `VideoModel` table. All the data in the column will be lost.
  - You are about to drop the column `userNotes` on the `VideoModel` table. All the data in the column will be lost.
  - Added the required column `costPerImage` to the `ImageModel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `inputSchema` to the `ImageModel` table without a default value. This is not possible if the table is not empty.
  - Made the column `defaultOptions` on table `ImageModel` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `costPerSecond` to the `VideoModel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `inputSchema` to the `VideoModel` table without a default value. This is not possible if the table is not empty.
  - Made the column `defaultOptions` on table `VideoModel` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ImageModel" DROP COLUMN "cost",
DROP COLUMN "imageInput",
DROP COLUMN "ratios",
ADD COLUMN     "costPerImage" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "inputSchema" JSONB NOT NULL,
ALTER COLUMN "defaultOptions" SET NOT NULL;

-- AlterTable
ALTER TABLE "VideoModel" DROP COLUMN "allowedReferenceImages",
DROP COLUMN "audio",
DROP COLUMN "cost",
DROP COLUMN "durations",
DROP COLUMN "endImage",
DROP COLUMN "firstFrameImage",
DROP COLUMN "image",
DROP COLUMN "lastFrameImage",
DROP COLUMN "ratios",
DROP COLUMN "startImage",
DROP COLUMN "userNotes",
ADD COLUMN     "costPerSecond" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "inputSchema" JSONB NOT NULL,
ALTER COLUMN "defaultOptions" SET NOT NULL;
