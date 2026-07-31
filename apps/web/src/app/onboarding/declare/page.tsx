import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { programmesFor, levelsFor } from "@/modules/identity/queries";
import { OnboardingShell } from "../shell";
import { DeclareForm } from "./declare-form";

export default async function Declare({ searchParams }: { searchParams: Promise<{ institution?: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/signup");
  if (!session.user.handle) redirect("/handle");

  const { institution } = await searchParams;
  if (!institution) redirect("/onboarding");

  const school = await prisma.institution.findUnique({ where: { id: institution }, select: { name: true, kind: true } });
  if (!school) redirect("/onboarding");

  const programmes = await programmesFor(institution);
  const options = [];
  for (const p of programmes) {
    for (const level of await levelsFor(p.id)) {
      options.push({ programmeId: p.id, level, label: `${level} ${p.name}` });
    }
  }

  return (
    <OnboardingShell step={2} total={3} ground="bg-ember" title="What are you studying?">
      <p className="mt-3 flex items-center gap-3 text-ink/80">
        <span>{school.name}</span>
        <Link href={`/onboarding?kind=${school.kind}`} className="text-sm font-bold uppercase tracking-wide text-ink underline underline-offset-4">Change</Link>
      </p>
      <DeclareForm options={options} institutionId={institution} />
    </OnboardingShell>
  );
}
