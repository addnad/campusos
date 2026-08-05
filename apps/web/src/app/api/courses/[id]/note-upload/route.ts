import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkFile, storeFile } from "@/modules/collaboration/attachments";
import { EnrolmentStatus } from "@/generated/prisma/client";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorised" }, { status: 401 });

  const { id } = await params;

  const profile = await prisma.studentProfile.findFirst({
    where: { userId: session.user.id, isActive: true },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "no profile" }, { status: 403 });

  // Enrolment is the permission, as everywhere else on a course.
  const enrolled = await prisma.enrolment.findFirst({
    where: { profileId: profile.id, courseId: id, status: EnrolmentStatus.ACTIVE },
    select: { id: true },
  });
  if (!enrolled) return NextResponse.json({ error: "not enrolled" }, { status: 403 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file." }, { status: 400 });

  const problem = checkFile(file.type, file.size);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  try {
    return NextResponse.json(await storeFile(`notes/${id}`, file));
  } catch {
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}

export const maxDuration = 30;
