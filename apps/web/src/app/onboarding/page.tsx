import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { institutionsByKind } from "@/modules/identity/queries";
import type { InstitutionKind } from "@/generated/prisma/client";
import { SchoolPicker } from "./school-picker";
import { OnboardingShell } from "./shell";

const KINDS = [
  { key: "UNIVERSITY", label: "University" },
  { key: "POLYTECHNIC", label: "Polytechnic" },
  { key: "COLLEGE_OF_EDUCATION", label: "College of Education" },
] as const;

export default async function Onboarding({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/signup");
  if (!session.user.handle) redirect("/handle");

  const existing = await prisma.studentProfile.findFirst({ where: { userId: session.user.id, isActive: true }, select: { id: true } });
  if (existing) redirect("/today");

  const { kind } = await searchParams;

  if (!kind) {
    return (
      <OnboardingShell step={1} total={3} ground="bg-ground" title="Where do you study?">
        <div className="mt-8 space-y-3">
          {KINDS.map((k) => (
            <Link key={k.key} href={`/onboarding?kind=${k.key}`} className="block rounded-full bg-card px-6 py-4 font-bold text-ink transition-transform active:scale-[0.99]">{k.label}</Link>
          ))}
        </div>
      </OnboardingShell>
    );
  }

  const institutions = await institutionsByKind(kind as InstitutionKind);

  return (
    <OnboardingShell step={1} total={3} ground="bg-ground" title="Your school." back="/onboarding">
      <SchoolPicker institutions={institutions} />
    </OnboardingShell>
  );
}
