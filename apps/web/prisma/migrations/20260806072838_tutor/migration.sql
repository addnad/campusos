-- AlterTable
ALTER TABLE "User" ADD COLUMN     "tutorDailyLimit" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "tutorPaidUntil" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "TutorThread" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TutorThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TutorTurn" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "sources" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TutorTurn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TutorUsage" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TutorUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TutorThread_profileId_updatedAt_idx" ON "TutorThread"("profileId", "updatedAt");

-- CreateIndex
CREATE INDEX "TutorTurn_threadId_createdAt_idx" ON "TutorTurn"("threadId", "createdAt");

-- CreateIndex
CREATE INDEX "TutorUsage_profileId_idx" ON "TutorUsage"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "TutorUsage_profileId_day_key" ON "TutorUsage"("profileId", "day");

-- AddForeignKey
ALTER TABLE "TutorThread" ADD CONSTRAINT "TutorThread_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutorThread" ADD CONSTRAINT "TutorThread_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutorTurn" ADD CONSTRAINT "TutorTurn_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "TutorThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutorUsage" ADD CONSTRAINT "TutorUsage_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
