import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { suggest } from "@/lib/handle";
import { Wordmark } from "@/components/ui/wordmark";
import { HandleForm } from "./handle-form";

export default async function ChooseHandle() {
  const session = await auth();
  if (!session?.user) redirect("/signup");
  if (session.user.handle) redirect("/today");

  const suggestions = await suggest(session.user.name);

  return (
    <main className="min-h-screen bg-ground px-6 py-12">
      <div className="mx-auto w-full max-w-md">
        <Wordmark size="small" />
        <h1 className="mt-10 font-display text-4xl leading-[1.05] text-ink">
          Pick your handle.
        </h1>
        <p className="mt-4 text-ink/70">
          This is how coursemates will see you. Choose carefully.
        </p>
        <HandleForm suggestions={suggestions} />
      </div>
    </main>
  );
}
