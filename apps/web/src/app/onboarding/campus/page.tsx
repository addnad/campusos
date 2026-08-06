import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { campusesFor } from "@/modules/identity/queries";
import { OnboardingShell } from "../shell";

export default async function PickCampus({ searchParams }: { searchParams: Promise<{ institution?: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/signup");
  if (!session.user.handle) redirect("/handle");

  const { institution } = await searchParams;
  if (!institution) redirect("/onboarding");

  const school = await prisma.institution.findUnique({ where: { id: institution }, select: { name: true, kind: true } });
  if (!school) redirect("/onboarding");

  const campuses = await campusesFor(institution);

  // One campus is not a choice. Skip the step entirely.
  if (campuses.length <= 1) {
    const only = campuses[0];
    if (!only) redirect("/onboarding");
    redirect(`/onboarding/declare?institution=${institution}&campus=${only.id}`);
  }

  return (
    <OnboardingShell step={2} total={4} ground="bg-ground" title="Which campus?" sub={school.name} back={`/onboarding?kind=${school.kind}`}>
      <div className="mt-8 space-y-3">
        {campuses.map((c) => (
          <Link key={c.id} href={`/onboarding/declare?institution=${institution}&campus=${c.id}`} className="block rounded-full bg-card px-6 py-4 font-bold text-ink transition-transform active:scale-[0.99]">{c.name}</Link>
        ))}
      </div>
      <p className="mt-6 text-sm text-muted">Your courses, timetable and coursemates all follow your campus.</p>
    </OnboardingShell>
  );
}
