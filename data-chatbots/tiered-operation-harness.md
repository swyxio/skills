# Tiered operation harness (secondary refactor plan — adopt after MVP)

**Read this AFTER you have shipped a simpler copilot and run it long enough to learn your real use cases.** This is not day-one required reading. Start with one bespoke op per intent (`create`, `move`, `cancel`, …) — it is the fastest way to discover which phrasings users actually send and where the "passed review, failed apply" gaps live. Once that bespoke surface starts growing **one op + one repair coercion per phrasing**, graduate to the harness below. It was built and proven in a real codebase (179 tests green); the value is real but the timing matters — premature collapse hides the very cases the collapse is supposed to absorb.

The trap it solves: a write surface that grows `create`, `move`, `multi_move`, `cancel`, `swap`, `rotate`, `create-on-placeholder`, `create-that-should-be-a-move`… Each new intent adds a code path, a validator branch, and a coercion — and the *gaps between them* are where "passed review, failed apply" bugs live (the `cfp_proposal_id` dedup bug in SKILL.md is one instance). Collapse the **copilot** surface into **three tiers** over **one selector**.

## Three capability tiers

| Tier | Audience | Surface |
|------|----------|---------|
| **1 — hot paths** | default model; humans | Ergonomic, on-rails intents (`place`, `move`, `edit`, `cancel`, `swap`, `rotate`, `addSpeaker`). IDs come from the compact index. **Sugar** — each lowers to *either* one Tier-2 primitive *or* an ordered, atomic `batch` of them (saga). Default mode. |
| **2 — advanced primitives** | explicit opt-in (`!advanced` / checkbox) | A *small composable* set: `assignment.upsert`, `assignment.rebind`, `speaker.upsert`, `slot.upsert`, `room.upsert`, `batch`. The long tail (reactivate, dedup, replace-A-with-B, roster refresh, multi-entity atomic change) is *expressed*, not *coded*. |
| **3 — audit** | explicit opt-in (`!audit` / checkbox) | Read-only change history. See [audit-log.md](audit-log.md). |

### Mode gates BOTH the schema and the prompt

A per-request `mode` flag (`hot` default | `advanced` | `audit`) is built into the run, and it gates two things together:

- the **planner schema** — the `targetType` enum only contains the tiers the mode unlocks (`hot` exposes Tier-1 only; `advanced` additionally unlocks the primitives + `batch`; `audit` is read-only).
- the **system prompt** — the model is only told about the vocabulary its mode can emit.

Don't show the model 14 primitives when 8 ergonomic intents cover 95% of traffic — gate the long tail behind an explicit opt-in.

**Cross-surface parity:** a web dropdown/checkbox (`mode: "advanced"`) and a Slack `!advanced` flag both set the mode; `!audit` sets audit mode. Same orchestration core; only the adapter differs.

## The minimal Tier-2 primitive set

- **`assignment.upsert {match, set}`** — create-or-update over the selector. Resolve 0 → create, 1 → update (incl. reactivating a cancelled row when `set` re-slots it), many → reject `ambiguous_match`. Idempotent on a unique external key that matches **active OR cancelled** rows. This single primitive subsumes **create, edit, fill-placeholder, move, unschedule, cancel, reactivate, and link/dedup** — the entire create/move/reactivate/dup-id family that previously needed N ops + coercions dissolves into it.
- **`assignment.rebind {moves}`** — atomic multi-row slot reassignment (`moves: [{match, toSlotId}]`). Validates the *final* arrangement, so a cycle is allowed when each target slot's occupant is also in the move set. **`swap` (2-cycle) and `rotate` (N-cycle) are just rebinds**, not separate ops.
- **`speaker.upsert` / `slot.upsert` / `room.upsert`** — the same create-or-update shape for the other entities.
- **`batch {summary?, ops: [{kind, summary, ...opArgs}, …]}`** — many primitives, **one transaction, one version bump**. Applied **cumulatively** (op N sees op N-1) in a single DB transaction. Atomic: all-or-nothing rollback, one audit/version bump, one Apply card — instead of N drafts that can partially apply and strand the schedule.

## One selector resolver

One resolver answers "the row(s) I mean" for every write primitive, replacing the scattered repair layer (id-resolution, dedup, placeholder-coercion). Keys evaluated in priority order; the first present category decides matching:

- `{id}` → exact row (any status, incl. cancelled).
- `{slotId}` → the slot's **active occupant**, else its empty-placeholder holder.
- external key `{externalKey e.g. cfpProposalId | …}` → the row carrying that key **whether ACTIVE OR CANCELLED**. *This* is the dedup primitive that turns a duplicate "create" into a move/reactivate.
- fuzzy `{title?, speaker?, track?, day?}` → AND-ed substring over active rows.

Returns **0 / 1 / many**: `0` → `upsert` creates, `rebind` errors (`no_match`); `1` → the row; `>1` → reject with an **ambiguity candidate list** (`ambiguous_match`) so the caller narrows.

**Lesson: every selector key must also be searchable on the read side.** If a key (external id, hash) is enforced by the DB but absent from every lookup, the agent can't discover existing links and will duplicate. Index it in a lookup *or* enforce dedup deterministically server-side — don't rely on prompt instructions for a collision the model can't see.

## Hot paths lower to one primitive OR an atomic batch (SAGA)

Hot-path sugar is **not 1:1** — the lowering layer (the desugarer) composes the plan, not the model. The model names a *simple* intent + ids from the index; the desugarer decides whether that intent is one primitive or a multi-step `batch`, and orders the steps **"free capacity first, then fill"** so the batch's all-or-nothing rollback *is* the saga compensation. The expansion happens server-side from live occupancy, so the model never reasons about compensation.

| Hot path | Lowers to |
|----------|-----------|
| `edit` / `move` / `cancel` / place-into-open | a single `upsert` (or `rebind`) |
| replace A with B / place-into-occupied | `batch[cancel A (or occupant), upsert B into slot]` (free-then-fill) |
| swap-with-content | `batch[rebind, upsert]` |

A multi-primitive hot path surfaces to the human as **one batch card** (the `targetType:'batch'` contract the frontend renders).

**HOLD / reserved rows are the exception** — never auto-overwritten. A create/place onto a hold is refused, not replaced.

## Migration note — collapse the copilot surface, keep the human/legacy vocabulary

Migrate non-breaking: add Tier-2 alongside the existing ops; make the old target-type names **decode-only aliases** that desugar to primitives; prove parity with tests (create/edit/move/cancel/reactivate/link/swap/rotate via the primitives, batch atomicity + rollback, selector ambiguity + cancelled-row match) **before** retiring anything.

**The real-world asymmetry that shipped:** the **AI write surface fully collapsed** onto these primitives, but the legacy op types (`assignment.create` / `assignment.move` / `assignment.cancel` / `assignment.multi_move`) were **intentionally KEPT** — they back the human direct-manipulation UI and the audit-history rendering (action strings), not the copilot. "Redundant for the copilot" ≠ "removable from the product." Safe scope: **collapse the copilot surface, keep the human/legacy vocabulary.** Retire only what no surface emits and no audit row references.

## Behavior shift to evaluate during the MVP window

The most user-visible change: **"place onto an occupied slot" becomes an atomic replace draft** (free-then-fill batch) instead of being dropped as `slot_occupied`. Watch this in real traffic before committing — confirm users want a replace card rather than a refusal, and confirm HOLD rows are still being refused (never silently overwritten).

Reference: `src/domain/assignmentSelector.ts` (one resolver), `src/domain/operations.ts` (`assignment.upsert`/`rebind`, `batch`, `ambiguous_match`/`no_match`), `functions/_lib/aiebot.ts` (`proposalToOperationBody` desugaring), `functions/_lib/ai.ts` (`buildPlannerSchema(mode)`, `resolvePlannerMode`).
