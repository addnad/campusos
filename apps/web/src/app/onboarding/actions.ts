"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Confidence } from "@/generated/prisma/client";

const TOKENS = [
  "ember", "volt", "fern", "mint", "teal",
  "aqua", "indigo", "grape", "orchid", "hibiscus",
];

const norm = (c: string) => c.toUpperCase().replace(/[^A-Z0-9]/g, "");

export async function completeOnboarding(_prev: unknown, formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "Not signed in." };

  const programmeId = String(formData.get("programmeId") ?? "");
  const level = String(formData.get("level") ?? "");
  const semester = Number(formData.get("semester") ?? 0);
  const institutionId = String(formData.get("institutionId") ?? "");
  const payload = String(formData.get("courses") ?? "[]");

  if (!programmeId || !level || !semester) return { error: "Missing details." };

  let courses: { courseId?: string; code: string; title: string; units: number }[];
  try {
    courses = JSON.parse(payload);
  } catch {
    return { error: "Could not read your course list." };
  }
  if (courses.length === 0) return { error: "Add at least one course." };

  const profile = await prisma.studentProfile.create({
    data: { userId: session.user.id, programmeId, level, semester },
  });

  for (const [i, c] of courses.entries()) {
    let courseId = c.courseId;

    // Student-supplied course: create it, or reuse if someone already added it.
    if (!courseId) {
      const existing = await prisma.course.upsert({
        where: {
          institutionId_normalisedCode: {
            institutionId,
            normalisedCode: norm(c.code),
          },
        },
        update: {},
        create: {
          institutionId,
          normalisedCode: norm(c.code),
          displayCode: c.code.trim(),
          title: c.title.trim(),
          confidence: Confidence.STUDENT_SUPPLIED,
        },
      });
      courseId = existing.id;
    }

    await prisma.enrolment.create({
      data: {
        profileId: profile.id,
        courseId,
        level,
        semester,
        units: c.units,
        colourToken: TOKENS[i % TOKENS.length],
      },
    });
  }

  redirect("/today");
}
