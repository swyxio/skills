# Sample code (reference excerpts)

Portable patterns extracted from the **AIEWF 2026 internal schedule** aiebot (`swyxio/aiewf2026-internal-schedule`). Files are **illustrative** — types/helpers are abbreviated; copy the pattern, not necessarily verbatim imports.

| File | Pattern |
|------|---------|
| [orchestration-dry-run-and-query.ts](./orchestration-dry-run-and-query.ts) | Planner → validate → cumulative dry-run → persist drafts; apply with `expectedVersion` + session resolution |
| [session-memory-with-outcomes.ts](./session-memory-with-outcomes.ts) | Session context with DRAFT/APPLIED/IGNORED; record Apply/Ignore |
| [proposal-validate-and-normalize.ts](./proposal-validate-and-normalize.ts) | Allowlisted patch keys, alias normalization, placeholder coercion |
| [client-request-queue.ts](./client-request-queue.ts) | FIFO queue, queued vs active UI, Stop vs Remove |
| [version-stale-ux.ts](./version-stale-ux.ts) | Version poll, stale banner, API 409 handling, apply error surfacing |

**Slack flags** (no separate sample file): see `functions/_lib/slack-flags.ts` + `buildHelpBlocks` in `functions/_lib/slack.ts`; documented in the main SKILL § Slack inline flags and in [slackbot-builder](../../slackbot-builder/level-3-interactive.md).

Source paths (full repo):

- `functions/_lib/slack-flags.ts`
- `functions/_lib/slack.ts`
- `src/domain/aiModels.ts`
- `functions/_lib/aiebot.ts`
- `functions/_lib/aiebot-store.ts`
- `functions/_lib/ai.ts`
- `functions/api/schedule/version.ts`
- `src/frontend/components/AiebotPanel.tsx`
- `src/frontend/scheduleSync.ts`
- `src/api/client.ts`
