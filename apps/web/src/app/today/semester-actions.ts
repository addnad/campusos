"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { EnrolmentStatus } from "@/generated/prisma/client";

async function myProfile() {
  const session = await auth();
  if (!session?.user) return null;
  return prisma.studentProfile.findFirst({
    where: { userId: session.user.id, isActive: true },
    select: { id: true, level: true, semester: true },
  });
}

export async function setSemesterEnd(formData: FormData) {
  const profile = await myProfile();
  if (!profile) return { error: "Not signed in." };

  const raw = String(formData.get("endsAt") ?? "");
  const endsAt = new Date(`${raw}T23:59:00`);
  if (Number.isNaN(endsAt.getTime())) return { error: "Pick a date." };

  await prisma.studentProfile.update({
    where: { id: profile.id },
    data: { semesterEndsAt: endsAt, datePromptedAt: new Date(), dateUnknownAt: null },
  });
  revalidatePath("/today");
  return { ok: true };
}

export async function setNextSemester(formData: FormData) {
  const profile = await myProfile();
  if (!profile) return { error: "Not signed in." };

  const raw = String(formData.get("startsAt") ?? "");
  const startsAt = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(startsAt.getTime())) return { error: "Pick a date." };

  await prisma.studentProfile.update({
    where: { id: profile.id },
    data: { nextSemesterAt: startsAt, datePromptedAt: new Date() },
  });
  revalidatePath("/today");
  return { ok: true };
}

export async function dontKnowSemesterEnd() {
  const profile = await myProfile();
  if (!profile) return { error: "Not signed in." };

  const now = new Date();
  await prisma.studentProfile.update({
    where: { id: profile.id },
    data: { datePromptedAt: now, dateUnknownAt: now },
  });
  revalidatePath("/today");
  return { ok: true };
}

export async function dismissSemesterPrompt() {
  const profile = await myProfile();
  if (!profile) return { error: "Not signed in." };

  await prisma.studentProfile.update({
    where: { id: profile.id },
    data: { datePromptedAt: new Date() },
  });
  revalidatePath("/today");
  return { ok: true };
}

/// Completes this semester and moves the profile on. Courses are picked
/// fresh afterwards through the same confirm step as onboarding.
/// Level is asked rather than inferred: second semester to first means a
/// new year for most students, but someone repeating the year stays put,
/// and telling them they are a level ahead cascades into wrong prefills
/// and the wrong community.
export async function rollOverSemester(level?: string) {
  const profile = await myProfile();
  if (!profile) return { error: "Not signed in." };

  const nextSemester = profile.semester === 1 ? 2 : 1;

  await prisma.$transaction(async (tx) => {
    await tx.enrolment.updateMany({
      where: { profileId: profile.id, status: EnrolmentStatus.ACTIVE },
      data: { status: EnrolmentStatus.COMPLETED },
    });
    await tx.studentProfile.update({
      where: { id: profile.id },
      data: {
        semester: nextSemester,
        ...(level ? { level } : {}),
        semesterEndsAt: null,
        nextSemesterAt: null,
        datePromptedAt: null,
        dateUnknownAt: null,
      },
    });
  });

  revalidatePath("/today");
  return { ok: true, semester: nextSemester };
}
