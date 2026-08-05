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

  // Who has actually posted lately. A room with three members and
  // nothing said for a week is dead and should look it.
  const ACTIVE_WINDOW = 86400000 * 2;
  const talkers = await prisma.message.groupBy({
    by: ["communityId", "authorId"],
    where: {
      deletedAt: null,
      isSystem: false,
      createdAt: { gte: new Date(Date.now() - ACTIVE_WINDOW) },
    },
  });
  const talkingOf = new Map<string, number>();
  for (const t of talkers) {
    talkingOf.set(t.communityId, (talkingOf.get(t.communityId) ?? 0) + 1);
  }

  const communities = await prisma.community.findMany({
    where: { OR: eligible.map((e) => ({ courseId: e.courseId, level: e.level, semester: e.semester })) },
    include: {
      course: { select: { displayCode: true, title: true } },
      members: { where: { profileId }, select: { id: true, state: true, lastReadAt: true } },
      _count: { select: { members: true, messages: true } },
    },
  });

  // Own messages excluded: posting from a phone should not make a room
  // look unread on a laptop.
  const joined = communities.filter((c) => c.members.length > 0);
  const unreadCounts = await Promise.all(
    joined.map((c) =>
      prisma.message.count({
        where: {
          communityId: c.id,
          deletedAt: null,
          authorId: { not: profileId },
          ...(c.members[0].lastReadAt ? { createdAt: { gt: c.members[0].lastReadAt } } : {}),
        },
      }),
    ),
  );
  const unreadOf = new Map(joined.map((c, i) => [c.id, unreadCounts[i]]));

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
      unread: unreadOf.get(c.id) ?? 0,
      talking: talkingOf.get(c.id) ?? 0,
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

/// For the nav dot. One count rather than a list, so the tab can show a
/// dot without loading every room.
export async function unreadTotal(profileId: string) {
  const memberships = await prisma.communityMember.findMany({
    where: { profileId, state: { not: "REMOVED" } },
    select: { communityId: true, lastReadAt: true },
  });
  if (memberships.length === 0) return 0;

  const counts = await Promise.all(
    memberships.map((m) =>
      prisma.message.count({
        where: {
          communityId: m.communityId,
          deletedAt: null,
          authorId: { not: profileId },
          ...(m.lastReadAt ? { createdAt: { gt: m.lastReadAt } } : {}),
        },
      }),
    ),
  );
  return counts.reduce((a, b) => a + b, 0);
}
