import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/ui/wordmark";
import { WordmarkAnimated } from "@/components/ui/wordmark-animated";

export default function Landing() {
  return (
    <main className="min-h-screen bg-ground">
      <div className="mx-auto max-w-5xl px-6 py-8 sm:px-10">
        <header className="flex items-center justify-between">
          <Wordmark size="small" />
          <Link href="/login" className="text-sm font-bold text-ink underline underline-offset-4 hover:opacity-70">Already a student here? Log in</Link>
        </header>

        <section className="mt-16 sm:mt-24">
          <WordmarkAnimated />
          <h1 className="snap mt-10 max-w-3xl font-display text-4xl leading-[1.05] text-ink sm:text-5xl md:text-6xl" style={{ "--from": "translateY(16px)", animationDelay: "620ms" } as React.CSSProperties}>
            The academic home for students.
          </h1>
        </section>

        <section className="snap mt-10 max-w-2xl border-t-2 border-ink/10 pt-8" style={{ "--from": "translateY(16px)", animationDelay: "760ms" } as React.CSSProperties}>
          <p className="text-xl leading-relaxed text-ink">
            Your courses, your timetable, your deadlines and the people taking
            them with you. All in your school{"\u2019"}s own curriculum.
          </p>
        </section>

        <section className="snap mt-16 flex flex-wrap items-center gap-4" style={{ "--from": "translateY(16px)", animationDelay: "880ms" } as React.CSSProperties}>
          <Button href="/signup">Sign up</Button>
          <Button href="/login" variant="secondary">
            Log in
          </Button>
        </section>

        <footer className="mt-20 flex flex-wrap items-center gap-4 border-t-2 border-ink/10 pt-6">
          <Wordmark size="small" />
          <span className="text-sm text-muted">
            For Nigerian polytechnics and universities.
          </span>
        </footer>
      </div>
    </main>
  );
}
