import { config } from "dotenv";
config({ path: ".env" });

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { readFileSync, readdirSync } from "node:fs";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const normName = (n: string) => n.toUpperCase().replace(/[^A-Z0-9]/g, "");

/// Awards are not published alongside programme names, so they are
/// assigned by discipline convention. Wrong occasionally — a five-year
/// engineering degree at one school, four at another — and only affects
/// how many levels a student is offered, which is correctable.
function awardFor(name: string): { award: string; years: number } {
  const n = name.toLowerCase();
  if (/medicine|surgery|mbbs/.test(n)) return { award: "MBBS", years: 6 };
  if (/dentistry|dental/.test(n)) return { award: "BDS", years: 6 };
  if (/pharmacy/.test(n)) return { award: "PharmD", years: 6 };
  if (/veterinary/.test(n)) return { award: "DVM", years: 6 };
  if (/^law$|common law|islamic law|civil law/.test(n)) return { award: "LLB", years: 5 };
  if (/nursing/.test(n)) return { award: "BNSc", years: 5 };
  if (/engineering|engr/.test(n)) return { award: "BEng", years: 5 };
  if (/architecture|building|estate management|quantity surveying|urban|regional planning/.test(n))
    return { award: "BSc", years: 5 };
  if (/education|^edu/.test(n)) return { award: "BEd", years: 4 };
  if (/agric|animal|crop|soil|forestry|fisheries/.test(n)) return { award: "BAgric", years: 5 };
  if (/english|history|philosoph|religio|language|linguistic|arabic|french|theatre|music|fine art|creative art|literature|classic|archaeolog/.test(n))
    return { award: "BA", years: 4 };
  return { award: "BSc", years: 4 };
}

async function main() {
  const dry = process.argv.includes("--dry");
  const dir = "../../curricula/programmes";

  for (const file of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    const shortName = file.replace(".json", "");
    const names: string[] = JSON.parse(readFileSync(`${dir}/${file}`, "utf8"));

    const institution = await prisma.institution.findFirst({
      where: { shortName },
      include: { campuses: { orderBy: { isPrimary: "desc" }, take: 1 } },
    });

    if (!institution || institution.campuses.length === 0) {
      console.log(`${shortName}: not in the database, skipped`);
      continue;
    }

    const campus = institution.campuses[0];
    let added = 0;
    let had = 0;

    for (const name of names) {
      const { award, years } = awardFor(name);

      const existing = await prisma.programme.findFirst({
        where: { campusId: campus.id, normalisedName: normName(name) },
        select: { id: true },
      });
      if (existing) { had += 1; continue; }
      if (dry) { added += 1; continue; }

      await prisma.programme.create({
        data: {
          institutionId: institution.id,
          campusId: campus.id,
          name,
          normalisedName: normName(name),
          award,
          studyMode: "FULL_TIME",
          years,
          confidence: "VERIFIED",
        },
      });
      added += 1;
    }

    console.log(dry ? `${shortName}: would add ${added}, ${had} already there` : `${shortName}: added ${added}, ${had} already there`);
  }
}

main().finally(() => prisma.$disconnect());
