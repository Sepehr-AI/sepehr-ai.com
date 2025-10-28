-- CreateEnum
CREATE TYPE "ErrorType" AS ENUM ('INFO', 'WARN', 'ERROR');

-- CreateEnum
CREATE TYPE "ImageInput" AS ENUM ('UNAVAILABLE', 'SINGLE', 'MULTI');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('QUEUED', 'PROCESSING', 'SUCCEEDED', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT,
    "name" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "referralCode" TEXT,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "referralBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" SERIAL NOT NULL,
    "amount" INTEGER NOT NULL,
    "exchangeRate" INTEGER,
    "creditsTransferred" BOOLEAN NOT NULL DEFAULT false,
    "respCode" INTEGER,
    "traceNumber" INTEGER,
    "rrn" TEXT,
    "digitalReceipt" TEXT,
    "cardNumber" TEXT,
    "status" TEXT,
    "message" TEXT,
    "returnId" TEXT,
    "userId" INTEGER NOT NULL,
    "usdCredits" INTEGER NOT NULL,
    "usdPrice" DOUBLE PRECISION NOT NULL,
    "discountPercentage" INTEGER,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebPlan" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "usdPrice" DOUBLE PRECISION NOT NULL,
    "usdCredits" INTEGER NOT NULL,
    "discountPercentage" INTEGER,
    "discountEndsOn" TIMESTAMPTZ(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Otp" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Otp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Faq" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Faq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Error" (
    "id" SERIAL NOT NULL,
    "data" JSONB NOT NULL,
    "context" TEXT NOT NULL,
    "type" "ErrorType" NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Error_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LanguageModel" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "cardImage" TEXT NOT NULL,
    "milInCost" DOUBLE PRECISION NOT NULL,
    "milOutCost" DOUBLE PRECISION NOT NULL,
    "imageInput" "ImageInput" NOT NULL,
    "supportsMessages" BOOLEAN NOT NULL,
    "defaultOptions" JSONB,
    "minCompletionTokens" INTEGER,
    "maxCompletionTokens" INTEGER,
    "defMaxCompletionTokens" INTEGER,
    "showCaseImage" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LanguageModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImageModel" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "defaultOptions" JSONB,
    "shortDescription" TEXT NOT NULL,
    "cardImage" TEXT NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "imageInput" "ImageInput" NOT NULL,
    "showCaseImage" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImageModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoModel" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "defaultOptions" JSONB,
    "cost" DOUBLE PRECISION NOT NULL,
    "durations" INTEGER[],
    "image" BOOLEAN NOT NULL DEFAULT false,
    "startImage" BOOLEAN NOT NULL DEFAULT false,
    "firstFrameImage" BOOLEAN NOT NULL DEFAULT false,
    "lastFrameImage" BOOLEAN NOT NULL DEFAULT false,
    "referenceImages" BOOLEAN NOT NULL DEFAULT false,
    "endImage" BOOLEAN NOT NULL DEFAULT false,
    "audio" BOOLEAN NOT NULL DEFAULT false,
    "showCaseVideo" TEXT,
    "showCaseVideoPoster" TEXT NOT NULL,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImageJob" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "prompt" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "status" "JobStatus" NOT NULL DEFAULT 'QUEUED',
    "replicateId" TEXT,
    "replicateGetUrl" TEXT,
    "replicateCancelUrl" TEXT,
    "replicateWebUrl" TEXT,
    "imageUrl" TEXT,
    "cost" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImageJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoJob" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "prompt" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "lengthSec" INTEGER,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "status" "JobStatus" NOT NULL DEFAULT 'QUEUED',
    "replicateId" TEXT,
    "replicateGetUrl" TEXT,
    "replicateCancelUrl" TEXT,
    "replicateWebUrl" TEXT,
    "videoUrl" TEXT,
    "cost" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LanguageJob" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "cost" DOUBLE PRECISION,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LanguageJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_mobile_key" ON "User"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "Otp_userId_key" ON "Otp"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LanguageModel_code_key" ON "LanguageModel"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ImageModel_code_key" ON "ImageModel"("code");

-- CreateIndex
CREATE UNIQUE INDEX "VideoModel_code_key" ON "VideoModel"("code");

-- CreateIndex
CREATE INDEX "ImageJob_userId_createdAt_idx" ON "ImageJob"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "VideoJob_userId_createdAt_idx" ON "VideoJob"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "LanguageJob_userId_createdAt_idx" ON "LanguageJob"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Otp" ADD CONSTRAINT "Otp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImageJob" ADD CONSTRAINT "ImageJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoJob" ADD CONSTRAINT "VideoJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LanguageJob" ADD CONSTRAINT "LanguageJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
