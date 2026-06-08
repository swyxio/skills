# Audit / change log — operational deep-dive

Operational companion to the **audit/change log** principle in SKILL.md. The core principle (immutable, append-only; track actor + action; support snapshot / rollback / restore) lives in SKILL.md as a first-class non-negotiable. This file covers the runtime mechanics of exposing that log through an **audit mode** copilot, and the serverless execution budget that path runs into.

## Audit-mode access (Slack + web parity)

Audit/history is **opt-in, sensitive, and token-heavy** — never on by default.

| Control | Purpose | Notes |
|---------|---------|-------|
| **`!audit [duration]`** (Slack) / "History access" checkbox (web) | Opt-in audit/operations history + prefetch | Sets `mode: "audit"` (read-only). Auto-picks the **audit default model** unless `!model` overrides. |
| **`!mine`** | History: only the requester's edits | Requires knowing requester email in the adapter. |
| **"not by me"** (natural language) | Maps to `exclude:<email>` on history prefetch | Users say this more often than a flag. |
| **`!verbose`** | Full before/after diffs in history results | Compact by default; verbose blows context. |

**Prefetch + turn cap:** in audit mode the server **prefetches** history before turn 1, and the system prompt forbids "I will check…" stall answers. With the prefetch in place, **turn 1 can usually answer — cap audit turns** accordingly. The `historyQueryPrefix` (`after:…`, `actor:…`, `exclude:…`) is prepended server-side to every `history` lookup so the model cannot "forget" the time window.

**Audit default model = mid reasoning tier** (e.g. `…-medium`), **not** the slowest/highest tier. The audit answer is mostly *summarizing already-prefetched events* — it does not need max reasoning, and the high tier silently killed the audit path (below).

## Super-long audit requests (serverless execution budget) — production lesson

Audit/history is the **slowest path you have**: opt-in history prefetch + token-heavy context + (tempting) the strongest model + a multi-turn agent loop. On a serverless background task (Cloudflare Pages `waitUntil`, Lambda, etc.) there is a finite execution budget. A run that exceeds it is **killed mid-flight**: no reply, no error reaction, and **no telemetry row** — the user sees only the ack (e.g. the eyes reaction) forever. This is worse than an error because it looks like the bot ignored them.

**Two compounding causes (both real, seen in prod):**

1. **Slowest model + high reasoning + many turns** simply runs 1–2 min. The audit answer is mostly *summarizing already-prefetched events* — it does **not** need max reasoning.
2. **Provider HTTP calls with no timeout** hang indefinitely on a stalled response. Across several turns this blows any budget and the platform reaps the whole task.

**Diagnose with the run-log table, not just logs.** A killed run writes **nothing** (the `success` insert is never reached; the `error` insert only fires on *caught* throws). So:
- A gap between "request accepted" events and recorded `*_runs` rows = silent kills.
- `GROUP BY model, outcome` with `MIN/MAX(duration_ms)`: the slow model shows huge max durations and the killed attempts are simply absent. (In prod: audit on the high tier ran 19–132s and the reaped ones recorded 0 rows; the same path on a mini/medium tier finished in 2–5s.)

**Fixes (cheap, no new infra — do these first):**

- **Hard timeout on EVERY provider call** via `AbortController` (covers the request *and* the streaming body read; clear the timer in `finally`). A stall now throws → the per-provider `try/catch` degrades gracefully (deterministic fallback + provider note, or a posted error) instead of hanging. This alone guarantees the ack surface always resolves to a reply or error.
  - **Streaming calls need an IDLE timeout, not a total-duration cap** (regression learned the hard way). A flat "abort after 120s total" **kills a long-but-healthy answer mid-stream** — a compound request (e.g. place 5 talks at once) legitimately streams for minutes, and the user sees `provider call exceeded 120000ms timeout` right when it was almost done. Instead, **reset the abort timer on every byte of activity** and only abort after a genuine stall (no data for the window). Feed an `onActivity` callback through the SSE reader (fires per network chunk, incl. keepalives during reasoning), and `reset()` the timer there. Net: actively-progressing streams run as long as they need; truly hung streams still fall back. Keep the **total** cap only for **non-streaming** one-shot calls (lookup turns, summaries) where "too long" really does mean "hung". Workers/Pages don't bill awaited I/O as CPU, so a multi-minute *active* stream is fine; an *idle* one is the real risk.
  - Log when the **idle** abort actually fires (`console.warn` with provider + ms) so a real hang is distinguishable from a slow-but-fine response.
- **Lower the audit default model** to a mid reasoning tier. Capable enough to summarize prefetched history; fast enough to finish in budget.
- **Cap audit turns** — with a history prefetch, turn 1 can usually answer.
- **Always emit the terminal state in `finally`** (swap working→done/error reaction, close the stream), never only on the success branch — so even an unexpected throw flips the ack off "working".
- **Record provider + model + turns + duration + outcome per run** so silent kills are detectable as *missing* rows.

**When the work genuinely needs minutes** (deep multi-turn audit reasoning that must never drop): move it **off the request path** into a durable runner — Cloudflare **Workflows** (durable steps, per-step retries, unlimited wall time), a queue, or a DO alarm. Pattern: ack instantly → kick off a durable instance → post the result back when done. Do **not** rely on `waitUntil` for multi-minute work. Caveat: durability ≠ speed — a Workflow that runs 2 min is reliable but the user still waits 2 min, so prefer making the path *fast* (timeout + faster model) before reaching for durable execution.

Reference: `functions/_lib/ai.ts` (`providerCallTimeout` with `reset()`, `STREAM_IDLE_TIMEOUT_MS` vs `PROVIDER_CALL_TIMEOUT_MS`, `readSse(…, onActivity)`, per-provider `try/catch` fallback), `src/domain/aiModels.ts` (`AUDIT_AI_MODEL_SLUG`), `aiebot_runs` telemetry in `aiebot-store.ts`.
