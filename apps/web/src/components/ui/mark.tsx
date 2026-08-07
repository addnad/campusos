"use client";

/// The mark, with the eyes as their own elements so they can blink. The
/// two dots are the whole character: closing them reads as resting, and
/// that is the difference between a loading state that feels like the
/// app and one that feels like a spinner.
export function Mark({ size = 44, blink = "idle", className = "" }: {
  size?: number;
  /// idle: an occasional blink. thinking: a steady one. asleep: closed.
  blink?: "idle" | "thinking" | "asleep" | "none";
  className?: string;
}) {
  const eye =
    blink === "asleep" ? "mark-eye-shut"
    : blink === "thinking" ? "mark-eye-thinking"
    : blink === "idle" ? "mark-eye-idle"
    : "";

  return (
    <svg
      viewBox="8 6 44 52"
      width={size}
      height={(size / 44) * 52}
      role="img"
      aria-label="CampusOS"
      className={className}
    >
      <rect x="8" y="10" width="44" height="19" rx="9.5" fill="#A83000" />
      <rect x="8" y="6" width="44" height="19" rx="9.5" fill="#FF5A0F" />
      <circle className={eye} cx="24" cy="15" r="3.1" fill="#1B1206" style={{ transformOrigin: "24px 15px" }} />
      <circle className={eye} cx="36" cy="15" r="3.1" fill="#1B1206" style={{ transformOrigin: "36px 15px" }} />
      <rect x="14" y="34" width="36" height="10" rx="5" fill="#4A0FB0" />
      <rect x="14" y="30" width="36" height="10" rx="5" fill="#7A2BFF" />
      <rect x="10" y="48" width="42" height="10" rx="5" fill="#7FA300" />
      <rect x="10" y="44" width="42" height="10" rx="5" fill="#BFF223" />
    </svg>
  );
}
