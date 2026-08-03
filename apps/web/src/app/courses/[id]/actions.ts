"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseClock } from "@/modules/academics/course";
import { formatVenue, formatPerson, formatTitle } from "@/modules/academics/format";
import { AssessmentKind, TaskState, EnrolmentStatus } from "@/generated/prisma/client";

/// Only a student enrolled in the course may add to it. Everything here
/// is shared with coursemates, so enrolment is the permission.
async function guard(courseId: string) {
  const session = await auth();
  if (!session?.user) return null;
  const profile = await prisma.studentProfile.findFirst({
    where: { userId: session.user.id, isActive: true },
    select: { id: true },
  });
  if (!profile) return null;
  const enrolled = await prisma.enrolment.findFirst({
    where: { profileId: profile.id, courseId, status: EnrolmentStatus.ACTIVE },
    select: { id: true },
  });
  return enrolled ? profile : null;
}

export async function addClassSession(_prev: unknown, formData: FormData) {
  const courseId = String(formData.get("courseId") ?? "");
  const profile = await guard(courseId);
  if (!profile) return { error: "You are not taking this course." };

  const weekday = Number(formData.get("weekday"));
  const startsAt = parseClock(String(formData.get("startsAt") ?? ""));
  const endsAt = parseClock(String(formData.get("endsAt") ?? ""));
  const venue = formatVenue(String(formData.get("venue") ?? ""));
  const lecturer = formatPerson(String(formData.get("lecturer") ?? ""));

  if (!weekday || weekday < 1 || weekday > 7) return { error: "Pick a day." };
  if (startsAt === null || endsAt === null) return { error: "Times look like 10:00." };
  if (endsAt <= startsAt) return { error: "It has to end after it starts." };

  await prisma.classSession.create({
    data: { courseId, weekday, startsAt, endsAt, venue, lecturer, addedBy: profile.id },
  });
  revalidatePath(`/courses/${courseId}`);
  return { ok: true };
}

export async function addAssessment(_prev: unknown, formData: FormData) {
  const courseId = String(formData.get("courseId") ?? "");
  const profile = await guard(courseId);
  if (!profile) return { error: "You are not taking this course." };

  const title = formatTitle(String(formData.get("title") ?? ""));
  const kind = String(formData.get("kind") ?? "ASSIGNMENT") as AssessmentKind;
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "23:59");
  const isPrivate = formData.get("isPrivate") === "on";

  if (title.length < 3) return { error: "Give it a title." };
  if (!Object.values(AssessmentKind).includes(kind)) return { error: "Pick a type." };
  const dueAt = new Date(`${date}T${time || "23:59"}:00`);
  if (Number.isNaN(dueAt.getTime())) return { error: "Pick a due date." };

  await prisma.assessment.create({
    data: { courseId, kind, title, dueAt, isPrivate, addedBy: profile.id },
  });
  revalidatePath(`/courses/${courseId}`);
  revalidatePath("/today");
  return { ok: true };
}

export async function setTaskState(assessmentId: string, courseId: string, state: TaskState) {
  const profile = await guard(courseId);
  if (!profile) return { error: "You are not taking this course." };

  await prisma.task.upsert({
    where: { profileId_assessmentId: { profileId: profile.id, assessmentId } },
    update: { state },
    create: { profileId: profile.id, assessmentId, state },
  });
  revalidatePath(`/courses/${courseId}`);
  revalidatePath("/today");
  return { ok: true };
}

/// Class times are shared, so removing one removes it for everyone
/// taking the course — the same trust as adding one.
export async function removeClassSession(sessionId: string, courseId: string) {
  const profile = await guard(courseId);
  if (!profile) return { error: "You are not taking this course." };

  await prisma.classSession.delete({ where: { id: sessionId } });
  revalidatePath(`/courses/${courseId}`);
  revalidatePath("/today");
  return { ok: true };
}

/// Removing a shared assessment removes it for everyone. Dismissing is
/// the per-student action; this is for something that should not be
/// there at all.
export async function removeAssessment(assessmentId: string, courseId: string) {
  const profile = await guard(courseId);
  if (!profile) return { error: "You are not taking this course." };

  await prisma.assessment.delete({ where: { id: assessmentId } });
  revalidatePath(`/courses/${courseId}`);
  revalidatePath("/today");
  return { ok: true };
}
