/*
  Warnings:

  - You are about to drop the `ImageJob` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VideoJob` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "GenKind" AS ENUM ('IMAGE', 'VIDEO');

-- DropForeignKey
ALTER TABLE "public"."ImageJob" DROP CONSTRAINT "ImageJob_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."VideoJob" DROP CONSTRAINT "VideoJob_userId_fkey";

-- DropTable
DROP TABLE "public"."ImageJob";

-- DropTable
DROP TABLE "public"."VideoJob";

-- CreateTable
CREATE TABLE "GenJob" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "kind" "GenKind" NOT NULL,
    "model" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "status" "JobStatus" NOT NULL DEFAULT 'QUEUED',
    "replicateId" TEXT,
    "replicateGetUrl" TEXT,
    "replicateCancelUrl" TEXT,
    "replicateWebUrl" TEXT,
    "resultUrl" TEXT,
    "cost" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GenJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GenJob_userId_createdAt_idx" ON "GenJob"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "GenJob" ADD CONSTRAINT "GenJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
