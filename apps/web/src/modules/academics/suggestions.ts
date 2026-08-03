import { prisma } from "@/lib/prisma";
import { EnrolmentStatus } from "@/generated/prisma/client";

/// Same course, same weekday, start within this window means it is the
/// same class and you already have it.
const SAME_CLASS_MINUTES = 10;

export type ClassSuggestion = {
  key: string;
  courseId: string;
  weekday: number;
  startsAt: number;
  endsAt: number;
  venue: string | null;
  lecturer: string | null;
  /// How many coursemates entered this. More agreement, more confidence.
  count: number;
};

export type AssessmentSuggestion = {
  key: string;
  courseId: string;
  title: string;
  kind: string;
  dueAt: Date;
  count: number;
};

/// What coursemates have entered that this student does not. Never
/// applied automatically: a timetable that is right for one group can be
/// wrong for another, so these are offers, not facts.
export async function suggestionsFor(profileId: string, courseIds?: string[]) {
  const enrolments = await prisma.enrolment.findMany({
    where: {
      profileId,
      status: EnrolmentStatus.ACTIVE,
      ...(courseIds ? { courseId: { in: courseIds } } : {}),
    },
    select: { courseId: true, level: true, semester: true },
  });
  const ids = enrolments.map((e) => e.courseId);
  if (ids.length === 0) return { classes: [], assessments: [] };

  // Only people taking it alongside you. A student repeating COS 101
  // from two years ago has a timetable that is wrong for this year's
  // fresher, and offering it would be worse than offering nothing.
  const alongside = enrolments.map((e) => ({
    courseId: e.courseId, level: e.level, semester: e.semester,
  }));
  const peers = await prisma.enrolment.findMany({
    where: {
      status: EnrolmentStatus.ACTIVE,
      profileId: { not: profileId },
      OR: alongside,
    },
    select: { profileId: true },
  });
  const peerIds = [...new Set(peers.map((p) => p.profileId))];
  if (peerIds.length === 0) return { classes: [], assessments: [] };

  const dismissed = new Set(
    (await prisma.dismissedSuggestion.findMany({ where: { profileId }, select: { key: true } }))
      .map((d) => d.key),
  );

  const [mine, theirs, myAssessments, theirAssessments] = await Promise.all([
    prisma.classSession.findMany({ where: { profileId, courseId: { in: ids } } }),
    prisma.classSession.findMany({ where: { courseId: { in: ids }, profileId: { in: peerIds } } }),
    prisma.assessment.findMany({ where: { profileId, courseId: { in: ids } } }),
    prisma.assessment.findMany({
      where: { courseId: { in: ids }, profileId: { in: peerIds }, isPrivate: false, dueAt: { gte: new Date() } },
    }),
  ]);

  // Group coursemates' entries so three people with the same Monday
  // 09:00 produce one suggestion, not three.
  const classGroups = new Map<string, ClassSuggestion>();
  for (const s of theirs) {
    const haveIt = mine.some(
      (m) => m.courseId === s.courseId && m.weekday === s.weekday &&
        Math.abs(m.startsAt - s.startsAt) <= SAME_CLASS_MINUTES,
    );
    if (haveIt) continue;

    const key = `class:${s.courseId}:${s.weekday}:${Math.round(s.startsAt / SAME_CLASS_MINUTES)}`;
    if (dismissed.has(key)) continue;
    const existing = classGroups.get(key);
    if (existing) existing.count += 1;
    else classGroups.set(key, {
      key, courseId: s.courseId, weekday: s.weekday, startsAt: s.startsAt,
      endsAt: s.endsAt, venue: s.venue, lecturer: s.lecturer, count: 1,
    });
  }

  const assessmentGroups = new Map<string, AssessmentSuggestion>();
  for (const a of theirAssessments) {
    // Titles are free text, so same course and same day is the match.
    const day = a.dueAt.toDateString();
    const haveIt = myAssessments.some(
      (m) => m.courseId === a.courseId && m.dueAt.toDateString() === day,
    );
    if (haveIt) continue;

    const key = `due:${a.courseId}:${day}:${a.kind}`;
    if (dismissed.has(key)) continue;
    const existing = assessmentGroups.get(key);
    if (existing) existing.count += 1;
    else assessmentGroups.set(key, {
      key, courseId: a.courseId, title: a.title, kind: a.kind, dueAt: a.dueAt, count: 1,
    });
  }

  return {
    classes: [...classGroups.values()].sort((a, b) => b.count - a.count),
    assessments: [...assessmentGroups.values()].sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime()),
  };
}

export async function suggestionCount(profileId: string) {
  const s = await suggestionsFor(profileId);
  return s.classes.length + s.assessments.length;
}
