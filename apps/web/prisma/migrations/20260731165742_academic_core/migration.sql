/*
  Warnings:

  - You are about to drop the `CurriculumCourse` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `kind` on the `Institution` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Confidence" AS ENUM ('STUDENT_SUPPLIED', 'CORROBORATED', 'VERIFIED');

-- CreateEnum
CREATE TYPE "InstitutionKind" AS ENUM ('UNIVERSITY', 'POLYTECHNIC', 'COLLEGE_OF_EDUCATION', 'OTHER');

-- DropForeignKey
ALTER TABLE "CurriculumCourse" DROP CONSTRAINT "CurriculumCourse_curriculumId_fkey";

-- DropForeignKey
ALTER TABLE "CurriculumCourse" DROP CONSTRAINT "CurriculumCourse_subjectId_fkey";

-- AlterTable
ALTER TABLE "Curriculum" ALTER COLUMN "intakeYear" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Institution" ADD COLUMN     "state" TEXT,
DROP COLUMN "kind",
ADD COLUMN     "kind" "InstitutionKind" NOT NULL;

-- DropTable
DROP TABLE "CurriculumCourse";

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "normalisedCode" TEXT NOT NULL,
    "displayCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subjectId" TEXT,
    "confidence" "Confidence" NOT NULL DEFAULT 'STUDENT_SUPPLIED',
    "mergedIntoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurriculumEntry" (
    "id" TEXT NOT NULL,
    "curriculumId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "units" INTEGER NOT NULL,
    "compulsory" BOOLEAN NOT NULL DEFAULT true,
    "excluded" BOOLEAN NOT NULL DEFAULT false,
    "confidence" "Confidence" NOT NULL DEFAULT 'STUDENT_SUPPLIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CurriculumEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "programmeId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "semester" INTEGER NOT NULL,
    "matricNumber" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrolment" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "semester" INTEGER NOT NULL,
    "units" INTEGER NOT NULL,
    "colourToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Enrolment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Course_subjectId_idx" ON "Course"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "Course_institutionId_normalisedCode_key" ON "Course"("institutionId", "normalisedCode");

-- CreateIndex
CREATE UNIQUE INDEX "CurriculumEntry_curriculumId_courseId_key" ON "CurriculumEntry"("curriculumId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "StudentProfile_userId_idx" ON "StudentProfile"("userId");

-- CreateIndex
CREATE INDEX "Enrolment_courseId_idx" ON "Enrolment"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "Enrolment_profileId_courseId_level_semester_key" ON "Enrolment"("profileId", "courseId", "level", "semester");

-- CreateIndex
CREATE INDEX "Institution_kind_idx" ON "Institution"("kind");

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_mergedIntoId_fkey" FOREIGN KEY ("mergedIntoId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumEntry" ADD CONSTRAINT "CurriculumEntry_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "Curriculum"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumEntry" ADD CONSTRAINT "CurriculumEntry_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "Programme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrolment" ADD CONSTRAINT "Enrolment_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrolment" ADD CONSTRAINT "Enrolment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
