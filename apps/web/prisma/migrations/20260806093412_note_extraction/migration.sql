-- AlterTable
ALTER TABLE "Note" ADD COLUMN     "extractFailed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "extracted" TEXT,
ADD COLUMN     "extractedAt" TIMESTAMP(3);
