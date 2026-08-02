import { prisma } from "@/lib/prisma";

export { ladderFor } from "./ladder";
export { normaliseName, looksLike } from "./normalise";
import type { InstitutionKind } from "@/generated/prisma/client";

export async function institutionsByKind(kind: InstitutionKind) {
  return prisma.institution.findMany({
    where: { kind },
    select: { id: true, name: true, shortName: true, state: true },
    orderBy: { name: "asc" },
  });
}

export async function campusesFor(institutionId: string) {
  return prisma.campus.findMany({
    where: { institutionId },
    select: { id: true, name: true },
    orderBy: [{ isPrimary: "desc" }, { name: "asc" }],
  });
}

export async function programmesFor(campusId: string) {
  return prisma.programme.findMany({
    where: { campusId },
    select: { id: true, name: true, award: true, studyMode: true, years: true },
    orderBy: [{ award: "asc" }, { studyMode: "asc" }, { name: "asc" }],
  });
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

/// Every programme at a campus, for duplicate detection when a student
/// declares one we do not have.
export async function programmeNamesFor(campusId: string) {
  return prisma.programme.findMany({
    where: { campusId },
    select: { id: true, name: true, award: true, studyMode: true },
  });
}
