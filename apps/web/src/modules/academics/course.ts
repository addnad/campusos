import { prisma } from "@/lib/prisma";
import { EnrolmentStatus, TaskState } from "@/generated/prisma/client";

const DAYS = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const dayName = (weekday: number) => DAYS[weekday] ?? "";

export function clock(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function parseClock(value: string) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

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
          sessions: { orderBy: [{ weekday: "asc" }, { startsAt: "asc" }] },
          assessments: {
            where: { OR: [{ isPrivate: false }, { addedBy: profile.id }] },
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
