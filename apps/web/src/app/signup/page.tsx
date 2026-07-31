import { redirect } from "next/navigation";
import { signIn, auth } from "@/auth";
import { Wordmark } from "@/components/ui/wordmark";

export default async function SignUp() {
  const session = await auth();
  if (session?.user) redirect(session.user.handle ? "/today" : "/handle");

  return (
    <main className="flex min-h-screen items-center justify-center bg-ember px-6">
      <div className="w-full max-w-md">
        <Wordmark size="small" />

        <h1 className="mt-10 font-display text-4xl leading-[1.05] text-ink sm:text-5xl">
          Start here.
        </h1>
        <p className="mt-4 text-lg text-ink/75">
          Your courses, your timetable, your deadlines and the people taking
          them with you.
        </p>

        <form
          className="mt-10"
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/handle" });
          }}
        >
          <button
            type="submit"
            className="w-full rounded-full bg-ink px-8 py-4 text-lg font-bold text-ground transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            Continue with Google
          </button>
        </form>

        <p className="mt-6 text-sm text-ink/60">
          Email sign up is coming next.
        </p>
      </div>
    </main>
  );
}
