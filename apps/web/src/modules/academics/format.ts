/// Students type "foodtech" and "mr tosin". Normalise on save so shared
/// data reads consistently for everyone who sees it.

const ACRONYMS = new Set(["lt", "lr", "ict", "cbt", "fss", "gns", "gst", "jhb", "sub"]);

const TITLES: Record<string, string> = {
  mr: "Mr.", mrs: "Mrs.", ms: "Ms.", dr: "Dr.", prof: "Prof.",
  engr: "Engr.", barr: "Barr.", rev: "Rev.", chief: "Chief",
  alhaji: "Alhaji", alhaja: "Alhaja", pastor: "Pastor",
};

/// "lt 4" -> "LT 4", "annex b" -> "Annex B"
export function formatVenue(raw: string) {
  const v = raw.trim().replace(/\s+/g, " ");
  if (!v) return null;
  return v
    .split(" ")
    .map((w) => {
      if (ACRONYMS.has(w.toLowerCase())) return w.toUpperCase();
      if (/^[a-z]$/i.test(w)) return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");
}

/// "dr a ogunleye" -> "Dr. A. Ogunleye"
export function formatPerson(raw: string) {
  const v = raw.trim().replace(/\s+/g, " ");
  if (!v) return null;
  return v
    .replace(/\./g, "")
    .split(" ")
    .map((w) => {
      const k = w.toLowerCase();
      if (TITLES[k]) return TITLES[k];
      if (w.length === 1) return `${w.toUpperCase()}.`;
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");
}

/// Sentence case, first letter only: an assignment title is a phrase,
/// not a heading, so title-casing it would look wrong.
export function formatTitle(raw: string) {
  const v = raw.trim().replace(/\s+/g, " ");
  if (!v) return v;
  return v.charAt(0).toUpperCase() + v.slice(1);
}
