export const metadata = { title: "Offline" };

export default function Offline() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-ground px-6">
      <div className="w-full max-w-md">
        <h1 className="font-display text-4xl uppercase leading-[0.95] text-ink">No connection</h1>
        <p className="mt-4 text-lg text-muted">
          CampusOS needs the network to show your day. It will be here when you
          are back.
        </p>
      </div>
    </main>
  );
}
