"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { normaliseName } from "@/modules/identity/normalise";
import { Confidence, StudyMode } from "@/generated/prisma/client";

const AWARDS = ["ND", "HND", "NCE", "BSc", "BEng", "BA", "BEd"];

export async function declareProgramme(_prev: unknown, formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "Not signed in." };

  const campusId = String(formData.get("campusId") ?? "");
  const institutionId = String(formData.get("institutionId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const award = String(formData.get("award") ?? "").trim().toUpperCase();
  const mode = String(formData.get("studyMode") ?? "") as StudyMode;

  if (!campusId || !institutionId) return { error: "Missing campus." };
  if (name.length < 3) return { error: "Give the full programme name." };
  if (name.length > 80) return { error: "That name is too long." };
  if (!AWARDS.includes(award)) return { error: "Pick an award." };
  if (!Object.values(StudyMode).includes(mode)) return { error: "Pick how you attend." };

  const years = mode === StudyMode.FULL_TIME ? (award === "ND" || award === "HND" ? 2 : 4) : 3;

  try {
    const programme = await prisma.programme.upsert({
      where: { campusId_name_award_studyMode: { campusId, name, award, studyMode: mode } },
      update: {},
      create: {
        institutionId,
        campusId,
        name,
        normalisedName: normaliseName(name),
        award,
        studyMode: mode,
        years,
        confidence: Confidence.STUDENT_SUPPLIED,
      },
    });
    return { programmeId: programme.id, award, years, name };
  } catch {
    return { error: "Could not add that. Try again." };
  }
}
