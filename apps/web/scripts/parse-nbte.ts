import { PDFParse } from "pdf-parse";
import { readFileSync } from "node:fs";

/// NBTE curricula, one PDF per programme. Cleaner than CCMAS: the level
/// and semester are stated outright rather than inferred from odd and
/// even course codes.
///
/// "1 COM 111 Introduction to computing 2 2 3 4" is
/// S/N, code, title, then lecture hours, practical hours, credit units,
/// contact hours. Credit units is the third number from the end.

export type Course = { code: string; title: string; units: number };
export type Level = { level: string; semester: number; courses: Course[] };

const YEARS: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4 };

const HEADING = /^YEAR\s+(I{1,3}|IV)\s+SEMESTER\s+(I{1,2}|\d)/i;
const COURSE = /^\d{1,2}\s+([A-Z]{2,4})\s?(\d{3})\s+(.+?)\s+((?:\d+\s+){2,4}\d+)(?:\s+[A-Z]{2,4}\s?\d{3}|\s+None)?\s*$/;

export function parse(text: string, award: string) {
  const lines = text.split("\n");
  const levels: Level[] = [];
  let current: Level | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const h = HEADING.exec(line);
    if (h) {
      const year = YEARS[h[1].toUpperCase()] ?? 1;
      const sem = h[2] === "II" ? 2 : h[2] === "I" ? 1 : Number(h[2]);
      // ND runs two years from 100, HND from 300 — an HND student is
      // not in their first year of tertiary study.
      const base = award === "HND" ? 300 : 100;
      const level = `${base + (year - 1) * 100} Level`;

      current = levels.find((l) => l.level === level && l.semester === sem) ?? null;
      if (!current) {
        current = { level, semester: sem, courses: [] };
        levels.push(current);
      }
      continue;
    }

    if (!current) continue;

    const c = COURSE.exec(line);
    if (!c) continue;

    const numbers = c[4].trim().split(/\s+/).map(Number);
    // L P CU CH — credit units is third from the end.
    const units = numbers.length >= 3 ? numbers[numbers.length - 2] : numbers[0];
    if (!Number.isFinite(units) || units < 1 || units > 12) continue;

    current.courses.push({
      code: `${c[1]} ${c[2]}`,
      title: c[3].replace(/\s+/g, " ").trim(),
      units,
    });
  }

  return levels.filter((l) => l.courses.length > 0);
}

async function main() {
  const [, , file] = process.argv;
  if (!file) { console.error("usage: tsx scripts/parse-nbte.ts <pdf>"); process.exit(1); }

  const parser = new PDFParse({ data: readFileSync(file) });
  const { text } = await parser.getText();
  await parser.destroy();

  const award = /\bhnd\b/i.test(file) ? "HND" : "ND";
  const levels = parse(text, award);

  for (const l of levels) {
    console.log(`${l.level} semester ${l.semester}: ${l.courses.length} courses`);
    for (const c of l.courses.slice(0, 4)) console.log(`   ${c.code.padEnd(9)} ${c.units}u  ${c.title.slice(0, 45)}`);
  }
}

main();
