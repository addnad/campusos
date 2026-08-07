import Link from "next/link";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const metadata = { title: "Privacy Policy" };

export default function Page() {
  const body = readFileSync(join(process.cwd(), "src/content/privacy.md"), "utf8");

  return (
    <main className="min-h-screen bg-ground px-6 py-12">
      <article className="mx-auto w-full max-w-2xl">
        <Link href="/" className="label text-muted">&larr; CampusOS</Link>
        <div className="prose-legal mt-8">
          <Markdown remarkPlugins={[remarkGfm]}>{body}</Markdown>
        </div>
      </article>
    </main>
  );
}
