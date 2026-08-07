import { writeFileSync, mkdirSync, existsSync } from "node:fs";

/// NBTE publishes one PDF per programme with a hashed filename, so there
/// is no URL pattern to guess — the index has to be read first.
const INDEX = "https://www.digitalnbte.nbte.gov.ng/Public/PUCCurriculum";
const OUT = "../../curricula/nbte";

async function main() {
  const html = await (await fetch(INDEX)).text();

  // Links to the curriculum PDFs, with whatever text labels them.
  const links = [...html.matchAll(
    /<a[^>]+href="([^"]*DownloadCurriculum\/[^"]+\.pdf)"[^>]*>([\s\S]*?)<\/a>/gi,
  )].map((m) => ({
    url: m[1].startsWith("http") ? m[1] : `https://www.digitalnbte.nbte.gov.ng${m[1]}`,
    label: m[2].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim(),
  }));

  console.log(`found ${links.length} curriculum links`);
  if (links.length === 0) {
    // The list may be rendered client-side; dump a slice so we can see.
    console.log(html.slice(0, 1200));
    return;
  }

  for (const l of links.slice(0, 10)) console.log(`  ${l.label || "(no label)"}`);

  mkdirSync(OUT, { recursive: true });
  writeFileSync(`${OUT}/index.json`, JSON.stringify(links, null, 2));
  console.log(`\nwrote ${OUT}/index.json`);
}

main();
