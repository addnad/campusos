import { Mark } from "./mark";

const COURSE_COLOURS = [
  "--color-grape",
  "--color-aqua",
  "--color-hibiscus",
  "--color-volt",
  "--color-mint",
];

export function Wordmark({ size = "large" }: { size?: "large" | "small" }) {
  const isLarge = size === "large";

  return (
    <div className="inline-block">
      <div className="flex items-center gap-3">
        {/* The mark beside the name, so a student who installs it later
            recognises the icon as the thing they signed up to. */}
        <Mark size={isLarge ? 54 : 22} blink="idle" className="shrink-0" />
        <span
          className={`block font-display leading-none text-ink ${
            isLarge ? "text-6xl sm:text-7xl md:text-8xl" : "text-xl"
          }`}
        >
          CampusOS
        </span>
      </div>
      {isLarge && (
        <div className="mt-6 flex w-full gap-2" aria-hidden>
          <span className="h-1.5 flex-1 rounded-full bg-ink" />
          {COURSE_COLOURS.map((c) => (
            <span
              key={c}
              className="h-1.5 flex-1 rounded-full"
              style={{ background: `var(${c})` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
