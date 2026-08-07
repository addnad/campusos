import Link from "next/link";
import { redirect } from "next/navigation";
import { signIn, auth } from "@/auth";
import { GoogleMark } from "@/components/ui/google-mark";
import { Wordmark } from "@/components/ui/wordmark";

export default async function SignUp() {
  const session = await auth();
  if (session?.user) redirect("/today");

  return (
    <main className="flex min-h-screen items-center justify-center bg-ground px-6">
      <div className="w-full max-w-md">
        <Wordmark size="small" />

        <h1 className="mt-10 font-display text-4xl leading-[1.05] text-ink sm:text-5xl">
          Start here.
        </h1>
        <p className="mt-4 text-lg text-muted">
          Your courses, your timetable, your deadlines and the people taking
          them with you.
        </p>

        <form
          className="mt-10"
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/today" });
          }}
        >
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-3 rounded-full bg-ink px-8 py-4 text-lg font-bold text-ground transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <GoogleMark size={22} />
            Continue with Google
          </button>
        </form>

        <p className="mt-8 text-sm text-muted">
          Already have an account? <Link href="/login" className="font-bold text-ink underline underline-offset-4">Log in</Link>
        </p>
      </div>
    </main>
  );
}
