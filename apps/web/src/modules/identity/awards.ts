/// What an institution actually awards, and how students attend.
/// Pure, so client components can import it without reaching Prisma.

export type Kind = "UNIVERSITY" | "POLYTECHNIC" | "COLLEGE_OF_EDUCATION" | "OTHER";

/// Universities award degrees, never ND or HND. Polytechnics award ND
/// and HND. Colleges of education award NCE.
export function awardsFor(kind: Kind): string[] {
  switch (kind) {
    case "UNIVERSITY":
      // Professional degrees are separate awards, not BSc variants:
      // a medical student picks MBBS, not BSc.
      return ["BSc", "BA", "BEng", "BEd", "LLB", "BTech", "MBBS", "BDS", "BNSc", "PharmD", "BAgric"];
    case "POLYTECHNIC":
      return ["ND", "HND"];
    case "COLLEGE_OF_EDUCATION":
      return ["NCE"];
    default:
      return ["ND", "HND", "NCE", "BSc", "BA", "BEng", "BEd"];
  }
}

/// Study modes differ by institution type. Polytechnics run weekday or
/// evening and weekend part-time. Universities run part-time through
/// evening, weekend, sandwich and distance arrangements — UNILAG's
/// Institute of Continuing Education and Distance Learning Institute
/// are the shape this follows.
export function modesFor(kind: Kind): [string, string][] {
  switch (kind) {
    case "UNIVERSITY":
      return [
        ["FULL_TIME", "Full time"],
        ["PART_TIME_WEEKDAY", "Evening"],
        ["PART_TIME_WEEKEND", "Weekend"],
        ["SANDWICH", "Sandwich"],
        ["DISTANCE", "Distance learning"],
      ];
    case "COLLEGE_OF_EDUCATION":
      return [
        ["FULL_TIME", "Full time"],
        ["PART_TIME_WEEKEND", "Weekend"],
        ["SANDWICH", "Sandwich"],
      ];
    default:
      return [
        ["FULL_TIME", "Full time"],
        ["PART_TIME_WEEKDAY", "Part time"],
        ["PART_TIME_WEEKEND", "Part time (weekend)"],
      ];
  }
}

const LABELS: Record<string, string> = {
  FULL_TIME: "Full time",
  PART_TIME_WEEKDAY: "Part time",
  PART_TIME_WEEKEND: "Part time (weekend)",
  SANDWICH: "Sandwich",
  DISTANCE: "Distance learning",
};

export function modeLabel(kind: Kind, mode: string) {
  const found = modesFor(kind).find(([v]) => v === mode);
  return found ? found[1] : (LABELS[mode] ?? mode);
}

/// Ladder length when a student declares a programme we do not have.
/// Full-time ND and HND run 2 years; part-time runs 3. Degrees run 4,
/// or 5 part-time. A guess, and only affects how many levels are
/// offered — correctable, not corrupting.
export function defaultYears(award: string, mode: string) {
  const diploma = award === "ND" || award === "HND" || award === "NCE";
  const partTime = mode !== "FULL_TIME";
  if (diploma) return partTime ? 3 : award === "NCE" ? 3 : 2;
  return partTime ? 5 : 4;
}
