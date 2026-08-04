/*
  Warnings:

  - A unique constraint covering the columns `[profileId,courseId,session,semester]` on the table `Enrolment` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Enrolment_profileId_courseId_level_semester_key";

-- AlterTable
ALTER TABLE "Enrolment" ADD COLUMN     "session" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "Enrolment_profileId_courseId_session_semester_key" ON "Enrolment"("profileId", "courseId", "session", "semester");
