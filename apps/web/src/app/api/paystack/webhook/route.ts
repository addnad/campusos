import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { verifyPayment } from "@/modules/billing/paystack";

/// Paystack calls this whether or not the student makes it back to the
/// site — closing the tab after paying should still grant what they paid
/// for.
export async function POST(req: NextRequest) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return new NextResponse("not configured", { status: 500 });

  const raw = await req.text();
  const signature = req.headers.get("x-paystack-signature") ?? "";

  // Signed with the secret key, so anyone can post here but only
  // Paystack can be believed.
  const expected = createHmac("sha512", secret).update(raw).digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return new NextResponse("bad signature", { status: 401 });
  }

  const event = JSON.parse(raw);
  if (event?.event === "charge.success" && event?.data?.reference) {
    await verifyPayment(event.data.reference);
  }

  return NextResponse.json({ received: true });
}
