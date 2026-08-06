import Link from "next/link";

export function OnboardingShell({ step, total, ground, title, sub, back, children }: { step: number; total: number; ground: string; title: string; sub?: string; back?: string; children: React.ReactNode }) {
  return (
    <main className={`min-h-screen ${ground} px-6 py-8`}>
      <div className="mx-auto w-full max-w-lg">
        <header className="flex items-baseline justify-between">
          <span className="font-display text-lg uppercase tracking-tight text-ink">CampusOS</span>
          <span className="label text-ink/60">{step} of {total}</span>
        </header>

        <h1 className="mt-10 font-display text-5xl uppercase leading-[0.95] text-ink sm:text-6xl">{title}</h1>
        {sub && <p className="mt-3 text-ink/80">{sub}</p>}

        {children}

        {back && <Link href={back} className="mt-8 inline-block text-sm font-bold text-ink/60 underline underline-offset-4 hover:text-ink">Back</Link>}
      </div>
    </main>
  );
}
