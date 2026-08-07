import { PDFParse } from "pdf-parse";
import { readFileSync, writeFileSync } from "node:fs";

/// Reads an NUC CCMAS discipline PDF into course lists per programme and
/// level. One document covers every university in Nigeria offering those
/// programmes, which is why this is worth parsing rather than fetching
/// school by school.
///
/// The tables have no ruled lines so getTable() finds nothing; the text
/// is tab-separated and consistent enough to read directly.

type Course = { code: string; title: string; units: number; required: boolean };
type Level = { level: string; courses: Course[] };
type Programme = { name: string; award: string; levels: Level[] };

// Not every discipline awards a BSc: Law gives LLB, Medicine MBBS,
// Pharmacy PharmD, Veterinary DVM. Some headings are the award
// alone, with the programme name only in the document title.
const PROGRAMME =
  /^(B\.?Sc\.?|B\.?A\.?|B\.?Eng\.?|B\.?Tech\.?|B\.?Ed\.?|LL\.?B\.?|MBBS|BDS|B\.?Pharm\.?|Pharm\.?D\.?|DVM|B\.?Agric\.?|B\.?N\.?Sc\.?)\s*([A-Za-z][A-Za-z ,&/()'-]*?)\s*$/;
const LEVEL = /^([1-9]00)\s*Level\s*$/i;
// "COS 101 <tab> Introduction to Computing Sciences <tab> 3 <tab> C <tab> 30 45"
const COURSE = /^([A-Z]{2,4})\s?(\d{3})[\s\t]+(.+?)[\s\t]+(\d+)[\s\t]+([CER])\b/;
// Page furniture that interrupts a table mid-list.
const NOISE = /^(--\s*\d+ of \d+\s*--|Computing\s|TOTAL|NOTE:|Course\s*$|Code Course Title|Course Code Course Title)/i;

export function parse(text: string, fallbackName = "") {
  const lines = text.split("\n");
  const programmes: Programme[] = [];

  let programme: Programme | null = null;
  let level: Level | null = null;
  let inStructure = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    // Contents entries are dot leaders; the real heading is not.
    if (line.includes("......")) continue;

    const p = PROGRAMME.exec(line);
    if (p) {
      // Some documents head the section with the award alone — Law is
      // just "LL.B". The discipline is then the programme name, passed
      // in by the caller.
      const award = p[1].replace(/\./g, "").toUpperCase();
      programme = { name: p[2].trim() || fallbackName, award, levels: [] };
      programmes.push(programme);
      level = null;
      inStructure = false;
      continue;
    }

    if (/^Global Course Structure/i.test(line)) { inStructure = true; continue; }

    const l = LEVEL.exec(line);
    if (l && programme) {
      // Only the summary tables: the detailed sections repeat the same
      // courses with synopses attached.
      if (!inStructure) { level = null; continue; }
      // The detailed sections repeat every level with synopses attached.
      // Once a level has been seen, the summary table is finished.
      if (programme.levels.some((x) => x.level === `${l[1]} Level`)) {
        inStructure = false;
        level = null;
        continue;
      }
      level = { level: `${l[1]} Level`, courses: [] };
      programme.levels.push(level);
      continue;
    }

    if (NOISE.test(line)) continue;
    if (!level) continue;

    const c = COURSE.exec(line);
    if (c) {
      level.courses.push({
        code: `${c[1]} ${c[2]}`,
        title: c[3].replace(/\s+/g, " ").trim(),
        units: Number(c[4]),
        required: c[5] === "C",
      });
    }
  }

  return programmes.filter((p) => p.levels.some((l) => l.courses.length > 0));
}

async function main() {
  const [, , input, output] = process.argv;
  if (!input) return;
  if (!input) {
    console.error("usage: tsx scripts/parse-ccmas.ts <pdf> [out.json]");
    process.exit(1);
  }

  const parser = new PDFParse({ data: readFileSync(input) });
  const { text } = await parser.getText();
  await parser.destroy();

  const programmes = parse(text);

  for (const p of programmes) {
    const total = p.levels.reduce((n, l) => n + l.courses.length, 0);
    console.log(`${p.award} ${p.name}: ${p.levels.length} levels, ${total} courses`);
    for (const l of p.levels) {
      console.log(`   ${l.level}: ${l.courses.length} — ${l.courses.slice(0, 3).map((c) => c.code).join(", ")}...`);
    }
  }

  if (output) {
    writeFileSync(output, JSON.stringify(programmes, null, 2));
    console.log(`\nwrote ${output}`);
  }
}

main();
