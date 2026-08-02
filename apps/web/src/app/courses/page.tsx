import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { semesterFor } from "@/modules/academics/queries";
import { BottomNav } from "@/components/layout/bottom-nav";

export default async function Courses() {
  const session = await auth();
  if (!session?.user) redirect("/signup");
  if (!session.user.handle) redirect("/handle");

  const profile = await semesterFor(session.user.id);
  if (!profile) redirect("/onboarding");

  const { programme, enrolments } = profile;
  const units = enrolments.reduce((n, e) => n + e.units, 0);

  return (
    <main className="min-h-screen bg-ground px-6 pb-24 pt-8">
      <div className="mx-auto w-full max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-widest text-muted">
          {profile.level} {programme.name} &middot; {profile.semester === 1 ? "First" : "Second"} Semester
        </p>
        <h1 className="mt-2 font-display text-4xl uppercase leading-[0.95] text-ink">
          {enrolments.length} {enrolments.length === 1 ? "course" : "courses"}
        </h1>
        <p className="mt-2 font-mono text-sm text-muted">{units} units this semester</p>

        <ul className="mt-8 space-y-2">
          {enrolments.map((e) => (
            <li key={e.id}>
              <Link href={`/courses/${e.courseId}`} className="flex items-center gap-4 rounded-2xl bg-card p-4 transition-transform active:scale-[0.99]">
                <span className="h-12 w-1.5 shrink-0 rounded-full" style={{ background: `var(--color-${e.colourToken})` }} />
                <span className="min-w-0">
                  <span className="block font-bold text-ink">{e.course.displayCode}</span>
                  <span className="block truncate text-sm text-muted">{e.course.title}</span>
                </span>
                <span className="ml-auto shrink-0 font-mono text-sm text-muted">{e.units}u</span>
              </Link>
            </li>
          ))}
        </ul>

        {enrolments.length === 0 && (
          <p className="mt-8 text-muted">No courses yet. Finish setting up your semester.</p>
        )}
      </div>

      <BottomNav active="/courses" />
    </main>
  );
}
