import { config } from "dotenv";
config({ path: ".env" });

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { readFileSync } from "node:fs";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

type Uni = { name: string; abbr: string; state: string; location: string; funding: string };

async function main() {
  const unis: Uni[] = JSON.parse(readFileSync("../../curricula/universities.json", "utf8"));
  const dry = process.argv.includes("--dry");

  let added = 0;
  let skipped = 0;

  for (const u of unis) {
    // Initials collide: Christopher, Crawford and Covenant all give CU.
    // Where Wikipedia has no abbreviation, the first distinctive word is
    // both unique and more recognisable to a student than CU2.
    const base = u.abbr
      ? u.abbr.toUpperCase()
      : u.name
          .replace(/\b(University|of|the|College|Sciences?|Technology)\b/gi, "")
          .trim()
          .split(/\s+/)[0]
          .toUpperCase()
          .slice(0, 10);

    let shortName = base.slice(0, 12);
    let n = 2;
    while (true) {
      const taken = await prisma.institution.findFirst({
        where: { shortName },
        select: { name: true },
      });
      if (!taken || taken.name === u.name) break;
      shortName = `${base.slice(0, 10)}${n}`;
      n += 1;
    }
    const state = u.state.replace(/\.$/, "").trim();

    const existing = await prisma.institution.findFirst({
      where: { OR: [{ name: u.name }, { shortName }] },
      select: { id: true, name: true },
    });

    if (existing) { skipped += 1; continue; }
    if (dry) { added += 1; continue; }

    // One campus each: Wikipedia gives a location, not a campus
    // structure, and most universities run a single main campus. A
    // school with several gets them added when someone needs them.
    await prisma.institution.create({
      data: {
        name: u.name,
        shortName,
        kind: "UNIVERSITY",
        state,
        campuses: { create: { name: "Main Campus", isPrimary: true } },
      },
    });
    added += 1;
  }

  console.log(dry ? `would add ${added}, ${skipped} already there` : `added ${added}, skipped ${skipped}`);
  console.log("total institutions:", await prisma.institution.count());
}

main().finally(() => prisma.$disconnect());
