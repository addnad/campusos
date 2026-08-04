"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { joinRoom } from "./actions";

export function JoinButton({ communityId }: { communityId: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <>
      <button type="button" disabled={pending} onClick={() => start(async () => {
        const res = await joinRoom(communityId);
        if (res && "error" in res && res.error) setError(res.error);
        else router.push(`/community/${communityId}`);
      })} className="shrink-0 rounded-full bg-ink px-5 py-2 text-sm font-bold text-ground disabled:opacity-40">
        {pending ? "Joining..." : "Join"}
      </button>
      {error && <span className="text-xs font-bold text-alarm">{error}</span>}
    </>
  );
}
