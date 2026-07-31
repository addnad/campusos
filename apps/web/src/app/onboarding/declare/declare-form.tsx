"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Programme = { id: string; name: string; award: string };

export function DeclareForm({ levels, programmes, institutionId }: { levels: string[]; programmes: Programme[]; institutionId: string }) {
  const router = useRouter();
  const [level, setLevel] = useState<string | null>(null);
  const [programmeId, setProgrammeId] = useState<string | null>(null);
  const [semester, setSemester] = useState<1 | 2 | null>(null);
  const [q, setQ] = useState("");
  const [searching, setSearching] = useState(false);

  // A level belongs to an award ladder: ND I only makes sense for ND
  // programmes. Picking the level narrows the programmes shown.
  const award = level?.startsWith("ND") ? "ND" : level?.startsWith("HND") ? "HND" : level?.startsWith("NCE") ? "NCE" : null;
  const relevant = award ? programmes.filter((p) => p.award === award) : programmes.filter((p) => !["ND", "HND", "NCE"].includes(p.award));

  const term = q.trim().toLowerCase();
  const filtered = searching && term ? relevant.filter((p) => p.name.toLowerCase().includes(term)) : relevant.slice(0, 6);

  function pickLevel(l: string) {
    setLevel(l);
    setProgrammeId(null);
    setSemester(null);
    setSearching(false);
    setQ("");
  }

  function go() {
    if (!level || !programmeId || !semester) return;
    const p = new URLSearchParams({ institution: institutionId, programme: programmeId, level, semester: String(semester) });
    router.push(`/onboarding/confirm?${p.toString()}`);
  }

  const pill = "flex w-full items-center gap-3 rounded-full px-6 py-4 text-left font-bold transition-transform active:scale-[0.99]";
  const on = "bg-ink text-ground";
  const off = "bg-cream text-ink";

  return (
    <div className="mt-8">
      <p className="font-mono text-xs uppercase tracking-widest text-ink/60">Level</p>
      <div className="mt-2 space-y-2">
        {levels.map((l) => (
          <button key={l} type="button" onClick={() => pickLevel(l)} className={`${pill} ${level === l ? on : off}`}>
            <span>{l}</span>
            {level === l && <span className="ml-auto text-lg">&#10003;</span>}
          </button>
        ))}
      </div>

      {level && (
        <>
          <p className="mt-8 font-mono text-xs uppercase tracking-widest text-ink/60">Programme</p>
          <div className="mt-2 space-y-2">
            {filtered.map((p) => (
              <button key={p.id} type="button" onClick={() => setProgrammeId(p.id)} className={`${pill} ${programmeId === p.id ? on : off}`}>
                <span>{p.name}</span>
                {programmeId === p.id && <span className="ml-auto text-lg">&#10003;</span>}
              </button>
            ))}
            {relevant.length === 0 && <p className="rounded-2xl bg-ink/10 px-5 py-4 text-ink/80">No {award ?? "degree"} programmes here yet.</p>}
          </div>

          {relevant.length > 6 && !searching && (
            <button type="button" onClick={() => setSearching(true)} className="mt-2 w-full rounded-full border-2 border-dashed border-ink/40 px-6 py-4 text-left text-ink/70">Search all {relevant.length} programmes</button>
          )}
          {searching && (
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search programmes" className="mt-2 w-full rounded-full border-2 border-ink/30 bg-transparent px-6 py-4 text-ink outline-none placeholder:text-ink/40 focus:border-ink" />
          )}
        </>
      )}

      {level && programmeId && (
        <>
          <p className="mt-8 font-mono text-xs uppercase tracking-widest text-ink/60">Semester</p>
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={() => setSemester(1)} className={`flex-1 rounded-full px-4 py-4 font-bold transition-transform active:scale-[0.99] ${semester === 1 ? on : off}`}>First</button>
            <button type="button" onClick={() => setSemester(2)} className={`flex-1 rounded-full px-4 py-4 font-bold transition-transform active:scale-[0.99] ${semester === 2 ? on : off}`}>Second</button>
          </div>
        </>
      )}

      <button type="button" onClick={go} disabled={!level || !programmeId || !semester} className="mt-10 w-full rounded-full bg-ink px-8 py-5 text-lg font-bold text-ground transition-opacity disabled:opacity-30">That is me &rarr;</button>
      <p className="mt-3 text-center text-sm text-ink/60">You can change this later.</p>
    </div>
  );
}
