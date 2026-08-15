import { writeFileSync, mkdirSync, existsSync } from "node:fs";

/// NBTE publishes one PDF per programme with a hashed filename, so there
/// is no URL pattern to guess — the index has to be read first.
const INDEX = "https://www.digitalnbte.nbte.gov.ng/Public/PUCCurriculum";
const OUT = "../../curricula/nbte";

async function main() {
  const html = await (await fetch(INDEX)).text();

  // The programme name sits in the same table row as the link, so the
  // whole row is what to match — the link text is just "Download".
  const links = [...html.matchAll(
    /<tr>\s*<td>\d+<\/td>\s*<td>([^<]+)<\/td>[\s\S]*?href="([^"]+\.pdf)"/g,
  )].map((m) => ({
    label: m[1].replace(/\s+/g, " ").trim(),
    url: m[2],
  }));

  console.log(`found ${links.length} curriculum links`);
  if (links.length === 0) {
    // The list may be rendered client-side; dump a slice so we can see.
    console.log(html.slice(0, 1200));
    return;
  }

  for (const l of links.slice(0, 15)) console.log(`  ${l.label}`);

  mkdirSync(OUT, { recursive: true });
  writeFileSync(`${OUT}/index.json`, JSON.stringify(links, null, 2));
  console.log(`\nwrote ${OUT}/index.json`);
}

main();
