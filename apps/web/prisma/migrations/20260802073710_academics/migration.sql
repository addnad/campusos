-- CreateEnum
CREATE TYPE "TaskState" AS ENUM ('PENDING', 'DONE', 'DISMISSED');

-- CreateEnum
CREATE TYPE "AssessmentKind" AS ENUM ('ASSIGNMENT', 'TEST', 'EXAM', 'PRESENTATION', 'PROJECT');

-- CreateTable
CREATE TABLE "ClassSession" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startsAt" INTEGER NOT NULL,
    "endsAt" INTEGER NOT NULL,
    "venue" TEXT,
    "lecturer" TEXT,
    "confidence" "Confidence" NOT NULL DEFAULT 'STUDENT_SUPPLIED',
    "addedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "kind" "AssessmentKind" NOT NULL DEFAULT 'ASSIGNMENT',
    "title" TEXT NOT NULL,
    "details" TEXT,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "venue" TEXT,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "addedBy" TEXT,
    "confidence" "Confidence" NOT NULL DEFAULT 'STUDENT_SUPPLIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "state" "TaskState" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClassSession_courseId_weekday_idx" ON "ClassSession"("courseId", "weekday");

-- CreateIndex
CREATE INDEX "Assessment_courseId_dueAt_idx" ON "Assessment"("courseId", "dueAt");

-- CreateIndex
CREATE INDEX "Task_profileId_state_idx" ON "Task"("profileId", "state");

-- CreateIndex
CREATE UNIQUE INDEX "Task_profileId_assessmentId_key" ON "Task"("profileId", "assessmentId");

-- AddForeignKey
ALTER TABLE "ClassSession" ADD CONSTRAINT "ClassSession_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
