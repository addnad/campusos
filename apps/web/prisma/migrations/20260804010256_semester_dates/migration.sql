-- AlterTable
ALTER TABLE "StudentProfile" ADD COLUMN     "datePromptedAt" TIMESTAMP(3),
ADD COLUMN     "dateUnknownAt" TIMESTAMP(3),
ADD COLUMN     "nextSemesterAt" TIMESTAMP(3),
ADD COLUMN     "semesterEndsAt" TIMESTAMP(3);
