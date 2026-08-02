import { prisma } from "@/lib/prisma";
import { EnrolmentStatus } from "@/generated/prisma/client";

/// A student's active semester: the profile, where they study, and what
/// they are carrying. Everything on Today reads from this.
export async function semesterFor(userId: string) {
  return prisma.studentProfile.findFirst({
    where: { userId, isActive: true },
    include: {
      programme: {
        include: {
          institution: { select: { name: true, shortName: true, kind: true } },
          campus: { select: { name: true } },
        },
      },
      enrolments: {
        where: { status: EnrolmentStatus.ACTIVE },
        include: { course: { select: { displayCode: true, title: true } } },
        orderBy: { course: { normalisedCode: "asc" } },
      },
    },
  });
}
