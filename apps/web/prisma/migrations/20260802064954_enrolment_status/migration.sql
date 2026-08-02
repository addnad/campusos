-- CreateEnum
CREATE TYPE "EnrolmentStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'DROPPED');

-- AlterTable
ALTER TABLE "Enrolment" ADD COLUMN     "status" "EnrolmentStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX "Enrolment_courseId_status_idx" ON "Enrolment"("courseId", "status");
