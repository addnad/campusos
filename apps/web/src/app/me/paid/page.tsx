import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { verifyPayment } from "@/modules/billing/paystack";

export const dynamic = "force-dynamic";

export default async function Paid({ searchParams }: { searchParams: Promise<{ reference?: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/signup");

  const { reference } = await searchParams;
  const result = reference ? await verifyPayment(reference) : { error: "No payment reference." };
  const ok = "ok" in result && result.ok;

  return (
    <main className="flex min-h-screen items-center justify-center bg-ground px-6">
      <div className="w-full max-w-md">
        <h1 className="font-display text-4xl uppercase leading-[0.95] text-ink">
          {ok ? "You are set" : "That did not go through"}
        </h1>

        <p className="mt-4 text-lg text-muted">
          {ok
            ? "Twenty-five tutor questions and ten decks a day, for this semester. Ask away."
            : "error" in result
              ? result.error
              : "Something went wrong."}
        </p>

        <Link href={ok ? "/today" : "/me"} className="mt-8 inline-flex rounded-full bg-ink px-8 py-4 text-lg font-bold text-ground">
          {ok ? "Back to today" : "Back"}
        </Link>
      </div>
    </main>
  );
}
