import { prisma } from "@/lib/prisma";
import { EnrolmentStatus, TaskState } from "@/generated/prisma/client";

export { dayName, clock, parseClock } from "./format-time";

/// One course as the student sees it: their enrolment, its class times,
/// and the shared assessments minus anything they have dismissed.
export async function courseFor(userId: string, courseId: string) {
  const profile = await prisma.studentProfile.findFirst({
    where: { userId, isActive: true },
    select: { id: true, level: true, semester: true },
  });
  if (!profile) return null;

  const enrolment = await prisma.enrolment.findFirst({
    where: { profileId: profile.id, courseId, status: EnrolmentStatus.ACTIVE },
    include: {
      course: {
        include: {
          sessions: { where: { profileId: profile.id }, orderBy: [{ weekday: "asc" }, { startsAt: "asc" }] },
          assessments: {
            where: { profileId: profile.id },
            orderBy: { dueAt: "asc" },
            include: { tasks: { where: { profileId: profile.id } } },
          },
        },
      },
    },
  });
  if (!enrolment) return null;

  const assessments = enrolment.course.assessments
    .map((a) => ({ ...a, state: a.tasks[0]?.state ?? TaskState.PENDING }))
    .filter((a) => a.state !== TaskState.DISMISSED);

  return { profile, enrolment, course: enrolment.course, assessments };
}
