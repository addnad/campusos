"use client";

import { useActionState, useRef, useState } from "react";
import { saveNote } from "./note-actions";
import { ALLOWED, checkFile } from "@/modules/collaboration/attachments";

const field = "w-full rounded-2xl bg-card px-4 py-3 text-ink outline-none placeholder:text-muted";

export function NoteForm({ courseId, courseCode }: { courseId: string; courseCode: string }) {
  const [state, action, pending] = useActionState(saveNote, null);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<{ pathname: string; name: string; type: string; size: number } | null>(null);
  const [uploading, setUploading] = useState(false);
  const picker = useRef<HTMLInputElement>(null);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-3 w-full rounded-2xl border-2 border-dashed border-ink/25 px-5 py-4 text-left text-muted hover:border-ink/50">
        Add a note
      </button>
    );
  }

  return (
    <form
      action={(fd) => {
        if (file) {
          fd.set("filePath", file.pathname);
          fd.set("fileType", file.type);
          fd.set("fileSize", String(file.size));
          fd.set("fileName", file.name);
        }
        action(fd);
        setOpen(false);
        setFile(null);
      }}
      className="mt-3 rounded-2xl bg-sunken p-4"
    >
      <input type="hidden" name="courseId" value={courseId} />

      <input name="title" placeholder="What is this note about?" className={field} autoFocus />
      <input name="topic" placeholder="Topic or week (optional)" className={`${field} mt-2`} />
      <textarea name="body" rows={6} placeholder="Type your notes, or attach a photo of the board" className={`${field} mt-2 resize-y`} />

      <input
        ref={picker}
        type="file"
        accept={ALLOWED.join(",")}
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          if (checkFile(f.type, f.size)) return;
          setUploading(true);
          try {
            const fd = new FormData();
            fd.set("file", f);
            const res = await fetch(`/api/courses/${courseId}/note-upload`, { method: "POST", body: fd });
            if (res.ok) setFile(await res.json());
          } finally {
            setUploading(false);
          }
        }}
      />

      <div className="mt-2 flex items-center gap-2">
        <button type="button" onClick={() => picker.current?.click()} disabled={uploading} className="rounded-full bg-card px-4 py-2 text-sm font-bold text-ink disabled:opacity-40">
          {uploading ? "Uploading..." : file ? "Change file" : "Attach a file"}
        </button>
        {file && <span className="min-w-0 truncate text-sm text-muted">{file.name}</span>}
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" name="isShared" className="h-4 w-4 accent-current" />
        Share with everyone taking {courseCode}
      </label>

      {state && "error" in state && state.error && (
        <p className="mt-3 text-sm font-bold text-alarm">{state.error}</p>
      )}

      <div className="mt-4 flex gap-2">
        <button type="submit" disabled={pending || uploading} className="flex-1 rounded-full bg-ink px-5 py-3 font-bold text-ground disabled:opacity-40">
          {pending ? "Saving..." : "Save note"}
        </button>
        <button type="button" onClick={() => { setOpen(false); setFile(null); }} className="rounded-full px-5 py-3 font-bold text-muted">Cancel</button>
      </div>
    </form>
  );
}
