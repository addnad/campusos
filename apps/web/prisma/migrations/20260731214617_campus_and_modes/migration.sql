/*
  Warnings:

  - The values [PART_TIME] on the enum `StudyMode` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[campusId,normalisedCode]` on the table `Course` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[campusId,name,award,studyMode]` on the table `Programme` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `campusId` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `campusId` to the `Programme` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "StudyMode_new" AS ENUM ('FULL_TIME', 'PART_TIME_WEEKDAY', 'PART_TIME_WEEKEND', 'SANDWICH', 'DISTANCE');
ALTER TABLE "public"."Programme" ALTER COLUMN "studyMode" DROP DEFAULT;
ALTER TABLE "Programme" ALTER COLUMN "studyMode" TYPE "StudyMode_new" USING ("studyMode"::text::"StudyMode_new");
ALTER TYPE "StudyMode" RENAME TO "StudyMode_old";
ALTER TYPE "StudyMode_new" RENAME TO "StudyMode";
DROP TYPE "public"."StudyMode_old";
ALTER TABLE "Programme" ALTER COLUMN "studyMode" SET DEFAULT 'FULL_TIME';
COMMIT;

-- DropIndex
DROP INDEX "Course_institutionId_normalisedCode_key";

-- DropIndex
DROP INDEX "Programme_institutionId_name_award_studyMode_key";

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "campusId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Programme" ADD COLUMN     "campusId" TEXT NOT NULL,
ADD COLUMN     "years" INTEGER NOT NULL DEFAULT 2;

-- CreateTable
CREATE TABLE "Campus" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Campus_institutionId_name_key" ON "Campus"("institutionId", "name");

-- CreateIndex
CREATE INDEX "Course_institutionId_idx" ON "Course"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "Course_campusId_normalisedCode_key" ON "Course"("campusId", "normalisedCode");

-- CreateIndex
CREATE INDEX "Programme_institutionId_idx" ON "Programme"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "Programme_campusId_name_award_studyMode_key" ON "Programme"("campusId", "name", "award", "studyMode");

-- AddForeignKey
ALTER TABLE "Campus" ADD CONSTRAINT "Campus_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Programme" ADD CONSTRAINT "Programme_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE CASCADE ON UPDATE CASCADE;
