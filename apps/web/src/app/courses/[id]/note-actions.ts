"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { EnrolmentStatus } from "@/generated/prisma/client";

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

export async function saveNote(_prev: unknown, formData: FormData) {
  const courseId = String(formData.get("courseId") ?? "");
  const profile = await guard(courseId);
  if (!profile) return { error: "You are not taking this course." };

  const id = String(formData.get("id") ?? "") || null;
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim() || null;
  const topic = String(formData.get("topic") ?? "").trim() || null;
  const isShared = formData.get("isShared") === "on";
  const filePath = String(formData.get("filePath") ?? "") || null;

  if (title.length < 2) return { error: "Give it a title." };
  if (!body && !filePath && !id) return { error: "Write something or attach a file." };

  const data = {
    title,
    body,
    topic,
    isShared,
    ...(filePath
      ? {
          filePath,
          fileType: String(formData.get("fileType") ?? "") || null,
          fileSize: Number(formData.get("fileSize")) || null,
          fileName: String(formData.get("fileName") ?? "") || null,
        }
      : {}),
  };

  if (id) {
    // Scoped: you can only edit your own.
    const updated = await prisma.note.updateMany({
      where: { id, profileId: profile.id },
      data,
    });
    if (updated.count === 0) return { error: "Not your note." };
  } else {
    await prisma.note.create({ data: { ...data, courseId, profileId: profile.id } });
  }

  revalidatePath(`/courses/${courseId}`);
  return { ok: true };
}

export async function deleteNote(noteId: string, courseId: string) {
  const profile = await guard(courseId);
  if (!profile) return { error: "You are not taking this course." };

  await prisma.note.deleteMany({ where: { id: noteId, profileId: profile.id } });
  revalidatePath(`/courses/${courseId}`);
  return { ok: true };
}

/// Hides a coursemate's shared note. Never your own: you cannot hide
/// your own work from yourself.
export async function hideNote(noteId: string, courseId: string) {
  const profile = await guard(courseId);
  if (!profile) return { error: "You are not taking this course." };

  const note = await prisma.note.findUnique({
    where: { id: noteId },
    select: { profileId: true },
  });
  if (!note || note.profileId === profile.id) return { error: "Not applicable." };

  await prisma.hiddenNote.upsert({
    where: { noteId_profileId: { noteId, profileId: profile.id } },
    update: {},
    create: { noteId, profileId: profile.id },
  });
  revalidatePath(`/courses/${courseId}`);
  return { ok: true };
}
