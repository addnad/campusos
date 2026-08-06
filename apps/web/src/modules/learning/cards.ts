import { prisma } from "@/lib/prisma";
import { today } from "./tutor";

const FREE_DECKS = 2;

export async function cardAllowanceFor(profileId: string, userId: string) {
  const [user, made] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { cardDailyLimit: true } }),
    prisma.flashcard.count({
      where: {
        profileId,
        noteId: { not: null },
        createdAt: { gte: new Date(`${today()}T00:00:00`) },
      },
    }),
  ]);
  // Counted in decks, not cards: one generation is one deck.
  const limit = user?.cardDailyLimit ?? FREE_DECKS;
  return { limit, madeToday: made };
}

/// What is due now, oldest first. A student should be told which cards
/// to review, not handed a list and left to choose.
export async function dueFor(profileId: string, courseId?: string) {
  return prisma.flashcard.findMany({
    where: {
      profileId,
      dueAt: { lte: new Date() },
      ...(courseId ? { courseId } : {}),
    },
    orderBy: { dueAt: "asc" },
    take: 20,
    include: { course: { select: { displayCode: true } } },
  });
}

export async function deckFor(profileId: string, courseId: string) {
  const [cards, due] = await Promise.all([
    prisma.flashcard.count({ where: { profileId, courseId } }),
    prisma.flashcard.count({ where: { profileId, courseId, dueAt: { lte: new Date() } } }),
  ]);
  return { cards, due };
}

/// Interval doubles on recall and resets on a miss, so a forgotten card
/// comes back tomorrow and a known one drifts out of the way.
export function schedule(interval: number, streak: number, correct: boolean) {
  if (!correct) return { interval: 0, streak: 0, dueAt: addDays(1) };
  const next = interval === 0 ? 1 : Math.min(interval * 2, 60);
  return { interval: next, streak: streak + 1, dueAt: addDays(next) };
}

function addDays(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(4, 0, 0, 0);
  return d;
}
