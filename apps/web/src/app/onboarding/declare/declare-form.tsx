"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Option = { programmeId: string; level: string; label: string };

export function DeclareForm({ options, institutionId }: { options: Option[]; institutionId: string }) {
  const router = useRouter();
  const [chosen, setChosen] = useState<Option | null>(null);
  const [semester, setSemester] = useState<1 | 2>(1);
  const [q, setQ] = useState("");
  const [searching, setSearching] = useState(false);

  const term = q.trim().toLowerCase();
  const list = searching && term ? options.filter((o) => o.label.toLowerCase().includes(term)) : options.slice(0, 6);

  function go() {
    if (!chosen) return;
    const p = new URLSearchParams({ institution: institutionId, programme: chosen.programmeId, level: chosen.level, semester: String(semester) });
    router.push(`/onboarding/confirm?${p.toString()}`);
  }

  return (
    <div className="mt-8">
      <div className="space-y-3">
        {list.map((o) => {
          const on = chosen?.programmeId === o.programmeId && chosen?.level === o.level;
          return (
            <button key={`${o.programmeId}-${o.level}`} type="button" onClick={() => setChosen(o)} className={`flex w-full items-center gap-3 rounded-full px-6 py-4 text-left font-bold transition-transform active:scale-[0.99] ${on ? "bg-ink text-ground" : "bg-cream text-ink"}`}>
              <span>{o.label}</span>
              {on && <span className="ml-auto text-lg">&#10003;</span>}
            </button>
          );
        })}
      </div>

      {options.length > 6 && !searching && (
        <button type="button" onClick={() => setSearching(true)} className="mt-3 w-full rounded-full border-2 border-dashed border-ink/40 px-6 py-4 text-left text-ink/70">Search all {options.length} programmes</button>
      )}

      {searching && (
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search programmes" className="mt-3 w-full rounded-full border-2 border-ink/30 bg-transparent px-6 py-4 text-ink outline-none placeholder:text-ink/40 focus:border-ink" />
      )}

      {options.length === 0 && (
        <p className="rounded-2xl bg-ink/10 px-5 py-4 text-ink/80">No programmes here yet. Adding your own is coming next.</p>
      )}

      <p className="mt-8 font-mono text-xs uppercase tracking-widest text-ink/60">Semester</p>
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={() => setSemester(1)} className={`flex-1 rounded-full px-4 py-3 font-bold transition-transform active:scale-[0.99] ${semester === 1 ? "bg-ink text-ground" : "bg-cream text-ink"}`}>First</button>
        <button type="button" onClick={() => setSemester(2)} className={`flex-1 rounded-full px-4 py-3 font-bold transition-transform active:scale-[0.99] ${semester === 2 ? "bg-ink text-ground" : "bg-cream text-ink"}`}>Second</button>
      </div>

      <button type="button" onClick={go} disabled={!chosen} className="mt-10 w-full rounded-full bg-ink px-8 py-5 text-lg font-bold text-ground transition-opacity disabled:opacity-30">That is me &rarr;</button>
      <p className="mt-3 text-center text-sm text-ink/60">You can change this later.</p>
    </div>
  );
}
