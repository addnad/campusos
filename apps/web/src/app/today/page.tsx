import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Wordmark } from "@/components/ui/wordmark";

export default async function Today() {
  const session = await auth();
  if (!session?.user) redirect("/signup");
  if (!session.user.handle) redirect("/handle");

  const profile = await prisma.studentProfile.findFirst({
    where: { userId: session.user.id, isActive: true },
    include: {
      programme: { include: { institution: true } },
      enrolments: { include: { course: true } },
    },
  });

  return (
    <main className="min-h-screen bg-ground px-6 py-12">
      <div className="mx-auto w-full max-w-2xl">
        <header className="flex items-center justify-between">
          <Wordmark size="small" />
          <span className="font-display text-lg text-ink">
            @{session.user.handle}
          </span>
        </header>

        {!profile ? (
          <section className="mt-16">
            <h1 className="font-display text-4xl leading-[1.05] text-ink">
              What are you studying?
            </h1>
            <p className="mt-4 text-ink/70">
              Tell us your school and programme once, and your courses,
              timetable and deadlines follow.
            </p>
            <Link href="/onboarding" className="mt-8 inline-flex rounded-full bg-ink px-8 py-4 text-lg font-bold text-ground hover:opacity-80">Set up my courses</Link>
          </section>
        ) : (
          <section className="mt-16">
            <p className="font-mono text-sm uppercase tracking-widest text-muted">
              {profile.programme.institution.shortName} &middot;{" "}
              {profile.level} &middot; Semester {profile.semester}
            </p>
            <h1 className="mt-2 font-display text-4xl leading-[1.05] text-ink">
              {profile.enrolments.length} courses
            </h1>
            <ul className="mt-8 space-y-2">
              {profile.enrolments.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center gap-3 rounded-lg bg-card p-3"
                >
                  <span
                    className="h-8 w-1.5 rounded-full"
                    style={{ background: `var(--color-${e.colourToken})` }}
                  />
                  <span className="font-bold text-ink">
                    {e.course.displayCode}
                  </span>
                  <span className="text-ink/70">{e.course.title}</span>
                  <span className="ml-auto font-mono text-sm text-muted">
                    {e.units}u
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <form
          className="mt-16"
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="text-sm font-bold text-muted underline underline-offset-4 hover:text-ink"
          >
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
