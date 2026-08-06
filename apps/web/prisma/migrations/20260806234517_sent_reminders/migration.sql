-- CreateTable
CREATE TABLE "SentReminder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SentReminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SentReminder_createdAt_idx" ON "SentReminder"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SentReminder_userId_key_day_key" ON "SentReminder"("userId", "key", "day");

-- AddForeignKey
ALTER TABLE "SentReminder" ADD CONSTRAINT "SentReminder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
