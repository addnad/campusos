import { prisma } from "@/lib/prisma";
import type { InstitutionKind } from "@/generated/prisma/client";

export async function institutionsByKind(kind: InstitutionKind) {
  return prisma.institution.findMany({
    where: { kind },
    select: { id: true, name: true, shortName: true, state: true },
    orderBy: { name: "asc" },
  });
}

export async function programmesFor(institutionId: string) {
  return prisma.programme.findMany({
    where: { institutionId },
    select: { id: true, name: true, award: true },
    orderBy: [{ award: "asc" }, { name: "asc" }],
  });
}

/// Levels a programme has curricula for, plus the standard ladder for
/// its award so a student can pick a level we have nothing for yet.
export async function levelsFor(programmeId: string) {
  const programme = await prisma.programme.findUnique({
    where: { id: programmeId },
    select: { award: true },
  });
  if (!programme) return [];

  const standard: Record<string, string[]> = {
    ND: ["ND I", "ND II"],
    HND: ["HND I", "HND II"],
    NCE: ["NCE I", "NCE II", "NCE III"],
  };

  return (
    standard[programme.award] ?? [
      "100 Level", "200 Level", "300 Level", "400 Level", "500 Level",
    ]
  );
}

/// The prefill. Only VERIFIED entries, never excluded ones.
export async function prefillFor(
  programmeId: string,
  level: string,
  semester: number,
) {
  const curriculum = await prisma.curriculum.findFirst({
    where: { programmeId, level, semester },
    include: {
      entries: {
        where: { excluded: false },
        include: { course: true },
        orderBy: { course: { normalisedCode: "asc" } },
      },
    },
  });
  if (!curriculum) return [];

  return curriculum.entries.map((e) => ({
    courseId: e.course.id,
    code: e.course.displayCode,
    title: e.course.title,
    units: e.units,
    compulsory: e.compulsory,
  }));
}
