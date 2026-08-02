import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { semesterFor } from "@/modules/academics/queries";
import { BottomNav } from "@/components/layout/bottom-nav";
import { modeLabel, type Kind } from "@/modules/identity/awards";

function today() {
  const d = new Date();
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }).toUpperCase();
}

export default async function Today() {
  const session = await auth();
  if (!session?.user) redirect("/signup");
  if (!session.user.handle) redirect("/handle");

  const profile = await semesterFor(session.user.id);

  if (!profile) {
    return (
      <main className="min-h-screen bg-ground px-6 py-12">
        <div className="mx-auto w-full max-w-2xl">
          <h1 className="font-display text-4xl uppercase leading-[0.95] text-ink">What are you studying?</h1>
          <p className="mt-4 text-ink/70">Tell us your school and programme once, and your courses follow.</p>
          <Link href="/onboarding" className="mt-8 inline-flex rounded-full bg-ink px-8 py-4 text-lg font-bold text-ground hover:opacity-80">Set up my courses</Link>
        </div>
      </main>
    );
  }

  const { programme, enrolments } = profile;
  const units = enrolments.reduce((n, e) => n + e.units, 0);
  const initials = (session.user.handle ?? "").slice(0, 2).toUpperCase();
  const multiCampus = programme.campus.name !== "Main Campus";
  const mode = modeLabel(programme.institution.kind as Kind, programme.studyMode);

  return (
    <main className="min-h-screen bg-ground px-6 pb-24 pt-8">
      <div className="mx-auto w-full max-w-2xl">
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate font-mono text-xs uppercase tracking-widest text-muted">
              {programme.institution.name}{multiCampus ? ` \u00b7 ${programme.campus.name}` : ""}
            </p>
            <p className="mt-1 truncate font-bold text-ink">
              @{session.user.handle} &middot; {profile.level} {programme.name}
            </p>
          </div>
          <Link href="/me" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink font-display text-sm text-ground">{initials}</Link>
        </header>

        <p className="mt-8 font-mono text-xs uppercase tracking-widest text-muted">
          {today()} &middot; {profile.semester === 1 ? "First" : "Second"} Semester
        </p>

        <h1 className="mt-2 font-display text-4xl uppercase leading-[0.95] text-ink sm:text-5xl">
          {enrolments.length} {enrolments.length === 1 ? "course" : "courses"}
          <br />
          {units} units
        </h1>

        <section className="mt-10">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-xl uppercase text-ink">Your courses</h2>
            <span className="font-mono text-xs uppercase tracking-widest text-muted">{mode}</span>
          </div>

          <ul className="mt-3 space-y-2">
            {enrolments.map((e) => (
              <li key={e.id}>
                <Link href={`/courses/${e.courseId}`} className="flex items-center gap-4 rounded-2xl bg-card p-4 transition-transform active:scale-[0.99]">
                  <span className="h-10 w-1.5 shrink-0 rounded-full" style={{ background: `var(--color-${e.colourToken})` }} />
                  <span className="min-w-0">
                    <span className="block font-bold text-ink">{e.course.displayCode}</span>
                    <span className="block truncate text-sm text-muted">{e.course.title}</span>
                  </span>
                  <span className="ml-auto shrink-0 font-mono text-sm text-muted">{e.units}u</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10 rounded-2xl border-2 border-dashed border-ink/20 p-5">
          <p className="font-mono text-xs uppercase tracking-widest text-muted">Coming next</p>
          <p className="mt-2 text-ink/70">
            Your timetable and deadlines appear here once you add them. Tap a course to get started.
          </p>
        </section>
      </div>

      <BottomNav active="/today" />
    </main>
  );
}
