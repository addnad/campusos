"use client";

import { useRef, useState, useTransition } from "react";
import { postMessage } from "../actions";
import { ALLOWED, MAX_BYTES, checkFile } from "@/modules/collaboration/attachments";

export function Composer({ communityId, mutedUntil, replyTo, onClearReply, onSent, onTyping, handles = [] }: {
  communityId: string;
  mutedUntil: Date | null;
  replyTo?: { id: string; body: string } | null;
  onClearReply?: () => void;
  onSent?: (body: string, replyToId: string | null, file: { url: string | null; type: string; name: string; size: number } | null) => void;
  onTyping?: (on: boolean) => void;
  handles?: string[];
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const box = useRef<HTMLTextAreaElement>(null);
  /// Cleared after a pause: the flag was only unset on send, so stopping
  /// without sending left it true and every poll pushed the window
  /// forward again.
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const picker = useRef<HTMLInputElement>(null);
  const [attaching, setAttaching] = useState(false);
  const [file, setFile] = useState<{ pathname: string; name: string; type: string; size: number } | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  /// Suggest after "@" so a mistyped handle does not silently fail to
  /// reach anyone.
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);

  const suggestions = mentionQuery === null
    ? []
    : handles.filter((h) => h.startsWith(mentionQuery)).slice(0, 5);

  function pickHandle(h: string) {
    const at = body.lastIndexOf("@");
    if (at < 0) return;
    setBody(`${body.slice(0, at)}@${h} `);
    setMentionQuery(null);
    box.current?.focus();
  }

  const muted = mutedUntil && mutedUntil > new Date();
  if (muted) {
    return (
      <div className="fixed inset-x-0 bottom-0 border-t-2 border-ink/10 bg-ground px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <p className="mx-auto max-w-2xl text-sm text-muted">
          You are timed out here until {mutedUntil.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}.
        </p>
      </div>
    );
  }

  function send() {
    const text = body.trim();
    if (!text && !file) return;
    start(async () => {
      const fd = new FormData();
      fd.set("body", text);
      if (replyTo) fd.set("replyToId", replyTo.id);
      if (file) {
        fd.set("filePath", file.pathname);
        fd.set("fileType", file.type);
        fd.set("fileSize", String(file.size));
        fd.set("fileName", file.name);
      }
      const res = await postMessage(communityId, fd);
      if (res && "error" in res && res.error) setError(res.error);
      else {
        setBody(""); setError(null); onClearReply?.(); onTyping?.(false);
        // The optimistic row had no file, so the picture only appeared
        // when the poll replaced it. The preview is local, so it can
        // render at once.
        onSent?.(text, replyTo?.id ?? null,
          file ? { url: preview, type: file.type, name: file.name, size: file.size } : null);
        // Cleared after onSent, which still needs the preview URL.
        setFile(null);
        setPreview(null);
        box.current?.focus();
      }
    });
  }

  return (
    <div className="fixed inset-x-0 bottom-0 border-t-2 border-ink/10 bg-ground px-6 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      {replyTo && (
        <div className="mx-auto mb-2 flex max-w-2xl items-center gap-2 rounded-2xl bg-sunken px-3 py-2">
          <span className="min-w-0 flex-1 truncate text-sm text-muted">Replying to: {replyTo.body}</span>
          <button type="button" onClick={onClearReply} aria-label="Cancel reply" className="text-lg leading-none text-muted hover:text-ink">&times;</button>
        </div>
      )}
      {suggestions.length > 0 && (
        <div className="mx-auto mb-2 flex max-w-2xl flex-wrap gap-2">
          {suggestions.map((h) => (
            <button key={h} type="button" onClick={() => pickHandle(h)} className="rounded-full bg-card px-4 py-2 text-sm font-bold text-ink">@{h}</button>
          ))}
        </div>
      )}

      {(file || attaching) && (
        <div className="mx-auto mb-2 flex max-w-2xl items-center gap-3 rounded-2xl bg-sunken px-3 py-2">
          {preview ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={preview} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
          ) : (
            <span className="text-lg">&#128196;</span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm text-ink">{file?.name ?? "Uploading..."}</span>
            {attaching && <span className="block font-mono text-[11px] text-muted">Uploading</span>}
          </span>
          <button type="button" onClick={() => { setFile(null); setPreview(null); }} aria-label="Remove file" className="text-lg leading-none text-muted hover:text-ink">&times;</button>
        </div>
      )}

      <div className="mx-auto flex max-w-2xl items-end gap-2">
        <input
          ref={picker}
          type="file"
          accept={ALLOWED.join(",")}
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            const problem = checkFile(f.type, f.size);
            if (problem) { setError(problem); return; }
            setError(null);
            // Local preview, so the picture is visible before it lands.
            if (f.type.startsWith("image/")) setPreview(URL.createObjectURL(f));
            setAttaching(true);
            try {
              const fd = new FormData();
              fd.set("file", f);
              const res = await fetch(`/api/community/${communityId}/upload`, { method: "POST", body: fd });
              const data = await res.json();
              if (!res.ok) setError(data.error ?? "Upload failed.");
              else setFile(data);
            } catch {
              setError("Upload failed. Try again.");
            } finally {
              setAttaching(false);
            }
          }}
        />
        <button type="button" onClick={() => picker.current?.click()} disabled={attaching} aria-label="Attach a file" className="h-11 w-11 shrink-0 rounded-full bg-card text-xl font-bold text-muted disabled:opacity-40">
          {attaching ? "..." : "+"}
        </button>
        <textarea
          ref={box}
          rows={1}
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            if (error) setError(null);
            // Grow with the content up to the max height.
            e.target.style.height = "auto";
            e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
            // Only while typing the handle itself.
            const upto = e.target.value.slice(0, e.target.selectionStart ?? undefined);
            const at = /@([a-z0-9_]*)$/i.exec(upto);
            setMentionQuery(at ? at[1].toLowerCase() : null);

            const active = e.target.value.trim().length > 0;
            onTyping?.(active);
            if (idle.current) clearTimeout(idle.current);
            if (active) idle.current = setTimeout(() => onTyping?.(false), 2500);
          }}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Message your coursemates"
          className="max-h-40 min-h-11 flex-1 resize-none rounded-2xl bg-card px-4 py-3 text-ink outline-none placeholder:truncate placeholder:text-muted"
        />
        <button type="button" onClick={send} disabled={pending || attaching || (!body.trim() && !file)} aria-label="Send" className="h-11 w-11 shrink-0 rounded-full bg-ink text-lg font-bold text-ground disabled:opacity-30">
          &uarr;
        </button>
      </div>
      {body.length > 4500 && (
        <p className="mx-auto mt-2 max-w-2xl font-mono text-xs text-muted">
          {5000 - body.length} characters left
        </p>
      )}
      {error && <p className="mx-auto mt-2 max-w-2xl text-sm font-bold text-alarm">{error}</p>}
    </div>
  );
}
