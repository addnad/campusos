"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Inst = { id: string; name: string; shortName: string; state: string | null };

export function SchoolPicker({ institutions }: { institutions: Inst[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");

  const term = q.trim().toLowerCase();
  const shown = term
    ? institutions.filter((i) => i.name.toLowerCase().includes(term) || i.shortName.toLowerCase().includes(term))
    : institutions;

  return (
    <div className="mt-8">
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${institutions.length} schools`} className="w-full rounded-full border-2 border-ink/20 bg-transparent px-5 py-3 text-ink outline-none placeholder:text-ink/40 focus:border-ink" />

      <div className="mt-4 space-y-2">
        {shown.map((i) => (
          <button key={i.id} type="button" onClick={() => router.push(`/onboarding/campus?institution=${i.id}`)} className="flex w-full items-center gap-3 rounded-full bg-cream px-5 py-4 text-left transition-transform active:scale-[0.99]">
            <span className="font-bold text-ink">{i.shortName}</span>
            <span className="truncate text-sm text-ink/60">{i.name}</span>
            {i.state && <span className="ml-auto shrink-0 font-mono text-xs text-ink/50">{i.state}</span>}
          </button>
        ))}
        {shown.length === 0 && (
          <p className="px-2 py-6 text-ink/70">Nothing matching. More schools are being added.</p>
        )}
      </div>
    </div>
  );
}
