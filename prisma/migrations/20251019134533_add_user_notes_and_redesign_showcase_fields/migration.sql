/*
  Warnings:

  - You are about to drop the column `cardImage` on the `ImageModel` table. All the data in the column will be lost.
  - You are about to drop the column `showCaseImage` on the `ImageModel` table. All the data in the column will be lost.
  - You are about to drop the column `cardImage` on the `LanguageModel` table. All the data in the column will be lost.
  - You are about to drop the column `showCaseImage` on the `LanguageModel` table. All the data in the column will be lost.
  - You are about to drop the column `referenceImages` on the `VideoModel` table. All the data in the column will be lost.
  - You are about to drop the column `showCaseVideo` on the `VideoModel` table. All the data in the column will be lost.
  - You are about to drop the column `showCaseVideoPoster` on the `VideoModel` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ImageModel" DROP COLUMN "cardImage",
DROP COLUMN "showCaseImage",
ADD COLUMN     "hasShowCaseImage" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "LanguageModel" DROP COLUMN "cardImage",
DROP COLUMN "showCaseImage";

-- AlterTable
ALTER TABLE "VideoModel" DROP COLUMN "referenceImages",
DROP COLUMN "showCaseVideo",
DROP COLUMN "showCaseVideoPoster",
ADD COLUMN     "allowedReferenceImages" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "hasShowCaseVideo" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "userNotes" TEXT;
