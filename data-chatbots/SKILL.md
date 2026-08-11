---
name: data-chatbots
description: Design or review an AI copilot over authoritative structured data that proposes mutations for explicit human approval (draft → apply). Use for scheduling, CRM, configuration, or similar proposal workflows; do not trigger for read-only Q&A, a general chat UI, or a bot that is not allowed to mutate canonical state.
---

# Data chatbots

The model is a planner, not a writer. The copilot reads authoritative state,
returns a bounded answer plus structured proposals, and changes canonical data
only through the existing write path after explicit human approval.

## Non-negotiable write contract

- Keep planner, validator, cumulative dry-run, draft persistence, and apply as
  separate stages. Drafts are not canonical state.
- Allowlist operation kinds, fields, aliases, and entity IDs. Resolve ambiguous
  matches instead of guessing.
- Apply through the same authorization, version, transaction, and append-only
  audit path as the manual UI. Record actor and outcome.
- Model database invariants in the dry-run where possible: unique external
  keys, foreign keys, checks, occupancy, and interacting proposals. Report
  dropped drafts instead of claiming success when none remain.
- Store authoritative proposal outcomes (`DRAFT`, `APPLIED`, `IGNORED`, and
  `FAILED`) in follow-up context. The assistant must use tentative language
  until an apply outcome says the change happened.

## Destruction and concurrency

The operation applied must have the same scope as the operation reviewed.

- A plain placement whose target became occupied after drafting must fail and
  request a re-draft; apply must not synthesize a cancel, replacement, move, or
  cascade that was not shown to the human.
- If replacement is supported, lower it to an explicit destructive proposal at
  draft time, show the affected identity, and require the product's approval
  control. Enforce the same default-deny rule at the reducer/write boundary so
  planner heuristics cannot overwrite real content.
- Classify placeholders by content and active status, not one missing field.
  Descriptive or ambiguous rows are real bookings; cancelled rows may be
  reactivated when the product's identity rules allow it.
- For a unique external/import key, look up active and cancelled rows and
  deterministically update/move/reactivate the existing row rather than
  inserting a duplicate. Every dedupe key must be searchable or guarded at the
  write choke point.
- Chain optimistic versions for bulk apply, handle conflicts visibly, and do
  one final refresh rather than fanning out requests with one stale version.

## Planner and session behavior

- Give the planner a compact index plus focused lookups, not full tables. IDs
  used for dedupe or mutation must be present in an index or server resolver.
- Decompose a compound request into one visible proposal per independent
  operation, order dependent frees before fills, and dry-run the cumulative
  batch.
- Read-only history/audit access is opt-in and scoped. Do not put sensitive
  change history into ordinary context.
- Queue client turns FIFO when a long run is active; do not run overlapping
  planners that can overwrite proposal/session state. Preserve prior cards and
  their statuses.
- Distinguish chat/provider errors from apply/validation errors. A rejected
  apply must be recorded before retrying so the planner does not emit the same
  doomed proposal.

## Optional surfaces and references

Web, Slack, and email are adapters over the same orchestration core. Load only
the resource needed by the requested surface or failure mode:

- [test-cases.md](test-cases.md) for acceptance scenarios and regressions;
- [audit-log.md](audit-log.md) for opt-in history and long-running audit work;
- [email-surface.md](email-surface.md) for inbound email authentication,
  idempotency, threading, and durable handoff;
- [observability.md](observability.md) for tracing and human feedback;
- [surface-ux.md](surface-ux.md) for a floating/dockable copilot panel; and
- [tiered-operation-harness.md](tiered-operation-harness.md) only after an MVP
  demonstrates that operation-surface duplication is the actual problem.

The samples are illustrative patterns, not a project contract. Inspect their
callers before copying them and adapt them to the product's existing authority.

## Focused test minimum

Cover the smallest set that proves the product's contract:

- draft/ignore/apply/failure outcomes and follow-up memory;
- allowlists, aliases, ambiguous IDs, and DB invariants;
- occupied-slot or real-content overwrite, placeholder classification, and
  apply-time scope expansion;
- stale versions, sequential bulk apply, and visible errors;
- compound requests and cumulative dry-run ordering; and
- each shipped adapter's authorization, idempotency, and identical proposal
  semantics.

Do not require Slack flags, email, tracing, panel state machines, or a tiered
operation schema when those surfaces are not part of the product under review.
