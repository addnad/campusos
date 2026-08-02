-- AlterTable
ALTER TABLE "Programme" ADD COLUMN     "confidence" "Confidence" NOT NULL DEFAULT 'VERIFIED',
ADD COLUMN     "normalisedName" TEXT NOT NULL DEFAULT '';
