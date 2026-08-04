import { prisma } from "@/lib/prisma";
import { EnrolmentStatus } from "@/generated/prisma/client";

/// Three students on the same course, session, level and semester opens
/// a room. Low enough that a small department reaches it; high enough
/// that it is not a room of one.
export const THRESHOLD = 2; // TEMP: back to 3 before shipping

/// Rooms are created lazily, when someone looks. No jobs, no queues, and
/// it self-heals if a count changes.
export async function roomsFor(profileId: string) {
  const mine = await prisma.enrolment.findMany({
    where: { profileId, status: EnrolmentStatus.ACTIVE },
    select: { courseId: true, level: true, semester: true, session: true, colourToken: true,
              course: { select: { id: true, displayCode: true, title: true } } },
  });
  if (mine.length === 0) return [];

  // One grouped count rather than a query per course.
  const counts = await prisma.enrolment.groupBy({
    by: ["courseId", "level", "semester", "session"],
    where: {
      status: EnrolmentStatus.ACTIVE,
      OR: mine.map((e) => ({
        courseId: e.courseId, level: e.level, semester: e.semester, session: e.session,
      })),
    },
    _count: { profileId: true },
  });
  const countOf = new Map(
    counts.map((c) => [`${c.courseId}|${c.level}|${c.semester}|${c.session}`, c._count.profileId]),
  );

  const eligible = mine.filter(
    (e) => (countOf.get(`${e.courseId}|${e.level}|${e.semester}|${e.session}`) ?? 0) >= THRESHOLD,
  );

  // Open any room that has earned it but does not exist yet.
  for (const e of eligible) {
    await prisma.community.upsert({
      where: { courseId_level_semester: { courseId: e.courseId, level: e.level, semester: e.semester } },
      update: {},
      create: { courseId: e.courseId, level: e.level, semester: e.semester },
    });
  }

  const communities = await prisma.community.findMany({
    where: { OR: eligible.map((e) => ({ courseId: e.courseId, level: e.level, semester: e.semester })) },
    include: {
      course: { select: { displayCode: true, title: true } },
      members: { where: { profileId }, select: { id: true, state: true } },
      _count: { select: { members: true, messages: true } },
    },
  });

  return communities.map((c) => {
    const enrolment = mine.find((e) => e.courseId === c.courseId);
    return {
      id: c.id,
      courseId: c.courseId,
      code: c.course.displayCode,
      title: c.course.title,
      colour: enrolment?.colourToken ?? "ember",
      joined: c.members.length > 0 && c.members[0].state !== "REMOVED",
      members: c._count.members,
      messages: c._count.messages,
      classmates: countOf.get(`${c.courseId}|${c.level}|${c.semester}|${enrolment?.session ?? ""}`) ?? 0,
    };
  });
}

/// How close the courses without a room are, so a student can see what
/// they are waiting for rather than a blank screen.
export async function pendingFor(profileId: string) {
  const mine = await prisma.enrolment.findMany({
    where: { profileId, status: EnrolmentStatus.ACTIVE },
    select: { courseId: true, level: true, semester: true, session: true,
              course: { select: { displayCode: true } } },
  });
  if (mine.length === 0) return [];

  const counts = await prisma.enrolment.groupBy({
    by: ["courseId", "level", "semester", "session"],
    where: {
      status: EnrolmentStatus.ACTIVE,
      OR: mine.map((e) => ({ courseId: e.courseId, level: e.level, semester: e.semester, session: e.session })),
    },
    _count: { profileId: true },
  });
  const countOf = new Map(
    counts.map((c) => [`${c.courseId}|${c.level}|${c.semester}|${c.session}`, c._count.profileId]),
  );

  return mine
    .map((e) => ({
      code: e.course.displayCode,
      here: countOf.get(`${e.courseId}|${e.level}|${e.semester}|${e.session}`) ?? 1,
    }))
    .filter((e) => e.here < THRESHOLD)
    .sort((a, b) => b.here - a.here);
}
