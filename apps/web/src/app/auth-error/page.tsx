import Link from "next/link";
import { Wordmark } from "@/components/ui/wordmark";

/// Auth.js calls a failed database call a configuration error, which
/// tells a student the app is broken and gives them no reason to try
/// again. Almost always it is the database waking up.
export default async function AuthError({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const denied = error === "AccessDenied";

  return (
    <main className="flex min-h-screen items-center justify-center bg-ground px-6">
      <div className="w-full max-w-md">
        <Wordmark size="small" />

        <h1 className="mt-10 font-display text-4xl uppercase leading-[0.95] text-ink">
          {denied ? "Could not sign you in" : "Give that another go"}
        </h1>

        <p className="mt-4 text-lg text-ink/75">
          {denied
            ? "That account could not be signed in. Try a different one."
            : "Something did not respond in time. It usually works on the second try."}
        </p>

        <Link href="/login" className="mt-8 inline-flex rounded-full bg-ink px-8 py-4 text-lg font-bold text-ground hover:opacity-80">
          Try again
        </Link>
      </div>
    </main>
  );
}
