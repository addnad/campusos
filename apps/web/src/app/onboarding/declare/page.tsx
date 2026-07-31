import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { programmesFor } from "@/modules/identity/queries";
import { OnboardingShell } from "../shell";
import { DeclareForm } from "./declare-form";

/// Every ladder offered at this institution, deduplicated: a polytechnic
/// runs ND and HND, a university runs 100-500.
function laddersFor(awards: string[]) {
  const out: string[] = [];
  if (awards.includes("ND")) out.push("ND I", "ND II");
  if (awards.includes("HND")) out.push("HND I", "HND II");
  if (awards.includes("NCE")) out.push("NCE I", "NCE II", "NCE III");
  if (awards.some((a) => !["ND", "HND", "NCE"].includes(a))) {
    out.push("100 Level", "200 Level", "300 Level", "400 Level", "500 Level");
  }
  return out;
}

export default async function Declare({ searchParams }: { searchParams: Promise<{ institution?: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/signup");
  if (!session.user.handle) redirect("/handle");

  const { institution } = await searchParams;
  if (!institution) redirect("/onboarding");

  const school = await prisma.institution.findUnique({ where: { id: institution }, select: { name: true, kind: true } });
  if (!school) redirect("/onboarding");

  const programmes = await programmesFor(institution);
  const levels = laddersFor([...new Set(programmes.map((p) => p.award))]);

  return (
    <OnboardingShell step={2} total={3} ground="bg-ember" title="What are you studying?">
      <p className="mt-3 flex items-center gap-3 text-ink/80">
        <span>{school.name}</span>
        <Link href={`/onboarding?kind=${school.kind}`} className="text-sm font-bold uppercase tracking-wide text-ink underline underline-offset-4">Change</Link>
      </p>
      <DeclareForm levels={levels} programmes={programmes} institutionId={institution} />
    </OnboardingShell>
  );
}
