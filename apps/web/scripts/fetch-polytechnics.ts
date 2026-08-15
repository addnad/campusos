import { writeFileSync } from "node:fs";

/// Pulls the university list from Wikipedia's table and writes JSON.
/// Run locally: the page is a few hundred rows, which is worth parsing
/// once rather than fetching school by school.

type Uni = { name: string; abbr: string; state: string; location: string; funding: string };

const SOURCE = "https://en.wikipedia.org/wiki/List_of_polytechnics_in_Nigeria";

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

  // Four columns here — name, state, town, website — where the
  // universities table had six including an abbreviation.
  const unis: Uni[] = [];
  for (const c of rows) {
    if (c.length < 3) continue;
    const [name, state, location] = c;
    if (!name || !/polytechnic|institute of technology|college of technology/i.test(name)) continue;
    if (/^(name|institution)$/i.test(name)) continue;
    unis.push({ name, abbr: "", state: state.replace(/\s*State$/i, "").trim(), location, funding: "" });
  }

  const seen = new Set<string>();
  const unique = unis.filter((u) => {
    const k = u.name.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  console.log(`found ${unique.length} polytechnics`);
  for (const u of unique.slice(0, 10)) console.log(`  ${u.abbr || "—"}  ${u.name} (${u.state}, ${u.funding})`);

  writeFileSync("../../curricula/polytechnics.json", JSON.stringify(unique, null, 2));
  console.log("\nwrote curricula/polytechnics.json");
}

main();
