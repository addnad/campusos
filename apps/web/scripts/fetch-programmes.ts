import { writeFileSync, mkdirSync } from "node:fs";

/// Programme lists per university. No national source exists for which
/// school runs what, so this reads the course-list pages students
/// already use. Parsed locally: 114 programmes for one school is more
/// than a conversation should carry.

const SCHOOLS: { shortName: string; url: string }[] = [
  { shortName: "ABU", url: "https://myschoolgist.com/news/abu-courses/" },
  { shortName: "UI", url: "https://myschoolgist.com/news/ui-courses/" },
  { shortName: "UNN", url: "https://myschoolgist.com/news/unn-courses/" },
  { shortName: "OAU", url: "https://myschoolgist.com/news/oau-courses/" },
  { shortName: "LASU", url: "https://myschoolgist.com/news/lasu-courses/" },
  { shortName: "UNIBEN", url: "https://myschoolgist.com/news/uniben-courses/" },
  { shortName: "UNIPORT", url: "https://myschoolgist.com/news/uniport-courses/" },
  { shortName: "FUTA", url: "https://myschoolgist.com/news/futa-courses/" },
  { shortName: "BUK", url: "https://myschoolgist.com/news/buk-courses/" },
  { shortName: "UNILORIN", url: "https://myschoolgist.com/news/unilorin-courses/" },
];

/// A programme name: title case, no stray punctuation, not a heading or
/// a navigation item.
// The lists are ALL CAPS, so case is no signal — length and character
// set are what separate a programme from a navigation item.
const PLAUSIBLE = /^[A-Za-z][A-Za-z ,&()/'.-]{4,70}$/;

/// "ACCOUNTANCY/ACCOUNTING" -> "Accountancy/Accounting"
function titleCase(s: string) {
  return s
    .toLowerCase()
    .replace(/\b([a-z])/g, (m) => m.toUpperCase())
    .replace(/\b(And|Of|The|In|With|For)\b/g, (m) => m.toLowerCase());
}
const REJECT = /(course|admission|jamb|utme|cut off|apply|click|read|university|faculty|list of|post|news|school fees|requirement|prepare|download|app|software)/i;

async function main() {
  mkdirSync("../../curricula/programmes", { recursive: true });

  for (const s of SCHOOLS) {
    try {
      const html = await (await fetch(s.url, {
        headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36" },
      })).text();

      // The courses live in one specific list; every other <li> on the
      // page is navigation or inlined CSS.
      const block = /<ul[^>]*class="[^"]*oneli[^"]*"[^>]*>([\s\S]*?)<\/ul>/i.exec(html);
      const scope = block ? block[1] : "";

      const items = [...scope.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
        .map((m) => m[1].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim())
        .filter((t) => PLAUSIBLE.test(t) && !REJECT.test(t));

      const unique = [...new Set(items.map(titleCase))].sort();
      console.log(`${s.shortName}: ${unique.length} candidates`);
      for (const u of unique.slice(0, 8)) console.log(`   ${u}`);

      writeFileSync(`../../curricula/programmes/${s.shortName}.json`, JSON.stringify(unique, null, 2));
    } catch (e) {
      console.log(`${s.shortName}: failed — ${(e as Error).message}`);
    }
  }
}

main();
