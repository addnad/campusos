import posthog from "posthog-js";

// Next runs this on the client before the app renders. Without a token
// (local runs, previews) init is skipped, so the app works with no
// analytics rather than throwing.
const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
if (token) {
  posthog.init(token, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    defaults: "2025-05-24",
  });
}
