import { Mark } from "@/components/ui/mark";

/// The mark says it is CampusOS working; the blocks say where things
/// will land. A centred logo alone loses the shape of the page.
export default function Loading() {
  return (
    <main className="min-h-screen bg-ground px-6 pb-24 pt-8">
      <div className="mx-auto w-full max-w-2xl">
        <div className="flex items-center gap-3">
          <Mark size={26} blink="thinking" />
          <div className="h-3 w-40 rounded-full bg-ink/10" />
        </div>

        <div className="mt-10 animate-pulse">
          <div className="h-10 w-3/4 rounded-full bg-ink/10" />
          <div className="mt-6 h-44 rounded-3xl bg-ink/10" />
          <div className="mt-8 space-y-2">
            <div className="h-20 rounded-2xl bg-ink/10" />
            <div className="h-20 rounded-2xl bg-ink/10" />
            <div className="h-20 rounded-2xl bg-ink/10" />
          </div>
        </div>
      </div>
    </main>
  );
}
