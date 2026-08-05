import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkFile, storeFile } from "@/modules/collaboration/attachments";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorised" }, { status: 401 });

  const { id } = await params;

  const profile = await prisma.studentProfile.findFirst({
    where: { userId: session.user.id, isActive: true },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "no profile" }, { status: 403 });

  // Membership is the permission: nobody uploads into a room they are
  // not in, and a timed-out member cannot either.
  const member = await prisma.communityMember.findUnique({
    where: { communityId_profileId: { communityId: id, profileId: profile.id } },
    select: { state: true, mutedUntil: true },
  });
  if (!member || member.state === "REMOVED") {
    return NextResponse.json({ error: "not a member" }, { status: 403 });
  }
  if (member.state === "TIMED_OUT" && member.mutedUntil && member.mutedUntil > new Date()) {
    return NextResponse.json({ error: "timed out" }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file." }, { status: 400 });
  }

  const problem = checkFile(file.type, file.size);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  try {
    const stored = await storeFile(id, file);
    return NextResponse.json(stored);
  } catch {
    return NextResponse.json({ error: "Upload failed. Try again." }, { status: 500 });
  }
}

export const maxDuration = 30;
