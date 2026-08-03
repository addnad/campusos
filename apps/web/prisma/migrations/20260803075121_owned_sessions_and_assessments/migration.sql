/*
  Warnings:

  - You are about to drop the column `addedBy` on the `Assessment` table. All the data in the column will be lost.
  - You are about to drop the column `addedBy` on the `ClassSession` table. All the data in the column will be lost.
  - Added the required column `profileId` to the `Assessment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profileId` to the `ClassSession` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Assessment" DROP COLUMN "addedBy",
ADD COLUMN     "profileId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ClassSession" DROP COLUMN "addedBy",
ADD COLUMN     "profileId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Assessment_profileId_idx" ON "Assessment"("profileId");

-- CreateIndex
CREATE INDEX "ClassSession_profileId_idx" ON "ClassSession"("profileId");

-- AddForeignKey
ALTER TABLE "ClassSession" ADD CONSTRAINT "ClassSession_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
