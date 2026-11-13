import { LoadingMark } from "@/components/loading-mark";

export default function Loading() {
  return (
    <main className="min-h-screen bg-ground" role="status" aria-label="Loading">
      <LoadingMark />
    </main>
  );
}
