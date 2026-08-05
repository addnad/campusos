import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { isStaff, openReports, standingFor } from "@/modules/moderation/queries";
import { ReviewItem } from "./review-item";

export const dynamic = "force-dynamic";

export default async function Moderation() {
  const session = await auth();
  if (!session?.user) redirect("/signup");

  // Not a redirect: a 404 does not reveal that the page exists.
  if (!(await isStaff(session.user.id))) notFound();

  const reports = await openReports();
  const standings = await Promise.all(reports.map((r) => standingFor(r.authorId)));

  return (
    <main className="min-h-screen bg-ground px-6 py-8">
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="font-display text-4xl uppercase leading-[0.95] text-ink">
          {reports.length === 0 ? "Nothing to review" : `${reports.length} to review`}
        </h1>
        <p className="mt-3 text-muted">
          Upholding adds a strike in that room. Two is a day&apos;s timeout,
          three is removal from that room. Three removals across rooms flags
          the account for a look.
        </p>

        {reports.length > 0 && (
          <ul className="mt-8 space-y-3">
            {reports.map((r, i) => (
              <ReviewItem key={r.messageId} item={r} standing={standings[i]} />
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
