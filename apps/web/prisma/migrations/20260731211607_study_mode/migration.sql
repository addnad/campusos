/*
  Warnings:

  - A unique constraint covering the columns `[institutionId,name,award,studyMode]` on the table `Programme` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "StudyMode" AS ENUM ('FULL_TIME', 'PART_TIME', 'SANDWICH', 'DISTANCE');

-- DropIndex
DROP INDEX "Programme_institutionId_name_award_key";

-- AlterTable
ALTER TABLE "Programme" ADD COLUMN     "studyMode" "StudyMode" NOT NULL DEFAULT 'FULL_TIME';

-- CreateIndex
CREATE UNIQUE INDEX "Programme_institutionId_name_award_studyMode_key" ON "Programme"("institutionId", "name", "award", "studyMode");
