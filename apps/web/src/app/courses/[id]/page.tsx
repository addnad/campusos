import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { courseFor, clock, dayName } from "@/modules/academics/course";
import { BottomNav } from "@/components/layout/bottom-nav";
import { AddClass, AddAssessment } from "./add-forms";
import { Suggestions } from "./suggestions";
import { NoteList } from "./note-list";
import { NoteForm } from "./note-form";
import { notesFor } from "@/modules/learning/notes";
import { TutorPanel } from "./tutor-panel";
import { CardsPanel } from "./cards-panel";
import { dueFor, deckFor, cardAllowanceFor } from "@/modules/learning/cards";
import { allowanceFor } from "@/modules/learning/tutor";
import { suggestionsFor } from "@/modules/academics/suggestions";
import { Remove } from "./remove";

function due(d: Date) {
  const days = Math.ceil((d.getTime() - Date.now()) / 86400000);
  if (days < 0) return { text: "Late", tone: "bg-alarm text-ground" };
  if (days === 0) return { text: "Today", tone: "bg-ink text-ground" };
  if (days === 1) return { text: "Tomorrow", tone: "bg-sunken text-ink" };
  return { text: `In ${days} days`, tone: "bg-sunken text-ink" };
}

export default async function CoursePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/signup");
  if (!session.user.handle) redirect("/handle");

  const userId = session.user.id;
  const { id } = await params;
  const { tab } = await searchParams;
  const onNotes = tab === "notes";
  const onTutor = tab === "tutor";
  const data = await courseFor(session.user.id, id);
  if (!data) notFound();

  const { enrolment, course, assessments, profile } = data;
  // Latency dominates: ten queries together cost about the same as one,
  // ten in sequence cost ten times as much.
  const [suggested, notes] = await Promise.all([
    onNotes || onTutor
      ? Promise.resolve({ classes: [], assessments: [] })
      : suggestionsFor(profile.id, [course.id]),
    onNotes
      ? notesFor(profile.id, course.id)
      : Promise.resolve({ mine: [], shared: [] }),
  ]);

  // Cards live with notes: both are study material, and a deck is made
  // from a note. A fifth tab would be one too many.
  const cards = onNotes
    ? await (async () => {
        const [due, deck, allowance] = await Promise.all([
          dueFor(profile.id, course.id),
          deckFor(profile.id, course.id),
          cardAllowanceFor(profile.id, userId),
        ]);
        return {
          due: due.map((c) => ({ id: c.id, front: c.front, back: c.back })),
          total: deck.cards,
          decksLeft: Math.max(0, allowance.limit - allowance.madeToday),
        };
      })()
    : null;

  const tutor = onTutor
    ? await (async () => {
        const thread = await prisma.tutorThread.findFirst({
          where: { profileId: profile.id, courseId: course.id },
          orderBy: { updatedAt: "desc" },
          include: { turns: { orderBy: { createdAt: "asc" }, take: 30 } },
        });
        const allowance = await allowanceFor(profile.id, session.user.id);
        return { turns: thread?.turns ?? [], ...allowance };
      })()
    : null;

  // A room is reachable from its course: that is where a student is
  // when they realise they want to ask.
  const room = await prisma.community.findFirst({
    where: { courseId: course.id, level: profile.level, semester: profile.semester },
    select: { id: true },
  });
  const colour = `var(--color-${enrolment.colourToken})`;
  const open = assessments.filter((a) => a.state === "PENDING" && a.dueAt.getTime() > Date.now() - 86400000).length;

  return (
    <main className="min-h-screen bg-ground pb-24">
      {/* The colour reads better as a marker than a wall: a full-bleed
          header makes every course page shout, and nothing that shouts
          all the time is heard. */}
      <header className="border-b-2 border-ink/10 px-6 pb-8 pt-8">
        <div className="mx-auto w-full max-w-2xl">
          <Link href="/today" className="label text-muted">&larr; Today</Link>
          <p className="mt-6 label text-muted">
            {profile.level} &middot; {profile.semester === 1 ? "1st" : "2nd"} Semester &middot; {enrolment.units} Units
          </p>
          <h1 className="mt-1 flex items-center gap-3 font-display text-4xl uppercase leading-none text-ink">
            <span className="h-9 w-2 shrink-0 rounded-full" style={{ background: colour }} />
            {course.displayCode}
          </h1>
          <p className="mt-1 pl-5 text-lg text-muted">{course.title}</p>
        </div>
      </header>

      <div className="mx-auto w-full max-w-2xl px-6">
        <nav className="flex gap-6 border-b-2 border-ink/10 pt-6">
          <Link href={`/courses/${course.id}`} className={`pb-3 font-display text-sm uppercase ${onNotes || onTutor ? "text-muted" : "border-b-2 border-ink text-ink"}`}>Work</Link>
          <Link href={`/courses/${course.id}?tab=notes`} className={`pb-3 font-display text-sm uppercase ${onNotes ? "border-b-2 border-ink text-ink" : "text-muted"}`}>Notes</Link>
          <Link href={`/courses/${course.id}?tab=tutor`} className={`pb-3 font-display text-sm uppercase ${onTutor ? "border-b-2 border-ink text-ink" : "text-muted"}`}>Tutor</Link>
          {room ? (
            <Link href="/community" className="pb-3 font-display text-sm uppercase text-muted">Community</Link>
          ) : (
            <span className="pb-3 font-display text-sm uppercase text-muted/50">Community</span>
          )}
        </nav>

        {onTutor && tutor ? (
        <TutorPanel
          courseId={course.id}
          code={course.displayCode}
          turns={tutor.turns.map((t) => ({ id: t.id, question: t.question, answer: t.answer }))}
          left={tutor.left}
          limit={tutor.limit}
        />
        ) : onNotes ? (
        <section className="mt-8">
          <NoteList notes={notes} courseId={course.id} />
          <NoteForm courseId={course.id} courseCode={course.displayCode} />
          {cards && (
            <CardsPanel
              courseId={course.id}
              code={course.displayCode}
              due={cards.due}
              total={cards.total}
              decksLeft={cards.decksLeft}
              notes={notes.mine
                .filter((n) => n.preview || n.isFile)
                .map((n) => ({ id: n.id, title: n.title }))}
            />
          )}
          {/* Cards are built but hidden: the free vision model cannot read
              PDFs, which is most of what students upload. Re-enable when the
              model can. */}
        </section>
        ) : (
        <>
        <section className="mt-8">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-lg uppercase text-ink">Class times</h2>
            <span className="font-mono uppercase tracking-widest text-muted">{course.sessions.length === 0 ? "None yet" : course.sessions.length === 1 ? "Once a week" : `${course.sessions.length} a week`}</span>
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
            <span className="font-mono uppercase tracking-widest text-muted">{open} open</span>
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
        </>
        )}
      </div>

      <BottomNav active="/courses" />
    </main>
  );
}
