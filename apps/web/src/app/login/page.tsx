import Link from "next/link";
import { redirect } from "next/navigation";
import { signIn, auth } from "@/auth";
import { Wordmark } from "@/components/ui/wordmark";

export default async function LogIn() {
  const session = await auth();
  if (session?.user) redirect("/today");

  return (
    <main className="flex min-h-screen items-center justify-center bg-ground px-6">
      <div className="w-full max-w-md">
        <Wordmark size="small" />

        <h1 className="mt-10 font-display text-4xl leading-[1.05] text-ink sm:text-5xl">
          Welcome back.
        </h1>

        <form
          className="mt-10"
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/today" });
          }}
        >
          <button type="submit" className="w-full rounded-full bg-ink px-8 py-4 text-lg font-bold text-ground transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
            Continue with Google
          </button>
        </form>

        <p className="mt-8 text-sm text-muted">
          New here? <Link href="/signup" className="font-bold text-ink underline underline-offset-4">Create an account</Link>
        </p>
      </div>
    </main>
  );
}
