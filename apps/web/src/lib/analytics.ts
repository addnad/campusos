import "server-only";
import { after } from "next/server";
import { PostHog } from "posthog-node";

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

const globalForPosthog = globalThis as unknown as { posthog?: PostHog | null };

/// One client for the process, kept on globalThis so dev hot reloads do
/// not open a new one each time (the same reason prisma.ts does it).
/// flushAt and flushInterval are the lowest they go: a server action can
/// end the moment it returns, so an event that waits to batch may never
/// leave.
function client(): PostHog | null {
  if (globalForPosthog.posthog !== undefined) return globalForPosthog.posthog;
  globalForPosthog.posthog = token
    ? new PostHog(token, { host, flushAt: 1, flushInterval: 0 })
    : null;
  return globalForPosthog.posthog;
}

/// Record a student action from the server. distinctId is the user id, so
/// these line up with the browser's own events once the client identifies
/// with the same id. Never let a failed send break the write it follows,
/// and never pass anything that names a student or a course.
export function track(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>,
) {
  const ph = client();
  if (!ph) return;
  ph.capture({ distinctId, event, properties });
  // Send after the response, so the write the student is waiting on never
  // blocks on a round trip to PostHog. after() keeps the invocation alive
  // long enough for the send even on serverless.
  after(async () => {
    try {
      await ph.flush();
    } catch {
      // Analytics is not worth an error to the student.
    }
  });
}
