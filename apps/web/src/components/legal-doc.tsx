import { readFileSync } from "node:fs";
import { join } from "node:path";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function LegalDoc({ name }: { name: "privacy" | "terms" }) {
  const body = readFileSync(join(process.cwd(), `src/content/${name}.md`), "utf8");
  return (
    <div className="prose-legal">
      <Markdown remarkPlugins={[remarkGfm]}>{body}</Markdown>
    </div>
  );
}
