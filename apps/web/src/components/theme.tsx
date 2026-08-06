"use client";

import { useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

const KEY = "campusos-theme";

function apply(theme: Theme) {
  const dark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

export function useTheme() {
  // Read on first render, not in an effect: initialising to "system" and
  // correcting afterwards means the stored choice is forgotten on every
  // navigation, and the theme flips back for a moment each time.
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "system";
    return (localStorage.getItem(KEY) as Theme | null) ?? "system";
  });

  useEffect(() => {
    apply(theme);
    localStorage.setItem(KEY, theme);

    // Follow the system if that is what they chose: a phone that
    // switches at dusk should take the app with it.
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  return { theme, setTheme };
}

export function ThemeChoice() {
  const { theme, setTheme } = useTheme();

  const options: { value: Theme; label: string }[] = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "system", label: "System" },
  ];

  return (
    <div className="flex gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => setTheme(o.value)}
          className={`flex-1 rounded-full px-4 py-3 text-sm font-bold transition-transform active:scale-[0.98] ${
            theme === o.value ? "bg-ink text-ground" : "bg-card text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
