import { writeFileSync } from "node:fs";

/// Pulls the university list from Wikipedia's table and writes JSON.
/// Run locally: the page is a few hundred rows, which is worth parsing
/// once rather than fetching school by school.

type Uni = { name: string; abbr: string; state: string; location: string; funding: string };

const SOURCE = "https://en.wikipedia.org/wiki/List_of_universities_in_Nigeria";

function cells(row: string) {
  return [...row.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((m) =>
    m[1]
      .replace(/<sup[\s\S]*?<\/sup>/g, "")
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&#\d+;/g, "")
      .replace(/\[\d+\]/g, "")
      .trim(),
  );
}

async function main() {
  const html = await (await fetch(SOURCE)).text();
  const rows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((m) => cells(m[1]));

  const unis: Uni[] = [];
  for (const c of rows) {
    // Name, State, Abbreviation, Location, Funding, Founded
    if (c.length < 5) continue;
    const [name, state, abbr, location, funding] = c;
    if (!name || !/univers|college/i.test(name)) continue;
    if (!/federal|state|private/i.test(funding ?? "")) continue;
    unis.push({ name, abbr, state, location, funding });
  }

  const seen = new Set<string>();
  const unique = unis.filter((u) => {
    const k = u.name.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  console.log(`found ${unique.length} universities`);
  for (const u of unique.slice(0, 10)) console.log(`  ${u.abbr || "—"}  ${u.name} (${u.state}, ${u.funding})`);

  writeFileSync("../../curricula/universities.json", JSON.stringify(unique, null, 2));
  console.log("\nwrote curricula/universities.json");
}

main();
