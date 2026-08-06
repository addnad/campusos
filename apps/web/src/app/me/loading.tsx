export default function Loading() {
  return (
    <main className="min-h-screen bg-ground px-6 pb-24 pt-8">
      <div className="mx-auto w-full max-w-2xl animate-pulse">
        <div className="h-3 w-40 rounded-full bg-ink/10" />
        <div className="mt-3 h-5 w-56 rounded-full bg-ink/10" />
        <div className="mt-10 h-10 w-3/4 rounded-full bg-ink/10" />
        <div className="mt-6 h-44 rounded-3xl bg-ink/10" />
        <div className="mt-6 space-y-2">
          <div className="h-20 rounded-2xl bg-ink/10" />
          <div className="h-20 rounded-2xl bg-ink/10" />
          <div className="h-20 rounded-2xl bg-ink/10" />
        </div>
      </div>
    </main>
  );
}
