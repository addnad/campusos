# PostHog Self-driving setup report

## Summary

PostHog Self-driving is configured for CampusOS with Session Replay, Error Tracking, and Support enabled; health, error, support, GitHub Issues, and scout delivery sources are ready for the inbox. Two Replay Vision monitors and seven total scouts are active. Findings should begin appearing in the [Self-driving inbox](https://us.posthog.com/project/600341/inbox) within about 30 minutes once recordings and telemetry arrive.

## AI data processing

Approved by the organization-level gate.

## GitHub

GitHub Issues was connected during this setup for the CampusOS repository. The warehouse source is syncing the `issues` table only, which is the table Self-driving consumes; additional GitHub tables can be enabled later in PostHog if needed.

## Products enabled

| Product | Result | Notes |
| --- | --- | --- |
| Session Replay | Already enabled | No `posthog.init` call was found in the web app scan, so browser SDK setup still needs confirmation before recordings can arrive from this repository. |
| Error Tracking | Already enabled | As above, confirm the browser SDK is initialized and does not disable exception capture. |
| Support (Conversations) | Enabled | Tickets will arrive only after an inbound email, inbox, or Slack channel is connected. |

## Signal sources

| Signal source | Action |
| --- | --- |
| `signals_scout` / `cross_source_issue` | Enabled by Self-driving’s default delivery posture; no opt-out row was created. |
| `health_checks` / `health_issue` | Enabled. |
| `error_tracking` / `issue_created` | Enabled. |
| `error_tracking` / `issue_reopened` | Enabled. |
| `error_tracking` / `issue_spiking` | Enabled. |
| `conversations` / `ticket` | Enabled. |
| `github` / `issue` | Enabled. |
| Session replay responder row | Deliberately skipped; Replay Vision scanners are its inbox route. |

## Connected tools

| Tool | Result |
| --- | --- |
| GitHub Issues | Connected by this setup; warehouse source `01a08315-79b4-0000-60be-66bc73c9b09c` was created and its first sync started. |
| Linear, Jira, Sentry, Zendesk, and other catalog tools | Not used; no responder was enabled. |

## Scout troop

**Enabled (7; one daily run each by default):**

| Scout | What it watches |
| --- | --- |
| `signals-scout-general` | Cross-product patterns and otherwise uncovered surfaces. |
| `signals-scout-product-analytics` | Saved conversion, retention, lifecycle, stickiness, and path flows. |
| `signals-scout-web-analytics` | Web traffic, attribution, landing pages, bounce, and 404 health. |
| `signals-scout-health-checks` | Actionable PostHog configuration health issues. |
| `signals-scout-data-warehouse` | Warehouse source failures, staleness, and row-volume cliffs. |
| `signals-scout-student-setup-planning` | CampusOS student academic setup through a usable Today plan. |
| `signals-scout-study-tutor-reliability` | CampusOS note-grounded study tutor reliability and telemetry coverage. |

**Disabled (22):**

| Scout(s) | Reason |
| --- | --- |
| `signals-scout-error-tracking` | Covered by the enabled native Error Tracking responder. |
| `signals-scout-session-replay` | Covered by the Replay Vision monitors below. |
| `signals-scout-ai-observability`, `signals-scout-apm`, `signals-scout-logs` | No confirmed active AI trace, APM, or logs surface from the project scan. |
| `signals-scout-conversations`, `signals-scout-surveys` | Support has no inbound channel yet and no surveys were found. |
| `signals-scout-csp-violations`, `signals-scout-web-vitals` | No CSP reporting or Web Vitals use was confirmed. |
| `signals-scout-customer-analytics`, `signals-scout-revenue-analytics` | No account-analytics or payment surface was found. |
| `signals-scout-data-pipelines`, `signals-scout-experiments`, `signals-scout-feature-flags` | No actively used pipeline, experiment, or flag surface was confirmed. |
| `signals-scout-anomaly-detection`, `signals-scout-insight-alerts`, `signals-scout-observability-gaps` | Fresh setup has no known high-value saved insights or alerts; the selected specialists are more directly useful. |
| `signals-scout-inbox-validation` | No resolved Self-driving reports exist yet to validate. |
| `signals-scout-mcp-tool-calls`, `signals-scout-skills-store`, `signals-scout-tasks`, `signals-scout-replay-vision` | These are not core CampusOS product surfaces; the Replay Vision analyst scout can be enabled after observations accumulate. |

**Verified scout budget:** 100 runs/day; 0 used and 100 remaining at setup time. The enrollment banner states that scouts are in early access and directs requests for more capacity to `team-self-driving@posthog.com`.

## Custom scouts

| Custom scout | Surface and discriminator | Why it is distinct |
| --- | --- | --- |
| `signals-scout-student-setup-planning` | Student setup to course planning; reports only broad, sustained progression loss or a concrete telemetry gap. | The product-analytics specialist only watches saved flows; this owns CampusOS’s academic setup and Today-plan boundary. |
| `signals-scout-study-tutor-reliability` | Note-grounded study tutor; reports only persistent, multi-student failure, stall, empty-response, or coverage patterns. | Native Error Tracking catches exceptions, but not every user-visible upstream or streaming failure. |

The repo showed these key surfaces in `apps/web/src/app/onboarding/actions.ts`, `apps/web/src/app/today/page.tsx`, `apps/web/src/app/api/courses/[id]/tutor/route.ts`, and `apps/web/src/modules/learning/tutor.ts`. There was no existing setup report, project profile, or accessible event schema to confirm the precise production event taxonomy, so both scouts are explicitly calibrated to close out safely and report missing coverage rather than inventing a regression. If either becomes noisy, set its scout config `emit` to `false` to keep it in dry-run mode.

## Replay Vision scanners

A scanner is an LLM that watches individual session recordings on a schedule and pushes qualifying observations to the Self-driving inbox. These are the only items in this setup that spend Replay Vision quota. Each finding arrives at half weight and needs independent corroboration before promotion to a report.

| Monitor | Status and scope | Sampling | Estimate |
| --- | --- | --- | --- |
| **CampusOS academic setup breakage** | Created. Watches recordings that visit `/onboarding`, CampusOS’s course-plan completion flow, for visibly broken institution/programme/course setup and setup that fails to reach Today. | 50% | 0 projected observations and 0 projected monthly credits because no recordings exist yet. |
| **CampusOS student frustration** | Created. Watches rage-click sessions across the product for repeated failed setup, timetable, assessment, notes, and tutor interactions. | 100% | 0 projected observations and 0 projected monthly credits because no recordings exist yet. |

The organization had 2,500 Replay Vision credits remaining and was not exhausted at setup time. Both monitors are armed and will start working automatically when recordings begin.

## Files created

- `posthog-self-driving-report.md`
- `.claude/skills/replay-vision-scanners-core/`
- `.claude/skills/replay-vision-scanner-broken-experiences/`
- `.claude/skills/replay-vision-scanner-user-frustration/`

No application source files were modified.

## Follow-ups

- [ ] Configure or confirm browser `posthog-js` initialization in `apps/web` with its real environment-backed project configuration. Do not disable session recording or exception capture in the init options.
- [ ] Connect an inbound Support channel (email, inbox, or Slack) in PostHog so enabled support tickets can reach Self-driving.
- [ ] Let the GitHub Issues source complete its first sync; the responder is already enabled.
- [ ] Add explicit non-identifying telemetry for the academic setup-to-Today and tutor request/response journeys so the custom scouts can measure their discriminators rather than only identify coverage gaps.
- [ ] Reauthorize the MCP connection with property-definition read access if future setup work needs direct event-schema discovery.

## What happens next

The scout coordinator picks up the fresh configurations within about 30 minutes. Scout runs draw from the verified daily budget, observations and source events cluster into Self-driving reports in the inbox, and immediately actionable reports can begin coding tasks.