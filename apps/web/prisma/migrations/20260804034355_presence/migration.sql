-- CreateTable
CREATE TABLE "Presence" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "seenAt" TIMESTAMP(3) NOT NULL,
    "typingUntil" TIMESTAMP(3),

    CONSTRAINT "Presence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Presence_communityId_seenAt_idx" ON "Presence"("communityId", "seenAt");

-- CreateIndex
CREATE UNIQUE INDEX "Presence_communityId_profileId_key" ON "Presence"("communityId", "profileId");

-- AddForeignKey
ALTER TABLE "Presence" ADD CONSTRAINT "Presence_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presence" ADD CONSTRAINT "Presence_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
