import { prisma } from "@/lib/prisma";

/// Naira, in kobo as Paystack counts it. One price, one semester.
export const PRICE_KOBO = 2_000_00;

/// What paying lifts. Free is three questions and two decks a day —
/// enough to try properly, not enough to lean on.
export const PAID_TUTOR_DAILY = 25;
export const PAID_CARDS_DAILY = 10;

/// Five months from purchase. Longer than most semesters, and simpler
/// than tying it to a date the student may not have told us.
const MONTHS = 5;

const BASE = "https://api.paystack.co";

/// Off until there are credits behind it. Selling access to a
/// rate-limited free model would be worse than not selling.
export const PAYMENTS_LIVE = process.env.NEXT_PUBLIC_PAYMENTS_LIVE === "1";

function headers() {
  return {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  };
}

export async function startPayment(userId: string, email: string, origin: string) {
  if (!process.env.PAYSTACK_SECRET_KEY) return { error: "Payments are not set up." };

  const reference = `campusos_${userId.slice(-8)}_${Date.now()}`;

  const res = await fetch(`${BASE}/transaction/initialize`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      email,
      amount: PRICE_KOBO,
      reference,
      callback_url: `${origin}/me/paid`,
      metadata: { userId, purpose: "tutor_semester" },
    }),
  });

  const data = await res.json();
  if (!res.ok || !data?.status) return { error: "Could not start the payment." };

  await prisma.payment.create({
    data: { userId, reference, amount: PRICE_KOBO },
  });

  return { url: data.data.authorization_url as string };
}

/// Verifies with Paystack rather than trusting the redirect. A student
/// landing on the success page proves nothing; Paystack saying the
/// charge succeeded does.
export async function verifyPayment(reference: string) {
  if (!process.env.PAYSTACK_SECRET_KEY) return { error: "Payments are not set up." };

  const existing = await prisma.payment.findUnique({ where: { reference } });
  if (!existing) return { error: "No such payment." };
  // Paystack calls the webhook and redirects the student; both verify
  // the same reference, and only one should grant anything.
  if (existing.state === "PAID") return { ok: true, already: true };

  const res = await fetch(`${BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: headers(),
  });
  const data = await res.json();

  if (!res.ok || !data?.status || data.data?.status !== "success") {
    await prisma.payment.update({ where: { reference }, data: { state: "FAILED" } });
    return { error: "That payment did not go through." };
  }

  const until = new Date();
  until.setMonth(until.getMonth() + MONTHS);

  await prisma.$transaction([
    prisma.payment.update({
      where: { reference },
      data: { state: "PAID", paidAt: new Date() },
    }),
    prisma.user.update({
      where: { id: existing.userId },
      data: {
        tutorPaidUntil: until,
        tutorDailyLimit: PAID_TUTOR_DAILY,
        cardDailyLimit: PAID_CARDS_DAILY,
      },
    }),
  ]);

  return { ok: true, until };
}
