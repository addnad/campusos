import type { CSSProperties } from "react";

const LETTERS = "CampusOS".split("");

// Scatter per letter: offset and rotation it arrives from. Fixed rather
// than random so the motion is the same every time and can be tuned.
const FROM = [
  "translate(-34px, 26px) rotate(-19deg)",
  "translate(22px, -30px) rotate(14deg)",
  "translate(-18px, -24px) rotate(9deg)",
  "translate(30px, 22px) rotate(-11deg)",
  "translate(-26px, -18px) rotate(17deg)",
  "translate(16px, 28px) rotate(-8deg)",
  "translate(-30px, 20px) rotate(12deg)",
  "translate(24px, -26px) rotate(-15deg)",
];

const BARS = ["--color-ink", "--color-grape", "--color-aqua", "--color-hibiscus", "--color-volt", "--color-mint"];

export function WordmarkAnimated() {
  return (
    <div className="inline-block">
      <span className="flex font-display text-6xl leading-none text-ink sm:text-7xl md:text-8xl">
        {LETTERS.map((l, i) => (
          <span key={`${l}-${i}`} className="snap inline-block" style={{ "--from": FROM[i], animationDelay: `${i * 55}ms` } as CSSProperties}>{l}</span>
        ))}
      </span>
      <div className="mt-6 flex w-full gap-2" aria-hidden>
        {BARS.map((c, i) => (
          <span key={c} className="snap h-1.5 flex-1 rounded-full" style={{ background: `var(${c})`, "--from": "translateY(14px) scaleX(0.3)", animationDelay: `${250 + i * 60}ms` } as CSSProperties} />
        ))}
      </div>
    </div>
  );
}
