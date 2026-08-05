-- CreateTable
CREATE TABLE "HiddenNote" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HiddenNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HiddenNote_profileId_idx" ON "HiddenNote"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "HiddenNote_noteId_profileId_key" ON "HiddenNote"("noteId", "profileId");

-- AddForeignKey
ALTER TABLE "HiddenNote" ADD CONSTRAINT "HiddenNote_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HiddenNote" ADD CONSTRAINT "HiddenNote_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
