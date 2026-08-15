import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { programmesFor, campusesFor, programmesElsewhere } from "@/modules/identity/queries";
import { OnboardingShell } from "../shell";
import { DeclareForm } from "./declare-form";

type Search = { institution?: string; campus?: string };

export default async function Declare({ searchParams }: { searchParams: Promise<Search> }) {
  const session = await auth();
  if (!session?.user) redirect("/signup");
  if (!session.user.handle) redirect("/handle");

  const { institution, campus } = await searchParams;
  if (!institution || !campus) redirect("/onboarding");

  const [school, site] = await Promise.all([
    prisma.institution.findUnique({ where: { id: institution }, select: { name: true, kind: true } }),
    prisma.campus.findUnique({ where: { id: campus }, select: { name: true, institutionId: true } }),
  ]);
  if (!school || !site || site.institutionId !== institution) redirect("/onboarding");

  const multi = (await campusesFor(institution)).length > 1;
  const programmes = await programmesFor(campus);

  // Only when the school has nothing of its own. At a seeded school these
  // would sit confusingly beside programmes that are actually confirmed
  // there.
  // Not only when empty: one student declaring one programme should not
  // hide the list from everyone after them.
  const elsewhere = programmes.length < 5
    ? await programmesElsewhere(campus, school.kind)
    : [];

  return (
    <OnboardingShell step={3} total={4} ground="bg-ground" title="What are you studying?" back={multi ? `/onboarding/campus?institution=${institution}` : `/onboarding?kind=${school.kind}`}>
      <p className="mt-3 flex flex-wrap items-center gap-3 text-muted">
        <span>{school.name}{multi ? ` \u00b7 ${site.name}` : ""}</span>
        <Link href={`/onboarding?kind=${school.kind}`} className="text-sm font-bold uppercase tracking-wide text-ink underline underline-offset-4">Change</Link>
      </p>
      <DeclareForm programmes={programmes} elsewhere={elsewhere} institutionId={institution} campusId={campus} kind={school.kind as never} />
    </OnboardingShell>
  );
}
