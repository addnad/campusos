import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/// Neon scales to zero when idle, so the first query after a quiet spell
/// hits a sleeping database and fails while it wakes. Without this, the
/// first student to open the app after a lull sees an error and has no
/// reason to try again.
const COLD_START_RETRIES = 3;
const BACKOFF_MS = [400, 1200, 2500];

function isWaking(e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  return (
    msg.includes("Can't reach database server") ||
    msg.includes("Connection terminated") ||
    msg.includes("Server has closed the connection") ||
    msg.includes("ECONNRESET") ||
    msg.includes("ETIMEDOUT")
  );
}

function withRetry(client: PrismaClient) {
  return client.$extends({
    query: {
      async $allOperations({ args, query }) {
        let lastError: unknown;
        for (let attempt = 0; attempt <= COLD_START_RETRIES; attempt++) {
          try {
            return await query(args);
          } catch (e) {
            // Only a waking database is worth retrying: a constraint
            // violation retried three times is three failures.
            if (!isWaking(e) || attempt === COLD_START_RETRIES) throw e;
            lastError = e;
            await new Promise((r) => setTimeout(r, BACKOFF_MS[attempt]));
          }
        }
        throw lastError;
      },
    },
  }) as unknown as PrismaClient;
}

export const prisma =
  globalForPrisma.prisma ??
  withRetry(
    new PrismaClient({
      adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
    }),
  );

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
