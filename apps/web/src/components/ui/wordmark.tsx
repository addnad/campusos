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
      <span
        className={`block font-display leading-none text-ink ${
          isLarge ? "text-6xl sm:text-7xl md:text-8xl" : "text-xl"
        }`}
      >
        CampusOS
      </span>
      {isLarge && (
        <div className="mt-3 flex gap-2" aria-hidden>
          <span className="h-1.5 w-14 rounded-full bg-ink" />
          {COURSE_COLOURS.map((c) => (
            <span
              key={c}
              className="h-1.5 w-14 rounded-full"
              style={{ background: `var(${c})` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
