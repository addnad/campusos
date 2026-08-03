import { prisma } from "@/lib/prisma";
import { EnrolmentStatus, TaskState } from "@/generated/prisma/client";

export type ClassItem = { type: "class"; id: string; at: Date; endsAt: Date; code: string; title: string; venue: string | null; lecturer: string | null; colour: string; courseId: string };
export type DueItem = { type: "due"; id: string; at: Date; code: string; title: string; kind: string; colour: string; courseId: string; state: TaskState };

export type Item = ClassItem | DueItem;

/// Minutes-from-midnight on a given date, as a real Date.
function at(day: Date, minutes: number) {
  const d = new Date(day);
  d.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return d;
}

/// ISO weekday: Monday is 1, Sunday is 7. JS getDay() puts Sunday at 0.
const isoDay = (d: Date) => d.getDay() === 0 ? 7 : d.getDay();

/// Today's classes and every open deadline, on one spine in time order.
/// If nothing is on today, the next class is included so the screen is
/// never blank.
export async function timelineFor(userId: string, now = new Date()) {
  const profile = await prisma.studentProfile.findFirst({
    where: { userId, isActive: true },
    select: { id: true },
  });
  if (!profile) return null;

  const enrolments = await prisma.enrolment.findMany({
    where: { profileId: profile.id, status: EnrolmentStatus.ACTIVE },
    include: {
      course: {
        include: {
          sessions: { where: { profileId: profile.id } },
          assessments: {
            where: {
              profileId: profile.id,
              dueAt: { gte: new Date(now.getTime() - 86400000 * 2) },
            },
            include: { tasks: { where: { profileId: profile.id } } },
          },
        },
      },
    },
  });

  const today = isoDay(now);
  const classes: ClassItem[] = [];
  const later: ClassItem[] = [];
  const due: DueItem[] = [];

  for (const e of enrolments) {
    const colour = e.colourToken;
    const code = e.course.displayCode;

    for (const s of e.course.sessions) {
      const base = {
        type: "class" as const, id: s.id, code, title: e.course.title,
        venue: s.venue, lecturer: s.lecturer, colour, courseId: e.courseId,
      };
      if (s.weekday === today) {
        classes.push({ ...base, at: at(now, s.startsAt), endsAt: at(now, s.endsAt) });
      } else {
        // Days until this weekday comes round again.
        const ahead = (s.weekday - today + 7) % 7 || 7;
        const day = new Date(now);
        day.setDate(day.getDate() + ahead);
        later.push({ ...base, at: at(day, s.startsAt), endsAt: at(day, s.endsAt) });
      }
    }

    for (const a of e.course.assessments) {
      const state = a.tasks[0]?.state ?? TaskState.PENDING;
      if (state === TaskState.DISMISSED) continue;
      due.push({
        type: "due", id: a.id, at: a.dueAt, code, title: a.title,
        kind: a.kind, colour, courseId: e.courseId, state,
      });
    }
  }

  const byTime = (a: Item, b: Item) => a.at.getTime() - b.at.getTime();
  classes.sort(byTime);
  later.sort(byTime);
  due.sort(byTime);

  const endOfDay = new Date(now); endOfDay.setHours(23, 59, 59, 999);
  const dueToday = due.filter((d) => d.at <= endOfDay && d.state !== TaskState.DONE);
  const remaining = classes.filter((c) => c.endsAt > now);

  // Today's spine: classes and anything due today, interleaved.
  const spine = [...classes, ...dueToday].sort(byTime);

  return {
    spine,
    // Shown when nothing is left today, so the screen is never blank.
    next: remaining[0] ?? later[0] ?? null,
    upcoming: due.filter((d) => d.at > endOfDay && d.state !== TaskState.DONE),
    classesLeft: remaining.length,
    dueToday: dueToday.length,
    overdue: due.filter((d) => d.at < now && d.state === TaskState.PENDING).length,
  };
}
