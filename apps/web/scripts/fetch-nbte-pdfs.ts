import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";

/// Downloads every NBTE curriculum. Filenames are hashed, so each is
/// saved under its programme name instead.
const DIR = "../../curricula/nbte";

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70);

async function main() {
  const links: { label: string; url: string }[] = JSON.parse(
    readFileSync(`${DIR}/index.json`, "utf8"),
  );
  mkdirSync(DIR, { recursive: true });

  let got = 0;
  let had = 0;
  let failed = 0;

  for (const l of links) {
    const path = `${DIR}/${slug(l.label)}.pdf`;
    if (existsSync(path)) { had += 1; continue; }

    try {
      const res = await fetch(l.url, {
        headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36" },
      });
      if (!res.ok) { console.log(`FAILED ${l.label} (${res.status})`); failed += 1; continue; }
      writeFileSync(path, Buffer.from(await res.arrayBuffer()));
      got += 1;
      if (got % 20 === 0) console.log(`  ${got} downloaded...`);
    } catch {
      console.log(`FAILED ${l.label}`);
      failed += 1;
    }
  }

  console.log(`\ndownloaded ${got}, already had ${had}, failed ${failed}`);
}

main();
