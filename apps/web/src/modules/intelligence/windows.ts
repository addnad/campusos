import { prisma } from "@/lib/prisma";
import { EnrolmentStatus } from "@/generated/prisma/client";

/// Under 45 minutes is walking time, not study time. Over three hours is
/// not a gap between classes, it is the rest of the day.
const MIN_MINUTES = 45;
const MAX_MINUTES = 180;

export type FreeWindow = {
  startsAt: Date;
  endsAt: Date;
  minutes: number;
  after: string;
  before: string;
  /// What would fit. Advisory: a student can ignore it (ADR-003).
  suggestion: string | null;
  courseId: string | null;
  colour: string | null;
};

const at = (day: Date, minutes: number) => {
  const d = new Date(day);
  d.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return d;
};

const isoDay = (d: Date) => (d.getDay() === 0 ? 7 : d.getDay());

/// Gaps between today's classes, with something that would fit in them.
/// A window on its own is a fact; a window plus what is due is a plan.
export async function windowsFor(profileId: string, now = new Date()) {
  const enrolments = await prisma.enrolment.findMany({
    where: { profileId, status: EnrolmentStatus.ACTIVE },
    select: {
      courseId: true, colourToken: true,
      course: {
        select: {
          displayCode: true,
          sessions: { where: { profileId, weekday: isoDay(now) }, select: { startsAt: true, endsAt: true } },
        },
      },
    },
  });

  const blocks = enrolments.flatMap((e) =>
    e.course.sessions.map((s) => ({
      startsAt: s.startsAt, endsAt: s.endsAt,
      code: e.course.displayCode, courseId: e.courseId, colour: e.colourToken,
    })),
  ).sort((a, b) => a.startsAt - b.startsAt);

  if (blocks.length < 2) return [];

  const gaps: FreeWindow[] = [];
  for (let i = 0; i < blocks.length - 1; i++) {
    const a = blocks[i];
    const b = blocks[i + 1];
    const minutes = b.startsAt - a.endsAt;
    if (minutes < MIN_MINUTES || minutes > MAX_MINUTES) continue;

    const endsAt = at(now, b.startsAt);
    // A window that has already passed is not a window.
    if (endsAt <= now) continue;

    gaps.push({
      startsAt: at(now, a.endsAt),
      endsAt,
      minutes,
      after: a.code,
      before: b.code,
      suggestion: null,
      courseId: null,
      colour: null,
    });
  }

  if (gaps.length === 0) return [];

  // What is actually waiting, in the order it matters: something due
  // today beats cards, which beat nothing.
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const [dueToday, cards] = await Promise.all([
    prisma.assessment.findMany({
      where: {
        profileId,
        dueAt: { gte: now, lte: endOfDay },
        course: { enrolments: { some: { profileId, status: EnrolmentStatus.ACTIVE } } },
      },
      orderBy: { dueAt: "asc" },
      include: { course: { select: { displayCode: true, id: true } } },
      take: 1,
    }),
    prisma.flashcard.groupBy({
      by: ["courseId"],
      where: { profileId, dueAt: { lte: now } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 1,
    }),
  ]);

  let suggestion: string | null = null;
  let courseId: string | null = null;
  let colour: string | null = null;

  if (dueToday.length > 0) {
    const a = dueToday[0];
    suggestion = `${a.course.displayCode} — ${a.title} is due tonight`;
    courseId = a.course.id;
  } else if (cards.length > 0) {
    const c = cards[0];
    const course = enrolments.find((e) => e.courseId === c.courseId);
    if (course) {
      const n = c._count.id;
      suggestion = `${n} ${n === 1 ? "card" : "cards"} due in ${course.course.displayCode}`;
      courseId = c.courseId;
    }
  }

  if (courseId) {
    colour = enrolments.find((e) => e.courseId === courseId)?.colourToken ?? null;
  }

  // Only the next window carries a suggestion: three windows each
  // telling you the same thing is noise.
  return gaps.map((g, i) => (i === 0 ? { ...g, suggestion, courseId, colour } : g));
}
