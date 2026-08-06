"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Confidence } from "@/generated/prisma/client";
import { sessionFor } from "@/modules/academics/session";

/// Hue order walked with a stride, not in sequence: assigning colours in
/// hue order gives a student four greens in a row, and colour is the
/// recognition system. This keeps adjacent courses at least 117 degrees
/// apart on the wheel.
const TOKENS = [
  "ember", "teal", "orchid", "fern", "indigo",
  "volt", "aqua", "hibiscus", "mint", "grape",
];

const norm = (c: string) => c.toUpperCase().replace(/[^A-Z0-9]/g, "");

export async function completeOnboarding(_prev: unknown, formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "Not signed in." };

  const programmeId = String(formData.get("programmeId") ?? "");
  const level = String(formData.get("level") ?? "");
  const semester = Number(formData.get("semester") ?? 0);
  const institutionId = String(formData.get("institutionId") ?? "");
  const campusId = String(formData.get("campusId") ?? "");
  const payload = String(formData.get("courses") ?? "[]");

  if (!programmeId || !level || !semester || !campusId) return { error: "Missing details." };

  let courses: { courseId?: string; code: string; title: string; units: number }[];
  try {
    courses = JSON.parse(payload);
  } catch {
    return { error: "Could not read your course list." };
  }
  if (courses.length === 0) return { error: "Add at least one course." };

  const rolling = formData.get("rollover") === "1";
  const session_ = sessionFor();

  // One transaction: a failure part-way through would otherwise leave a
  // profile with only some of its courses, which reads as data loss to
  // the student and is invisible to us.
  await prisma.$transaction(async (tx) => {
    // A rollover moves the profile on; onboarding creates it. Same
    // screen, same prefill, different write.
    const existing = rolling
      ? await tx.studentProfile.findFirst({
          where: { userId: session.user.id, isActive: true },
          select: { id: true },
        })
      : null;

    if (existing) {
      await tx.enrolment.updateMany({
        where: { profileId: existing.id, status: "ACTIVE" },
        data: { status: "COMPLETED" },
      });
    }

    const profile = existing
      ? await tx.studentProfile.update({
          where: { id: existing.id },
          data: {
            programmeId, level, semester,
            semesterEndsAt: null, nextSemesterAt: null,
            datePromptedAt: null, dateUnknownAt: null,
          },
        })
      : await tx.studentProfile.create({
          data: { userId: session.user.id, programmeId, level, semester },
        });

    for (const [i, c] of courses.entries()) {
      let courseId = c.courseId;

      // Student-supplied course: create it, or reuse if someone already added it.
      if (!courseId) {
        const existing = await tx.course.upsert({
          where: {
            campusId_normalisedCode: {
              campusId,
              normalisedCode: norm(c.code),
            },
          },
          update: {},
          create: {
            institutionId,
            campusId,
            normalisedCode: norm(c.code),
            displayCode: c.code.trim(),
            title: c.title.trim(),
            confidence: Confidence.STUDENT_SUPPLIED,
          },
        });
        courseId = existing.id;
      }

      // Upsert, not create: a rollover re-run would otherwise hit the
      // unique constraint and fail the whole transaction. A student
      // repeating a course in a new session gets a second row, so their
      // first attempt survives.
      await tx.enrolment.upsert({
        where: {
          profileId_courseId_session_semester: {
            profileId: profile.id, courseId, session: session_, semester,
          },
        },
        update: {
          status: "ACTIVE",
          level,
          units: c.units,
          colourToken: TOKENS[i % TOKENS.length],
        },
        create: {
          profileId: profile.id,
          courseId,
          level,
          semester,
          session: session_,
          units: c.units,
          colourToken: TOKENS[i % TOKENS.length],
        },
      });
    }
  });

  redirect("/today");
}
