-- CreateEnum
CREATE TYPE "AnswerType" AS ENUM ('behavioural', 'technical');

-- CreateTable
CREATE TABLE "PrepSession" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jobDescription" TEXT NOT NULL,
    "roleTitle" TEXT NOT NULL,

    CONSTRAINT "PrepSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "type" "AnswerType" NOT NULL,
    "modelAnswer" TEXT NOT NULL,
    "keyPoints" TEXT[],
    "sessionId" TEXT NOT NULL,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "PrepSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
