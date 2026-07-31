import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { validateShape, isTaken } from "@/lib/handle";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorised" }, { status: 401 });

  const raw = req.nextUrl.searchParams.get("h") ?? "";
  const shape = validateShape(raw);
  if (!shape.ok) return NextResponse.json({ available: false, reason: shape.reason });

  const taken = await isTaken(raw.trim().toLowerCase());
  return NextResponse.json({
    available: !taken,
    reason: taken ? "Already taken." : null,
  });
}
