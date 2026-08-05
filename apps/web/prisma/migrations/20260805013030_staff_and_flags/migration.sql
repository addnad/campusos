-- AlterTable
ALTER TABLE "User" ADD COLUMN     "flaggedAt" TIMESTAMP(3),
ADD COLUMN     "isStaff" BOOLEAN NOT NULL DEFAULT false;
