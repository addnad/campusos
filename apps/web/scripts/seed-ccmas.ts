import { config } from "dotenv";
config({ path: ".env" });

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Confidence } from "../src/generated/prisma/client";
import { PDFParse } from "pdf-parse";
import { readFileSync } from "node:fs";
import { parse } from "./parse-ccmas";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const norm = (code: string) => code.toUpperCase().replace(/[^A-Z0-9]/g, "");
const normName = (n: string) => n.toUpperCase().replace(/[^A-Z0-9]/g, "");

/// Odd codes are first semester, even are second. The CCMAS tables give
/// a level but not a semester, and Nigerian universities follow this
/// convention almost without exception. Inferred, not stated — a wrong
/// semester is visible and correctable on the confirm screen.
const semesterOf = (code: string) => (Number(code.replace(/\D/g, "")) % 2 === 0 ? 2 : 1);

async function main() {
  const [, , pdfPath, ...flags] = process.argv;
  const dryRun = flags.includes("--dry");
  if (!pdfPath) {
    console.error("usage: tsx scripts/seed-ccmas.ts <pdf> [--dry]");
    process.exit(1);
  }

  const parser = new PDFParse({ data: readFileSync(pdfPath) });
  const { text } = await parser.getText();
  await parser.destroy();

  const parsed = parse(text);
  console.log(`parsed ${parsed.length} programmes\n`);

  for (const p of parsed) {
    // Only where a school already runs it. Creating programmes from a
    // national curriculum would send students to rooms for courses their
    // school does not teach.
    const existing = await prisma.programme.findMany({
      where: { normalisedName: normName(p.name), award: p.award },
      include: { institution: { select: { shortName: true } } },
    });

    if (existing.length === 0) {
      console.log(`- ${p.name}: no school in the database runs it, skipped`);
      continue;
    }

    for (const programme of existing) {
      let courses = 0;
      let entries = 0;

      for (const level of p.levels) {
        for (const c of level.courses) {
          const semester = semesterOf(c.code);

          if (dryRun) { entries += 1; continue; }

          const course = await prisma.course.upsert({
            where: {
              campusId_normalisedCode: {
                campusId: programme.campusId,
                normalisedCode: norm(c.code),
              },
            },
            update: { title: c.title, confidence: Confidence.VERIFIED },
            create: {
              institutionId: programme.institutionId,
              campusId: programme.campusId,
              displayCode: c.code,
              normalisedCode: norm(c.code),
              title: c.title,
              confidence: Confidence.VERIFIED,
            },
          });
          courses += 1;

          const curriculum = await prisma.curriculum.upsert({
            where: {
              programmeId_level_semester_intakeYear: {
                programmeId: programme.id,
                level: level.level,
                semester,
                intakeYear: 0,
              },
            },
            update: {},
            create: {
              programmeId: programme.id,
              level: level.level,
              semester,
              intakeYear: 0,
            },
          });

          await prisma.curriculumEntry.upsert({
            where: {
              curriculumId_courseId: { curriculumId: curriculum.id, courseId: course.id },
            },
            update: { units: c.units, compulsory: c.required, confidence: Confidence.VERIFIED },
            create: {
              curriculumId: curriculum.id,
              courseId: course.id,
              units: c.units,
              compulsory: c.required,
              confidence: Confidence.VERIFIED,
            },
          });
          entries += 1;
        }
      }

      const where = programme.institution.shortName;
      console.log(
        dryRun
          ? `~ ${where} ${p.name}: would write ${entries} entries`
          : `+ ${where} ${p.name}: ${courses} courses, ${entries} entries`,
      );
    }
  }
}

main().finally(() => prisma.$disconnect());
