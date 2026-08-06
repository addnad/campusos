import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { semesterFor } from "@/modules/academics/queries";
import { timelineFor } from "@/modules/academics/timeline";
import { BottomNav } from "@/components/layout/bottom-nav";
import { unreadTotal } from "@/modules/collaboration/queries";
import { TimelineRow } from "./timeline";
import { NextStack } from "./next-stack";
import { RefreshOnReturn } from "@/components/refresh-on-return";
import { suggestionsFor } from "@/modules/academics/suggestions";
import { SuggestionDrawer } from "./suggestion-drawer";
import { SemesterPrompt } from "./semester-prompt";
import { FreeWindows } from "./free-windows";
import { windowsFor } from "@/modules/intelligence/windows";
import { semesterPrompt, readyToRoll } from "@/modules/academics/semester";
import { RollOver } from "./roll-over";

/// The line a student would use to describe their day.
function headline(classesLeft: number, dueToday: number, overdue: number) {
  const parts: string[] = [];
  if (overdue > 0) parts.push(`${overdue} late`);
  if (classesLeft > 0) parts.push(`${classesLeft} ${classesLeft === 1 ? "class" : "classes"} left`);
  if (dueToday > 0) parts.push(`${dueToday} due tonight`);
  if (parts.length === 0) return ["Nothing left today"];
  return parts;
}

/// Never cached: this screen is about now, and a render from before
/// midnight would show yesterday's classes as today's.
export const dynamic = "force-dynamic";

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

  const now = new Date();

  // None of these depend on each other, and every query is a round trip
  // to Frankfurt. Run sequentially the page waits for the sum; run
  // together it waits for the slowest.
  const [t, suggested, windows, unread] = await Promise.all([
    timelineFor(session.user.id, now),
    suggestionsFor(profile.id),
    windowsFor(profile.id, now),
    unreadTotal(profile.id),
  ]);

  const prompt = semesterPrompt(profile, now);
  const rolling = readyToRoll(profile.nextSemesterAt, now);
  const { programme, enrolments } = profile;
  const suggestions = suggested.classes.length + suggested.assessments.length;

  // Group by course so the drawer reads as "COS 101: these two things".
  const suggestionGroups = [...new Set([
    ...suggested.classes.map((c) => c.courseId),
    ...suggested.assessments.map((a) => a.courseId),
  ])].map((courseId) => ({
    courseId,
    code: enrolments.find((e) => e.courseId === courseId)?.course.displayCode ?? "",
    classes: suggested.classes.filter((c) => c.courseId === courseId),
    assessments: suggested.assessments.filter((a) => a.courseId === courseId),
  }));
  const initials = (session.user.handle ?? "").slice(0, 2).toUpperCase();
  const multiCampus = programme.campus.name !== "Main Campus";
  const lines = headline(t?.classesLeft ?? 0, t?.dueToday ?? 0, t?.overdue ?? 0);
  const nothingSetUp = enrolments.length > 0 && (t?.spine.length ?? 0) === 0 && !t?.next;

  // What is next, ahead of now. The stack shows up to three; the list
  // below starts after them so nothing appears twice on one screen.
  const ahead = [...(t?.spine ?? []), ...(t?.upcoming ?? [])]
    .filter((i) => i.at > now)
    .sort((a, b) => a.at.getTime() - b.at.getTime());
  const stack = ahead.length > 0 ? ahead.slice(0, 3) : t?.next ? [t.next] : [];
  const stackIds = new Set(stack.map((i) => `${i.type}-${i.id}`));
  const rest = ahead.filter((i) => !stackIds.has(`${i.type}-${i.id}`));
  const earlier = (t?.spine ?? []).filter((i) => i.at <= now);

  return (
    <main className="min-h-screen bg-ground px-6 pb-24 pt-8">
      <div className="mx-auto w-full max-w-2xl">
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate label text-muted">
              {programme.institution.name}{multiCampus ? ` \u00b7 ${programme.campus.name}` : ""}
            </p>
            <p className="mt-1 truncate font-bold text-ink">{profile.level} {programme.name}</p>
          </div>
          <Link href="/me" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink font-display text-sm text-ground">{initials}</Link>
        </header>

        <p className="mt-8 label text-muted">
          {now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }).toUpperCase()}
          {" \u00b7 "}
          {profile.semester === 1 ? "First" : "Second"} Semester
        </p>

        <h1 className="mt-2 font-display text-4xl uppercase leading-[0.95] text-ink sm:text-5xl">
          {lines.map((l) => <span key={l} className="block">{l}</span>)}
        </h1>

        <NextStack items={stack} nowIso={now.toISOString()} />

        {nothingSetUp && (
          <section className="mt-6 rounded-3xl border-2 border-dashed border-ink/20 p-6">
            <p className="font-display text-xl uppercase text-ink">Add your timetable</p>
            <p className="mt-2 text-muted">
              Open a course and add when it meets. Your classes and deadlines
              then land here in order.
            </p>
            <Link href="/courses" className="mt-4 inline-flex rounded-full bg-ink px-6 py-3 font-bold text-ground">Go to my courses</Link>
          </section>
        )}

        {rest.length > 0 && (
          <section className="mt-10">
            <h2 className="font-display text-lg uppercase text-ink">After that</h2>
            <div className="mt-3 space-y-2">
              {rest.map((item) => <TimelineRow key={`${item.type}-${item.id}`} item={item} nowIso={now.toISOString()} />)}
            </div>
          </section>
        )}

        {earlier.length > 0 && (
          <section className="mt-10">
            <h2 className="font-display text-lg uppercase text-muted">Earlier today</h2>
            <div className="mt-3 space-y-2 opacity-60">
              {earlier.map((item) => <TimelineRow key={`${item.type}-${item.id}`} item={item} nowIso={now.toISOString()} />)}
            </div>
          </section>
        )}

        {rolling && profile.nextSemesterAt ? (
          <RollOver
            startsAt={profile.nextSemesterAt}
            currentLevel={profile.level}
            currentSemester={profile.semester}
            award={programme.award}
            years={programme.years}
            programmeId={programme.id}
            institutionId={programme.institutionId}
            campusId={programme.campusId}
          />
        ) : (
          <SemesterPrompt prompt={prompt} />
        )}

        <FreeWindows windows={windows.map((w) => ({
          ...w,
          startsAt: w.startsAt.toISOString(),
          endsAt: w.endsAt.toISOString(),
        }))} />

        <SuggestionDrawer groups={suggestionGroups} total={suggestions} />

      </div>

      <RefreshOnReturn />
      <BottomNav active="/today" unread={unread} />
    </main>
  );
}
