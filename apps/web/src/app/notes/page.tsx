import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { BottomNav } from "@/components/layout/bottom-nav";

export default async function Notes() {
  const session = await auth();
  if (!session?.user) redirect("/signup");
  if (!session.user.handle) redirect("/handle");

  return (
    <main className="min-h-screen bg-ground px-6 pb-24 pt-8">
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="font-display text-4xl uppercase leading-[0.95] text-ink">Notes</h1>
        <p className="mt-4 text-muted">
          Lecture notes, flashcards and a tutor that knows the course you are
          taking. Not built yet.
        </p>
      </div>
      <BottomNav active="/notes" />
    </main>
  );
}
