"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { startPayment } from "@/modules/billing/paystack";

export async function buySemester() {
  const session = await auth();
  if (!session?.user?.email) return { error: "Not signed in." };

  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  const origin = `${proto}://${host}`;

  const res = await startPayment(session.user.id, session.user.email, origin);
  if ("error" in res) return { error: res.error };

  redirect(res.url);
}
