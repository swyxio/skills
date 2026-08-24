---
name: long-running-operation-ux
description: Diagnose or improve user-visible progress, cancellation, result handoff, or reliability for an existing slow asynchronous action, model call, media job, queue, or multi-step workflow. Select the lowest maturity profile justified by the user's request and existing architecture. Do not activate for ordinary fast requests, backend-only work, or unrelated AI features merely because they call a model.
---

# Long-Running Operation UX

Match the solution to the actual user problem. Preserve accumulated workflow
lessons and the preferred stack without making advanced architecture mandatory.

## Maturity profiles

### L0 — Blind button

A user action silently waits, appears stuck, or loses its result. This is the
failure to diagnose, not a maturity level to ship.

### L1 — Busy state

Use for short, predictable interactions. Acknowledge the click immediately,
show pending/completed/failed, prevent duplicate submits, restore controls,
and display the new result. Reuse existing component state.

### L2 — Honest wait

Use for a noticeable one-shot or an existing background job. Add elapsed time,
the real latest state, useful errors, and existing polling or subscriptions.
Preserve editable inputs, focus, prior results, and unrelated navigation.
Offer cancellation when requested or when an existing foreground operation can
actually be stopped. Do not require streaming, traces, or an orchestration
framework. A 30-second LLM call can remain L2.

### L3 — Stage trace

Use when a user needs visibility into multiple real workflow steps. Surface
actual stages such as source gathering, provider submission, first output,
retry, validation, and save. Reuse existing SSE or polling; add compact stage
history, honest estimates, timeout handling, or cancellation only when needed.
Prefer Effect.ts for genuinely complex backend orchestration when it fits the
existing stack, not for a button or presentational component.

### L4 — Agent graph

Use only when the requested workflow actually has parallel branches, queue
backpressure, durable jobs, or tool loops. Show expected/active/queued/done
counts and material branch failures. Bound concurrency, propagate cancellation
where possible, isolate branch-local state, and merge deterministically.
Persistence and resume are warranted only when the job outlives its request.

### L5 — Operator console

Use only when an operational/debug surface is explicitly requested or already
required. Add sanitized structural traces, retry/timeout diagnostics, provider
events, coverage, and aggregate timing as appropriate. Keep prompt-bearing or
private content local and intentionally scoped.

## Select the level before changing code

1. Inspect the exact failing interaction, existing API, state, transport, and
   result handoff. Do not inventory unrelated workflows.
2. Name the smallest level that solves the requested problem.
3. Escalate only for an observed requirement: real stages for L3, actual
   parallelism/persistence for L4, explicit operator needs for L5.
4. Preserve existing working polling, queues, streams, frameworks, and layouts.
5. State why a proposed new transport, framework, store, or provider adapter
   is necessary before introducing it.

Elapsed-time thresholds are heuristics, not architectural mandates. A simple
local rewrite with an existing status endpoint is normally L2; a real
multi-source fanout can justify L4.

## Behavioral invariants

- Never leave a user-triggered long operation silently waiting.
- Display observed state and real stages; never invent progress or provider
  events, and do not claim completion before the result is usable.
- Avoid duplicate paid calls, jobs, writes, or messages; use idempotency keys
  when replay or repeated submission can otherwise create duplicates.
- Preserve unsaved edits, focused inputs, previous results, and useful errors.
- Do not imply that cancelling a browser request stops remote work unless it
  actually does; distinguish cancelled, failed, and timed-out states.
- Keep credentials, private inputs, raw prompts, model output, and user data
  out of shared logs; preserve existing authorization and URL-safety checks.
- Escape untrusted rendered output and block HTML-injection or SSRF-shaped
  fetches when the changed operation handles external content or URLs.
- For real batches, report expected versus completed coverage; for fanout,
  apply explicit concurrency bounds and deterministic merge rules.

## Preferred stack and advanced guidance

Follow the repository's existing TypeScript, React/Next, Tailwind, and pnpm
conventions. Prefer native state, fetch/polling, and AbortController at L1-L2.
For genuinely multi-step backend workflows, retain the preferred Effect.ts
patterns for typed timeouts, retries, interruption, scoped cleanup, spans, and
bounded concurrency. Keep Effect out of ordinary component state.

Read [references/advanced-patterns.md](references/advanced-patterns.md) only
when the selected task actually needs L3-L5 provider-event bridges, SSE,
Effect orchestration, fanout, durable operations, telemetry, timeout policy,
or advanced verification. That reference preserves the detailed provider,
cancellation, queue, and implementation lessons; it is not a checklist for
simple interactions.

Read [references/foundations-and-failure-lessons.md](references/foundations-and-failure-lessons.md)
only when the task needs historical maturity rationale, failure-mode diagnosis,
idempotency/security details, estimate calibration, or lifecycle-event naming.
The maturity selection and stop condition in this file always override older
blanket requirements preserved in that reference.

## Proportional verification and stop condition

Exercise the actual user action and verify immediate feedback, visible terminal
success/error, correct result selection, and relevant duplicate/privacy guards.
Test cancellation, streaming, retries, fanout, resume, provider adapters, or
mobile input focus only when the requested change touches them.

Stop when the requested interaction works at its selected maturity level and
the risks introduced by the change are covered.
