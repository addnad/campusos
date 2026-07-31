import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { prefillFor } from "@/modules/identity/queries";
import { OnboardingShell } from "../shell";
import { ConfirmForm } from "./confirm-form";

type Search = { institution?: string; programme?: string; level?: string; semester?: string };

export default async function Confirm({ searchParams }: { searchParams: Promise<Search> }) {
  const session = await auth();
  if (!session?.user) redirect("/signup");
  if (!session.user.handle) redirect("/handle");

  const { institution, programme, level, semester } = await searchParams;
  if (!institution || !programme || !level || !semester) redirect("/onboarding");

  const p = await prisma.programme.findUnique({ where: { id: programme }, select: { name: true } });
  if (!p) redirect("/onboarding");

  const prefill = await prefillFor(programme, level, Number(semester));
  const units = prefill.reduce((n, c) => n + c.units, 0);
  const term = semester === "1" ? "First Semester" : "Second Semester";

  return (
    <OnboardingShell step={3} total={3} ground="bg-aqua" title={prefill.length > 0 ? `We found ${prefill.length} courses` : "Add your courses"} back={`/onboarding/declare?institution=${institution}`}>
      <p className="mt-3 text-ink/80">{level} {p.name} &middot; {term}{prefill.length > 0 ? ` \u00b7 ${units} units` : ""}</p>
      <ConfirmForm initial={prefill} programmeId={programme} institutionId={institution} level={level} semester={Number(semester)} />
    </OnboardingShell>
  );
}
