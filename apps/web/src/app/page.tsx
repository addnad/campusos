"use client";

import { useState } from "react";

const COURSES = [
  ["ember", "ACC223"],
  ["volt", "ACC211"],
  ["fern", "ACC215"],
  ["mint", "ACC217"],
  ["teal", "BAM216"],
  ["aqua", "STA221"],
  ["indigo", "GNS201"],
  ["grape", "ACC219"],
  ["orchid", "BAM224"],
  ["hibiscus", "ACC225"],
] as const;

export default function Home() {
  const [dark, setDark] = useState(false);

  function toggle() {
    setDark((d) => {
      document.documentElement.classList.toggle("dark", !d);
      return !d;
    });
  }

  return (
    <main className="min-h-screen bg-ground p-8">
      <div className="mx-auto max-w-2xl">
        <button
          onClick={toggle}
          className="mb-8 rounded-full border-2 border-ink px-4 py-2 text-sm font-bold text-ink"
        >
          {dark ? "Light" : "Dark"} mode
        </button>

        <h1 className="font-display text-5xl text-ink">CampusOS</h1>
        <p className="mt-2 text-ink">The academic home for students.</p>
        <p className="mt-1 text-muted">Muted text on ground.</p>

        <hr className="my-8 border-rule" />

        <div className="space-y-2">
          {COURSES.map(([token, code]) => (
            <div
              key={code}
              className="flex items-center gap-3 rounded-lg bg-card p-3"
            >
              <span
                className="h-8 w-1.5 rounded-full"
                style={{ background: `var(--color-${token})` }}
              />
              <span className="font-bold text-ink">{code}</span>
              <span className="ml-auto text-sm text-muted">{token}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
