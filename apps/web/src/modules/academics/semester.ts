const WEEK = 86400000 * 7;

/// Two weeks after the profile is created. A student who joins late in a
/// semester knows the date; one who joins early does not benefit from
/// being asked sooner.
const ASK_AFTER = WEEK * 2;

/// How long "I do not know" holds the prompt off.
const UNKNOWN_QUIET = WEEK * 4;

export type Prompt =
  | { kind: "end-date" }
  | { kind: "next-semester"; endsAt: Date }
  | null;

/// What, if anything, to ask this student about their semester. Returns
/// one prompt at a time: a screen that asks two things is a form, and
/// this is meant to be a single tap.
export function semesterPrompt(p: {
  createdAt: Date;
  semesterEndsAt: Date | null;
  nextSemesterAt: Date | null;
  datePromptedAt: Date | null;
  dateUnknownAt: Date | null;
}, now = new Date()): Prompt {
  const age = now.getTime() - p.createdAt.getTime();

  if (!p.semesterEndsAt) {
    if (age < ASK_AFTER) return null;
    if (p.dateUnknownAt && now.getTime() - p.dateUnknownAt.getTime() < UNKNOWN_QUIET) return null;
    // Weekly once dismissed, until answered.
    if (p.datePromptedAt && now.getTime() - p.datePromptedAt.getTime() < WEEK) return null;
    return { kind: "end-date" };
  }

  // A week out from the end, ask what is next so they are set up before
  // the new semester starts rather than after it.
  const untilEnd = p.semesterEndsAt.getTime() - now.getTime();
  if (!p.nextSemesterAt && untilEnd <= WEEK) {
    if (p.datePromptedAt && now.getTime() - p.datePromptedAt.getTime() < WEEK) return null;
    return { kind: "next-semester", endsAt: p.semesterEndsAt };
  }

  return null;
}

/// Whether the next semester has arrived, give or take a couple of days,
/// so the profile rolls over shortly before rather than after.
export function readyToRoll(nextSemesterAt: Date | null, now = new Date()) {
  if (!nextSemesterAt) return false;
  return now.getTime() >= nextSemesterAt.getTime() - 86400000 * 3;
}
