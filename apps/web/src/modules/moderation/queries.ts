import { prisma } from "@/lib/prisma";

export async function isStaff(userId: string) {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { isStaff: true } });
  return Boolean(u?.isStaff);
}

/// Open reports, grouped by message: three people reporting the same
/// thing is one decision, not three.
export async function openReports() {
  const reports = await prisma.report.findMany({
    where: { state: "OPEN" },
    orderBy: { createdAt: "asc" },
    include: {
      reporter: { select: { user: { select: { handle: true } } } },
      message: {
        include: {
          author: {
            select: {
              id: true,
              user: { select: { handle: true, flaggedAt: true } },
            },
          },
          community: {
            select: {
              id: true, level: true,
              course: { select: { displayCode: true } },
            },
          },
        },
      },
    },
  });

  const byMessage = new Map<string, {
    messageId: string;
    body: string;
    deleted: boolean;
    createdAt: Date;
    authorId: string;
    authorHandle: string | null;
    authorFlagged: boolean;
    communityId: string;
    room: string;
    level: string;
    reporters: string[];
    reportIds: string[];
    reasons: { reason: string | null; note: string | null; by: string }[];
  }>();

  for (const r of reports) {
    const m = r.message;
    const existing = byMessage.get(m.id);
    if (existing) {
      existing.reporters.push(r.reporter.user.handle ?? "student");
      existing.reportIds.push(r.id);
      existing.reasons.push({ reason: r.reason, note: r.note, by: r.reporter.user.handle ?? "student" });
      continue;
    }
    byMessage.set(m.id, {
      messageId: m.id,
      body: m.deletedAt ? "" : m.body,
      deleted: Boolean(m.deletedAt),
      createdAt: m.createdAt,
      authorId: m.authorId,
      authorHandle: m.author.user.handle,
      authorFlagged: Boolean(m.author.user.flaggedAt),
      communityId: m.community.id,
      room: m.community.course.displayCode,
      level: m.community.level,
      reporters: [r.reporter.user.handle ?? "student"],
      reportIds: [r.id],
      reasons: [{ reason: r.reason, note: r.note, by: r.reporter.user.handle ?? "student" }],
    });
  }

  // Most-reported first.
  return [...byMessage.values()].sort((a, b) => b.reporters.length - a.reporters.length);
}

/// A member's standing in one room, for context when deciding.
export async function standingFor(profileId: string) {
  const memberships = await prisma.communityMember.findMany({
    where: { profileId },
    select: {
      strikes: true, state: true,
      community: { select: { course: { select: { displayCode: true } } } },
    },
  });
  return {
    rooms: memberships.length,
    strikes: memberships.reduce((n, m) => n + m.strikes, 0),
    removals: memberships.filter((m) => m.state === "REMOVED").length,
    detail: memberships
      .filter((m) => m.strikes > 0 || m.state !== "ACTIVE")
      .map((m) => ({ room: m.community.course.displayCode, strikes: m.strikes, state: m.state })),
  };
}
