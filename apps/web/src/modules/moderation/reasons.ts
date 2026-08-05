/// Categories rather than free text: they can be counted, and they need
/// different responses. "Wrong information" is specific to a course room
/// — a wrong submission date is not abuse, but forty people may plan
/// around it.
export const REPORT_REASONS = [
  { key: "harassment", label: "Harassment or bullying" },
  { key: "sexual", label: "Sexual content" },
  { key: "spam", label: "Spam or scam" },
  { key: "wrong", label: "Wrong or misleading information" },
  { key: "offtopic", label: "Off topic for this course" },
  { key: "other", label: "Something else" },
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number]["key"];

export function reasonLabel(key: string | null) {
  return REPORT_REASONS.find((r) => r.key === key)?.label ?? "Not given";
}
