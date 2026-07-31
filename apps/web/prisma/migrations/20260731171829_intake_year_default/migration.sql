/*
  Warnings:

  - Made the column `intakeYear` on table `Curriculum` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Curriculum" ALTER COLUMN "intakeYear" SET NOT NULL,
ALTER COLUMN "intakeYear" SET DEFAULT 0;
