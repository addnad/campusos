import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { courseFor, clock, dayName } from "@/modules/academics/course";
import { BottomNav } from "@/components/layout/bottom-nav";
import { AddClass, AddAssessment } from "./add-forms";
import { Suggestions } from "./suggestions";
import { suggestionsFor } from "@/modules/academics/suggestions";
import { Remove } from "./remove";

function due(d: Date) {
  const days = Math.ceil((d.getTime() - Date.now()) / 86400000);
  if (days < 0) return { text: "Late", tone: "bg-alarm text-ground" };
  if (days === 0) return { text: "Today", tone: "bg-ink text-ground" };
  if (days === 1) return { text: "Tomorrow", tone: "bg-sunken text-ink" };
  return { text: `In ${days} days`, tone: "bg-sunken text-ink" };
}

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/signup");
  if (!session.user.handle) redirect("/handle");

  const { id } = await params;
  const data = await courseFor(session.user.id, id);
  if (!data) notFound();

  const { enrolment, course, assessments, profile } = data;
  const suggested = await suggestionsFor(profile.id, [course.id]);
  const colour = `var(--color-${enrolment.colourToken})`;
  const open = assessments.filter((a) => a.state === "PENDING" && a.dueAt.getTime() > Date.now() - 86400000).length;

  return (
    <main className="min-h-screen bg-ground pb-24">
      <header className="px-6 pb-8 pt-8" style={{ background: colour }}>
        <div className="mx-auto w-full max-w-2xl">
          <Link href="/today" className="font-mono text-xs uppercase tracking-widest text-ink/70">&larr; Today</Link>
          <p className="mt-6 font-mono text-xs uppercase tracking-widest text-ink/70">
            {profile.level} &middot; {profile.semester === 1 ? "1st" : "2nd"} Semester &middot; {enrolment.units} Units
          </p>
          <h1 className="mt-1 font-display text-4xl uppercase leading-none text-ink">{course.displayCode}</h1>
          <p className="mt-1 text-lg text-ink/80">{course.title}</p>
        </div>
      </header>

      <div className="mx-auto w-full max-w-2xl px-6">
        <nav className="flex gap-6 border-b-2 border-ink/10 pt-6">
          <span className="border-b-2 border-ink pb-3 font-display text-sm uppercase text-ink">Work</span>
          <span className="pb-3 font-display text-sm uppercase text-muted">Notes</span>
          <span className="pb-3 font-display text-sm uppercase text-muted">Community</span>
        </nav>

        <section className="mt-8">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-lg uppercase text-ink">Class times</h2>
            <span className="font-mono text-xs uppercase tracking-widest text-muted">{course.sessions.length === 0 ? "None yet" : course.sessions.length === 1 ? "Once a week" : `${course.sessions.length} a week`}</span>
          </div>

          <ul className="mt-3 space-y-2">
            {course.sessions.map((s) => (
              <li key={s.id} className="flex items-center gap-4 rounded-2xl bg-card p-4"><span className="contents">
                <span className="w-12 shrink-0 font-mono text-sm font-bold uppercase text-ink">{dayName(s.weekday)}</span>
                <span className="min-w-0">
                  <span className="block font-bold text-ink">{clock(s.startsAt)} &ndash; {clock(s.endsAt)}</span>
                  {(s.venue || s.lecturer) && (
                    <span className="block truncate text-sm text-muted">{[s.venue, s.lecturer].filter(Boolean).join(" \u00b7 ")}</span>
                  )}
                </span>
                </span><Remove id={s.id} courseId={course.id} kind="session" label={`${dayName(s.weekday)} class`} />
              </li>
            ))}
          </ul>

          {course.sessions.length === 0 && (
            <p className="mt-3 text-muted">No class times yet. Add them and they appear on Today.</p>
          )}

          <AddClass courseId={course.id} />
        </section>

        <section className="mt-10">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-lg uppercase text-ink">Submissions</h2>
            <span className="font-mono text-xs uppercase tracking-widest text-muted">{open} open</span>
          </div>

          <ul className="mt-3 space-y-2">
            {assessments.map((a) => {
              const d = due(a.dueAt);
              return (
                <li key={a.id} className="flex items-center gap-4 rounded-2xl bg-card p-4">
                  <span className="min-w-0">
                    <span className="block font-bold text-ink">{a.title}</span>
                    <span className="block text-sm text-muted">
                      {a.dueAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} &middot; {a.kind.toLowerCase()}
                      {a.isPrivate ? " \u00b7 only you" : ""}
                    </span>
                  </span>
                  <span className={`ml-auto shrink-0 rounded-full px-3 py-1 font-mono text-xs uppercase ${a.state === "DONE" ? "bg-sunken text-muted" : d.tone}`}>
                    {a.state === "DONE" ? "Done" : d.text}
                  </span>
                  <Remove id={a.id} courseId={course.id} kind="assessment" label={a.title} />
                </li>
              );
            })}
          </ul>

          {assessments.length === 0 && (
            <p className="mt-3 text-muted">Nothing due. Adding one shares it with everyone taking {course.displayCode}.</p>
          )}

          <AddAssessment courseId={course.id} />
        </section>

        <Suggestions courseId={course.id} classes={suggested.classes} assessments={suggested.assessments} />
      </div>

      <BottomNav active="/courses" />
    </main>
  );
}
