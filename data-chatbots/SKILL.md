---
name: data-chatbots
description: >-
  Design and implement AI copilots that analyze structured data and propose
  mutations for human approval (draft → apply), not direct writes. Covers
  prompting, multistep compound requests (remove + add in one turn), FIFO client
  queuing for long agent loops, validation, session memory, optimistic versioning
  UX, copilot panel/surface ergonomics (floating-dockable panel, summon-hotkey
  size state machine), LLM tracing/observability (OpenInference + OTLP session.id
  grouping, orphan-span fixes, human thumbs up/down feedback annotations), and test
  matrices. Use when building scheduling/admin chatbots, proposal workflows,
  human-in-the-loop agents, or reviewing aiebot-style features.
---

# Data chatbots

Copilots over **authoritative structured state** (schedules, CRMs, configs) should **draft** changes and **apply** only after explicit human approval. Treat the model as a planner, not a writer.

Apply this guidance to the requested copilot surface and the data risks it
creates. Draft-before-apply, apply-equals-review, authorization, and prevention
of silent destructive replacement are invariants when the workflow can mutate
authoritative data. The remaining incidents, layers, telemetry, caching, email,
and advanced harness patterns are risk-triggered guidance or opportunities, not
a mandate to implement the entire platform. Stop when the requested workflow is
correctly proposed/applied and focused tests cover its plausible integrity
failure; report unrelated hardening as follow-up.

## Battle scars (select those matching the touched risk)

These are real failures from running aiebot against live data. Each is a
permanent check for the surface that can reproduce it, not a universal gate for
every copilot change. Select the incidents whose preconditions exist in the
requested workflow and wire those guardrails before shipping that risk.

1. **Silent apply-time overwrite (TOCTOU) — caught in prod, almost lost a real talk.** A human approved a plain `assignment_create` ("place this talk into the 11:10 **open** slot"). Between draft (slot empty) and Apply ~7 min later, that slot got filled by another talk. The apply path **re-derived occupancy from live state and silently lowered the placement into `batch[cancel occupant, place new]`**, cancelling a real talk **nobody approved**. Only the immutable audit log revealed it. **Guardrail: what you APPLY must equal what was REVIEWED — never synthesize a more-destructive op at apply time.** See *Apply == review* below + test §5.10. The version guard does **not** save you (it matched).
2. **Unique external/import id → can't insert, must reactivate.** A `*_create` re-linking an already-used `cfp_proposal_id` died at apply with `UNIQUE constraint failed` — including *soft-deleted* rows that still own the key. Dry-run modelled occupancy but not external-id uniqueness, so it "passed review, failed apply." **Guardrail: dry-run every DB invariant; deterministic create→move/reactivate guard at the apply choke point.** See *External / import ID uniqueness*.
3. **Apply failure had no feedback loop (the missing 4th outcome).** A rejected apply left the proposal `draft`, wrote no session line, and the planner re-read it as "pending" and re-proposed the identical doomed change. **Guardrail: record an authoritative `[Apply FAILED …]` line before re-throwing; teach the planner it's terminal.** See *Session / follow-up context*.
4. **Audit/history run silently killed on serverless.** The slowest path (opt-in prefetch + token-heavy + tempting strongest model + multi-turn) blew the background execution budget and was killed mid-flight — no reply, no error, no telemetry row. **Guardrail: hard per-call timeout, mid-tier audit default model, capped turns, terminal state in `finally`, per-run telemetry.** See [audit-log.md](audit-log.md).
5. **"Open" in the UI ≠ "open" in the index.** Seed placeholder holder rows make a slot look empty while the DB still has an active assignment; `open_slot` lookups missed them and metrics undercounted. **Guardrail: two placeable kinds (open + placeholder); feed `placeableSlotsByDayRoom`; exclude HOLD/reserved.** See *Schedule data*.
6. **Bulk apply fanned out one fixed `expectedVersion`.** Applying N drafts with the same starting version made #2..N throw `version_conflict`. **Guardrail: chain each apply's returned version into the next; one final refresh.** See *Bulk review / mass-approve*.
7. **Second overwrite — a real talk misclassified as an empty placeholder (no TOCTOU).** Months after #1 we lost another talk by a *different* route. A **confirmed** talk titled `"TBD — <speaker> on <topic>"` had its speaker named only in the title (empty `speakers` array). The placeholder heuristic was "no linked speaker ⇒ empty holder", so it was listed as placeable and a **benign `assignment` update** overwrote its content **in place** — no slot change, no version skew, nothing the #1 apply-time guard watched for. A prod query showed *dozens* of real talks (speaker pending) were sitting ducks. **Two guardrails: (a) don't infer "empty" from one fragile signal — a real talk can lack a linked speaker; classify by content (descriptive title ⇒ real booking) and treat ambiguous as real (default-deny). (b) A REPLACEMENT is destructive too — enforce "no destroy without explicit opt-in" at the *write layer* (the reducer), keyed on the target's actual content, so it catches every vector regardless of how the planner classified the row.** See *Destruction must be explicit* below + test §5.11.
8. **Over-eager destruction guard blocked a legitimate reactivation — the guard you added in #7 will overreach if it ignores `status`.** A user **cancelled** a talk, then asked to re-place that same talk into the same slot (with a corrected CFP id). The `isDestructiveReplace` reducer guard (from #7) fired and **refused every draft** — the planner kept surfacing the internal "cancel-then-place" escape hatch and `allowReplace` flag to a confused user. Root cause: the guard classified the **cancelled** row as a live `booking` (it still had a real title + speaker) and saw the CFP id "swap" (old → corrected) as a destructive identity replace. But a cancelled row **occupies no slot and erases nothing** — reactivating it *is* the intended reuse path (it's exactly what battle scar #2's reactivate-don't-recreate guidance wants). **Guardrail: a destructive-replace guard must be keyed on the target being *live*, not just on its content — short-circuit (`return false`) when `before.status === 'cancelled'`.** A guard that's too strong is its own incident: it doesn't lose data, but it makes the legit hot path impossible and pushes users toward the internal override they were never meant to see. See *Destruction must be explicit* below + test (`overwrite-repro.test.ts` — "ALLOWS reactivating a CANCELLED assignment in place").

> **Cheap forensic check:** a read-only script that walks the audit log for **cancels whose reviewed proposal did not approve a cancel** (executed op cancelled a talk, but the stored proposal was a placement/move, not an explicit cancel or a batch with a visible cancel op) finds every silent overwrite after the fact. Run it periodically; once the apply-time guard ships it should always return zero.

## Architecture (non-negotiables)

| Layer | Responsibility |
|-------|----------------|
| **Planner** | Reads compact index + optional lookups; returns answer + structured proposals |
| **Validator** | Allowlisted patch keys, real entity IDs, domain rules (conflicts, occupancy) |
| **Dry-run** | Simulate proposals cumulatively on in-memory snapshot; drop invalid drafts before humans see them |
| **Persist drafts** | `draft` / `applied` / `ignored` status in DB, separate from canonical state |
| **Apply path** | Same mutation pipeline as manual UI (`expectedVersion` + audit log) |
| **DB invariants** | Enforce mutual exclusivity in SQLite, not only in TS (partial UNIQUE + CHECK) |

One orchestration function per product surface (web, Slack, email) so behavior stays identical. The **email surface** (forward-an-email-to-the-copilot) is another adapter over this same core — parse inbound MIME, call the core, reply, and mirror to Slack. Its platform-specific concerns (separate inbound Worker, durable-execution handoff for the ~30s handler limit, idempotency + loop guard + allowlist + SPF/DKIM-gated approvals, threading via `Message-ID`/`In-Reply-To`/`References`, and the deliverability bounce battle scar — *the reply `From:` must round-trip or approvals bounce*) live in [email-surface.md](email-surface.md).

### Audit / change log (immutable)

The audit/change log is **immutable (append-only)** and **tracks the actor (which user) and the action taken** on every change to canonical state. Ideally it also backs **snapshot / rollback / restore** of canonical state. Every apply path writes through it (see *Apply path* above). Operational deep-dive (audit-mode access, prefetch/turn caps, serverless execution budget): [audit-log.md](audit-log.md).

### Observability / tracing (separate from the audit log)

The audit log is your *immutable record of canonical-state changes*; **LLM tracing is a separate, lossy observability stream** of what the agent did per turn (spans, tokens, cost, tool calls) sent to a backend like Arize AX / Phoenix over OpenInference + OTLP. Don't conflate them. The non-obvious traps — grouping multi-turn traces with **`session.id`** (each turn is correctly its own trace; without `session.id` it just *looks* like single-turn capture), the **"spans without root spans"** orphan bug on serverless (root span dropped at flush), and **human 👍/👎 feedback capture** (own-DB source of truth + best-effort vendor annotation, span id resolved server-side) — live in [observability.md](observability.md).

### Slot occupancy (schedule-shaped products)

Enforce in **SQLite**, not only application code:

- **Partial UNIQUE** on `assignments(slot_id)` where `status != 'cancelled'` — at most one active occupant per slot.
- **CHECK** `(status != 'cancelled' OR slot_id IS NULL)` — cancelled rows cannot keep a `slot_id` (prevents “NO PROGRAMMING” ghosts shadowing a real talk).
- **App layer** mirrors DB: `releaseSlotWhenCancelled` on update; grid uses active-only `assignmentsBySlot`; map `UNIQUE`/`CHECK` failures to `409 slot_occupied`.

### Destruction must be explicit (apply == review, and replacements count too)

**A write that erases existing real content — overwrite, replace, or cancel — is destructive and must be (1) explicitly shown to the human and (2) enforced at the write layer.** We learned this in two incidents from two different angles:

- **Battle scar #1 (apply-time scope expansion / TOCTOU):** the *apply* path re-derived a more destructive op than the reviewed draft. (Below.)
- **Battle scar #7 (draft-time misclassification):** a real talk was wrongly classified as an empty placeholder, so a *benign-looking in-place update* destroyed it — with no slot change, no version skew, nothing #1's guard watched. (Case study below.)

The unifying lesson: **don't rely on the planner/heuristics to decide what's safe to destroy.** Put the invariant in the reducer — the single chokepoint every write flows through — keyed on the *target's actual current content at write time*: refuse to overwrite/replace a real booking's identity unless the caller explicitly opts in (`allowReplace`), and refuse to synthesize a cancel the human didn't approve. A write-layer guard catches both vectors regardless of classifier accuracy or draft/apply timing.

> **A too-strong guard is its own incident (battle scar #8).** The destructive-replace guard must protect only what's *live*. Key it on **status as well as content**: a `cancelled` row occupies no slot and erases nothing, so reactivating/re-placing it in place (e.g. with a corrected CFP id) is the intended reuse path — `isDestructiveReplace` must `return false` early when `before.status === 'cancelled'`. If it doesn't, the guard misfires on the exact "reactivate, don't recreate" flow (#2) and the planner ends up dangling the internal `allowReplace` escape hatch in front of a user who was never meant to see it. When you write a default-deny guard, also write the test for the *legitimate* destructive-looking action it must still allow.

> **Case study — battle scar #7 (placeholder misclassification).** "Empty placeholder" was inferred from one fragile signal: an empty `speakers` array. But a real talk can have its speaker pending or named only in the title (`"TBD — Charlie Holtz on Conductor for coding agents"`, status `confirmed`). It got exposed as placeable and overwritten in place by an `assignment` update. **Fixes:** (a) classify by *content* — a descriptive title means real booking even with no linked speaker; only short/empty label-like titles (`Keynote`, `M1`, sponsor holders) are fillable; treat ambiguous as real (**default-deny**). (b) Move occupant classification into **one shared module** used by both the planner index and the reducer, so the two layers can never disagree. (c) Add the write-layer `isDestructiveReplace` guard: an in-place update that swaps a booked row's title+speaker (or a different external/CFP id) for a different talk is refused unless `allowReplace` is set. Legit edits (rename, link a speaker, fill a real placeholder) pass untouched.

**The operation you APPLY must be identical in scope to the draft the human REVIEWED.** The dangerous gap is *time-of-check vs time-of-use*: a draft is reviewed against one snapshot and applied against a later one. If the apply path **re-derives** the operation from live state, it can quietly become **more destructive** than what was approved.

Real prod incident (battle scar #1): a reviewed `assignment_create` ("place into an **open** slot") was applied ~7 min later, after that slot had been filled by another talk. The apply path saw the slot occupied and **lowered the placement into `batch[cancel occupant, place new]`** — executing a cancellation of a real talk that **was never in the reviewed draft**. Recovered only because the audit log showed the synthesized cancel.

Why the usual guards don't catch it:

- **`expectedVersion` is necessary but not sufficient.** It detects *that* the world changed, not *whether this draft's specific preconditions still hold*. The bug fired even with **matching versions**, because scope was re-computed from live occupancy at apply. (Worse: clients often send the *current* version at click, not the version the draft was generated against — so the check passes trivially.)
- **Dry-run validated the harmless version.** At draft time the slot was open, so the simulated op was a clean place. The destructive lowering happened later, at apply, where nothing re-validated against what the human saw.

Guardrails (do all):

1. **Decide destructive lowering at DRAFT time, as a visible card.** If a placement targets an occupied real booking, the *stored draft* becomes an explicit replace (`batch[cancel X, place Y]`), so the reviewer sees — and separately approves — the cancel. Your risk analyzer should flag a cancel-bearing batch as destructive (unchecked by default).
2. **At APPLY time, refuse to expand scope.** A stored *plain placement* whose target slot is now occupied must throw (`409 slot_occupied` → "re-draft"); it must **not** synthesize a cancel. Only an explicitly-reviewed replace batch may cancel — and the reducer's occupancy check still guards it if the occupant changed again.
3. **Same rule for any destructive synthesis, not just cancels** — a create→move that relocates an existing talk, a delete that cascades, etc. If apply would do something the card didn't show, fail and re-draft.

This is the mirror of the cfp-dedup lesson: there the apply path must *converge* a create into a move; here it must *refuse* to diverge a placement into a cancel. The unifying invariant: **apply executes the reviewed intent or fails — it never invents new destructive scope.** (Split the lowering function by mode: a `preview` mode that lowers occupied placements into a visible replace for the draft, and an `apply` mode that throws instead of synthesizing — so the two paths can never drift.)

### External / import ID uniqueness — reactivate, don't recreate (the `cfp_proposal_id` lesson)

When rows carry a **unique external/import key** (CFP proposal id, Airtable record id, source row hash), a `*_create` that re-links an already-used key **cannot insert** — the DB unique index rejects it. The intent is almost always **reuse the existing row** (move / update / reactivate), not a duplicate. Real production failure: `db_write_failed: UNIQUE constraint failed: assignments.cfp_proposal_id`.

Three traps, all hit in one bug:

1. **Dry-run/validator models occupancy but NOT external-id uniqueness.** The proposal passed every in-memory check and died only at apply. **Lesson: the dry-run must simulate *every* DB invariant it can — unique external ids, FKs, CHECKs — not just slot occupancy.** When two validation layers (domain dry-run vs DB constraints) disagree, the gap is exactly where "passed review, failed apply" lives. The agent's own validation-repair retry won't catch it either: that loop re-runs the *same* domain validator, so a constraint the validator can't see is invisible to self-repair too.
2. **Soft-deleted rows still hold the unique key — match your guard predicate to the index predicate.** Occupancy uniqueness is partial (`WHERE status != 'cancelled'`); external-id uniqueness usually is **not** (`WHERE cfp_proposal_id IS NOT NULL`). A `cancelled`, unscheduled row still owns its `cfp_proposal_id` and blocks new inserts. A create→move guard that filters `status != 'cancelled'` (correct for occupancy) **misses the cancelled-row case entirely.** Decide per key whether cancelled rows count.
3. **You can't dedupe on a key you can't search.** No lookup indexed `cfp_proposal_id` (assignment lookup matched title/track/speaker; the bash virtual-FS didn't emit cfp ids), so `grep <cfpId>` returned nothing and the agent "reasonably" chose create. **Lesson: every identifier the agent must dedupe on has to be in at least one lookup/index** — otherwise prefer a deterministic server-side guard over prompt instructions.

**Defense in depth (do more than one):**

- **Deterministic writeback guard (surest).** At the single apply choke point, before building statements: if a `*_create` carries an external id already linked to a row, rewrite it to an **update/move of that existing row** (reactivate if soft-deleted: set the target slot, flip status off `cancelled`). Covers every surface (proposal apply, direct ops, imports) regardless of what the model emitted. Match the lookup's predicate to the *index's* predicate.
- **Validator-time conversion.** Convert `create`→`move` at draft time so the human sees a move card, not a doomed create.
- **Prompt guidance (weakest alone).** Tell the planner to look up whether the talk already exists (by the searchable fields — title + speaker if the id isn't indexed) and emit a move. Only reliable if the dedupe key is actually searchable.
- **Emergency data repair:** the operator fix mirrors the guard — **reactivate the existing (often soft-deleted) row** into the target rather than inserting a second one, so the unique link is preserved.

## Tiered operation harness (secondary — adopt after MVP)

The dedup lesson above is one instance of a broader trap: a write surface that grows **one bespoke op + repair coercion per phrasing** (`create`, `move`, `multi_move`, `cancel`, `swap`, `rotate`, `create-on-placeholder`…), and the *gaps between them* are where "passed review, failed apply" bugs live. The proven fix collapses the copilot surface into **three tiers** (hot paths → composable primitives → audit) over **one selector**, gated by a per-request `mode`. **Don't reach for this on day one** — run a simpler bespoke-op MVP first to learn your real use cases, then graduate. Full refactor plan (tiers, the `upsert`/`rebind`/`batch` primitive set, the one selector resolver, hot-path → saga lowering, mode-gating, and the "collapse the copilot surface, keep the human/legacy vocabulary" migration): [tiered-operation-harness.md](tiered-operation-harness.md).

## Prompting

### Voice: draft, not done

- **Never** use past tense as if the database changed: avoid "I moved", "I placed", "I created".
- Prefer: "I drafted…", "Proposed…", "Ready for your review…"
- System prompt must state: **proposals only apply after human Apply** (or equivalent).

### Grounding without hallucinating IDs

- Ship a **compact index** (counts, placeable slots with real IDs, catalogs) — not full tables.
- **Agent loop**: `need_more` + focused lookups; `final` + proposals, no more lookups.
- Explicit rule: placement IDs are **in the index** — do not ask the user for slot IDs the index already contains.
- Quantitative claims → deterministic reports or lookups, never invented numbers.
- **Any key the agent must dedupe/relink on must be searchable.** If a unique external/import id (cfp id, record id, hash) is enforced by the DB but absent from every lookup and the virtual FS, the agent can't discover existing links and will duplicate. Index it in a lookup *or* enforce the dedup deterministically server-side — don't rely on prompt instructions to avoid a collision the model can't even see.

### Schedule data: “open” in the UI ≠ “open” in the index (AIEWF / aiebot lesson)

Many schedules seed **structural holder rows** (generic title like `Keynote` / `Talk`, no real speaker) on every slot. The grid looks empty; the DB still has an active assignment. Copilots need **two placeable kinds** and must not conflate them:

| What humans see | Index field | How to book |
|-----------------|-------------|-------------|
| Truly empty slot (no row) | `openSlots` / `state: "open"` in `placeableSlotsByDayRoom` | `assignment_create` → `targetId = slot_*` |
| Empty **placeholder** holder | `state: "placeholder"` + `assignmentId` in `placeableSlotsByDayRoom` | `assignment` **update** on that `asn_*` (title/speakers/status) — **not** create on the slot |

**Feeding pitfalls (real production bugs):**

1. **`open_slot` lookups that only search `openSlots`** will miss every placeholder the user calls “open” (e.g. “5:10 PM Main Stage is free”). Prefer `placeableSlotsByDayRoom` in the compact index, or add a `placeable_slot` lookup that includes placeholders with clock time + `assignmentId`.
2. **`openSlots` / metrics “N open”** undercount session days — placeholders are placeable but not counted as open. Do not tell the user “0 open Main Stage” when placeholders exist.
3. **Virtual FS / bash `grep OPEN SLOT`** only marks slots with **no** assignment; placeholder keynotes appear as normal session files, not `OPEN SLOT`.
4. **Moves vs fills:** `assignment` patch `{ slotId }` into a placeholder-occupied slot **dry-runs as `slot_occupied`** (the holder still occupies the slot). To relocate an existing talk into that time: **swap** with the occupant, **fill the placeholder row** and clear/move the source talk, or **rotate** for 3+ — not a naive move into the slot id.
5. **Time disambiguation:** A “keynote window” (e.g. 4:30–5:30) often has **multiple** slot ids (4:30, 4:50, 5:10). “Closing keynote” may mean the **last** block, not the earliest sample in the index. When the user names a clock time, match that sample — do not auto-pick the earliest placeable in the group.
6. **HOLD / reserved rows are NOT placeholders:** Rows with `status: "hold"` or title `HOLD`/`Reserved` have no speaker but are **intentionally blocked**. They must be **excluded** from `placeableSlotsByDayRoom`. Validation must **drop** proposals that fill a hold row or `assignment_create` / `slotId` move onto an occupied booked or hold slot — never silent overwrite. When the user says “replace X’s slot”, resolve **X’s** `asn_*`, not the earliest placeholder in the track. This is a **draft-time** guard; it does **not** cover the case where the slot becomes occupied *after* an open-slot draft was approved — for that, see *Apply == review* (the apply path must refuse, not silently synthesize a cancel).

**Prompt + validator habits:** System prompt must document both `open` and `placeholder` states; coerce `assignment_create` on placeholder → `assignment` update; dry-run drops moves into real bookings with the occupant id in the reason; hold rows excluded from placeable index; apply refuses to expand an open-slot draft into a cancel (TOCTOU). See [test-cases.md](test-cases.md) §5.6–5.10.

### Underspecified requests

- Be **permissive**: draft now with TBD placeholders (title, speaker, slot) rather than refusing.
- Call out placeholders and auto-picked slots in the answer so humans can fix one field at a time.

### Multistep / compound requests (one message, many operations)

Users often pack a **roster refresh** into a single prompt — scope + several removals + one addition with pasted JSON:

> *"In Inference track, remove Perplexity's talk and Denis Yarats, and add …"* + `{ "proposal_id": "…", "speaker": "…", "session": "…", "description": "…" }`

Treat this as **one planning turn → many proposals**, not one vague mutation.

**Decompose into atomic drafts** (each gets its own summary + Apply/Ignore card):

| User intent | Typical proposal(s) |
|-------------|---------------------|
| Remove / drop / clear a booked talk | `assignment` update: `{ "status": "cancelled" }` or `{ "slotId": null }` on the resolved `asn_*` |
| Remove several talks | **One proposal per talk** — never merge unrelated entities into one patch |
| Add / place new talk | `assignment_create` or placeholder `assignment` update + `speaker_create` if new person |
| Replace A and B with C | Cancel A, cancel B, place C (3+ proposals in one response) |

**Resolution ladder** (use lookups until IDs are known — do not guess `asn_*`):

1. **Scope** — map "Inference track", "Day 4", "July 2" → `tracks` / `placeableSlotsByDayRoom` group (day + room).
2. **Find removals** — `assignment` / `speaker` lookup: company ("Perplexity"), speaker name ("Denis Yarats"), title substring.
3. **Disambiguate** — if multiple hits in scope, pick by track/day/time or ask; prefer assignments **in the named track**.
4. **Find placement** — earliest placeable sample in that track/room (`open` or `placeholder`); user did not name a time → pick one, **name it in the answer**.
5. **Ingest JSON blob** — map `speaker` / `session` / `description` / `proposal_id` → patch fields + CFP link keys; do not ignore the block because the sentence also had natural language.

**Agent loop:** Compound requests usually need `need_more` first (track + assignment lookups), then `final` with **all** proposals. Stopping after the first lookup with "I'll remove X" and zero drafts is a failure mode.

**Ordering & dry-run:**

- Emit proposals in logical order: **frees capacity first** (cancels / unschedules), then **fills** (create / update placeholder).
- Cumulative dry-run must simulate the **whole batch** — a create that only works after a cancel in the same batch should still `kept` if order is correct.
- If create targets a slot still occupied because cancels were dropped, surface that in the answer.

**Answer shape for multistep:**

- Short plan: scope, what you looked up, what you're proposing.
- **Numbered list** aligned 1:1 with draft cards (e.g. "1. Cancel Perplexity … 2. Cancel Denis Yarats … 3. Place Lin Qiao at 11:40 Track 9 …").
- Tentative voice for the bundle: "I drafted 3 changes…" — not "I removed and added."

**UX expectations:**

- One reply may show **many** draft cards; user may Apply all, some, or Ignore individually.
- After partial apply, session outcomes must reflect which subset is APPLIED vs still DRAFT.
- Large JSON in the prompt is normal — no requirement to split across chat turns.

**Prompting additions for the planner:**

- Explicitly allow **multiple proposals** in one `final` response.
- "Remove" / "take off the schedule" → cancel or unschedule, not swap unless user asked to swap.
- Company talks ("Perplexity's talk") → resolve via sponsor/company/title in assignment index, then speaker fallback.

### User-supplied structured fields

- When users paste JSON/CSV fields (foreign keys, import IDs, hashes), **copy all of them** into the proposal patch.
- Document canonical patch keys **and** common aliases (`proposal_id` → `cfpProposalId`).
- **Normalize aliases server-side** before validation — models mirror user keys inconsistently.

### Session / follow-up context

Replay recent turns **with authoritative proposal outcomes**, not assistant prose alone:

```
DRAFT     → not on canonical data
IGNORED   → human rejected; schedule unchanged
APPLIED   → on canonical data
FAILED    → human clicked Apply but the WRITE was rejected; canonical data unchanged
```

Preamble for the model: *only APPLIED means the change happened; ignore "I moved" if outcomes say DRAFT/IGNORED.*

On Apply/Ignore, append explicit user lines: `[Human applied draft "…"]` / `[Human ignored draft "…"]`.

**Apply failures need a feedback loop — the missing 4th outcome.** A rejected apply (DB constraint, validation, conflict) is a dead-end if you only model draft/applied/ignored: the apply handler throws *before* `status = applied`, so the proposal stays `draft`, no session line is written, and the planner re-reads it next turn as a benign "pending review" — with **no idea the write failed**. The error lives only in the UI. Fix:

- On apply error, **record an authoritative session line** before re-throwing: `[Apply FAILED for "…"] — write REJECTED (<reason>); canonical data NOT changed; do not re-propose verbatim — diagnose and correct.` Resolve the session key *before* the write so a failure can still be attributed.
- Teach the planner that `[Apply FAILED …]` is authoritative (same status as DRAFT/IGNORED): **re-plan, don't re-emit the identical proposal.** Without this the bot loops: propose → reject → propose the same thing.
- This is reactive (next turn). Pair it with the deterministic create→move guard above so the common cause never reaches the user at all.

### Validation repair turn

When the validator drops proposals, one retry prompt listing **per-proposal reasons** and allowed patch keys — prevents silent "success" answers with zero drafts.

### Slack inline flags (`!help`, `!model`, `!audit`) — why they exist

Slack has no model dropdown and no “History access” checkbox. Users need **explicit, strip-before-planning flags** in the message (same orchestration core as web; flags only affect the Slack adapter).

| Flag | Purpose | Why not implicit? |
|------|---------|-------------------|
| **`!help`** | Post the full capabilities guide (Block Kit); **no model call** | Empty @mentions and “what can you do?” should be instant; avoids burning tokens on static docs |
| **`!model <slug>`** | Override planner model for this request | Default is fast/cheap; audit and hard reasoning need a stronger tier without changing global config |
| **`!advanced`** | Unlock Tier-2 composable primitives + atomic `batch` | The long-tail vocabulary is gated so the default model stays on the ergonomic hot paths (see [tiered-operation-harness.md](tiered-operation-harness.md)) |
| **`!audit [duration]`** | Opt-in audit/operations history + prefetch | History is sensitive and token-heavy — never on by default; `!audit` also auto-picks the **audit default model** unless `!model` overrides (deep-dive: [audit-log.md](audit-log.md)) |
| **`!mine`** | History: only requester’s edits | Requires knowing requester email in the adapter |
| **`!verbose`** | Full before/after diffs in history results | Compact by default; verbose blows context |
| **“not by me”** (natural language) | Maps to `exclude:<email>` on history prefetch | Users say this more often than a flag |

**Parsing rules (adapter):**

1. Parse flags from raw message → strip them → pass **clean text** as `message` to `runAiebotQuery`.
2. `!help` (or bare `help` / empty mention) → return `buildHelpBlocks()` immediately; do not call the planner.
3. Invalid `!model` slugs → **ignore** (fall back to default / audit default); list valid slugs in help.
4. `historyQueryPrefix` (e.g. `after:…`, `actor:…`, `exclude:…`) is prepended server-side to every `history` lookup — model cannot “forget” the time window.
5. **Audit mode:** server **prefetches** history before turn 1; system prompt forbids “I will check…” stall answers.

**Web parity:**

| Slack | Web |
|-------|-----|
| `!model openai-gpt-5.4-high` | Model dropdown (`modelSlug` on `/api/ai/chat`) |
| `!advanced` | “Advanced” checkbox (`mode: "advanced"` on `/api/ai/chat`) |
| `!audit` | “History access” checkbox |
| `!help` | “What can aiebot do?” examples panel |
| Selected grid slot context | Autofill composer with slot/assignment ids |

**Model slugs** live in one registry (`AI_MODEL_OPTIONS`) shared by frontend + backend. Document every slug in `!help`. Typical defaults: fast mini for Q&A; a **mid reasoning tier** (e.g. `…-medium`) for `!audit` unless `!model` wins — **not** the slowest/highest tier (see [audit-log.md](audit-log.md) for why high reasoning got the audit path silently killed).

**Best practices:**

- Combine flags: `@aiebot !model openai-gpt-5.4-high !audit 2d summarize edits not by me`
- Prefer `!help` for onboarding; keep `SLACK_HELP_TEXT` one line pointing to `!help`
- Never classify routing on flag-stripped vs raw message inconsistently — strip flags **before** persistence, not before help detection
- Log chosen model slug + `historyAccess` on each run for debugging “why was this dumb?”

Reference: `functions/_lib/slack-flags.ts`, `functions/_lib/slack.ts` (`buildHelpBlocks`), `src/domain/aiModels.ts`. See [slackbot-builder](../slackbot-builder/level-3-interactive.md) § inline flags.

### Super-long audit requests (serverless execution budget)

Audit/history is the **slowest path you have** (opt-in prefetch + token-heavy context + tempting strongest model + multi-turn loop), and on a serverless background task (`waitUntil`, Lambda) a run that exceeds the execution budget is **killed mid-flight** — no reply, no error reaction, no telemetry row. Mitigate with: a **hard timeout on every provider call** (idle-reset for streams, total cap for one-shots), a **mid-tier audit default model**, **capped audit turns**, terminal state emitted in `finally`, and **per-run telemetry** (silent kills show as missing rows). Full lesson, diagnosis, and durable-runner escalation: [audit-log.md](audit-log.md). For the *messaging-surface* side of the same incident — the handler-level timeout ceiling, offloading to durable execution, protecting **every** entry surface (mention/DM/slash/button/cron), and the three-phase ack→progress→guaranteed-result-or-error pattern — see [slackbot-builder L5](../slackbot-builder/level-5-hardened.md) § *Never run agent work inline*.

## UX

> This section covers the **draft→apply data flow** (queuing, cards, versioning, errors). For how the copilot *surface itself* behaves — floating/dockable panel, the summon-hotkey **size state machine** (cycle: minimized → sidebar 50% → sidebar 80% → centered → minimized), custom-resize reconciliation, on-screen clamping, and snap animation — see [surface-ux.md](surface-ux.md).

### Request queuing (long agent loops)

Compound / lookup-heavy turns can run **minutes**. The composer must stay usable — queue follow-ups instead of blocking send.

**Client queue (FIFO, one in-flight):**

| State | UI | User action |
|-------|-----|-------------|
| **queued** | `aiebot is queued…` (no elapsed timer) | **Remove** — drop from queue, delete pending bubble |
| **active** | `thinking` / `writing` + elapsed; tool lines (`looked up assignment: …`) | **Stop** — abort stream; restore message to composer |
| **done** | Assistant bubble + draft cards | — |

**On send (always):**

1. Append **user** bubble + **pending** placeholder immediately (`queued: true`).
2. Clear composer — do not wait for the network.
3. Push job onto `queueRef`; `processQueue` runs one job at a time (`processingRef` gate).

**Ordering semantics:**

- Job *N+1* does not call the API until job *N* finishes (success, error, or abort). This avoids overlapping planner runs and duplicate `proposals` state stomping.
- **Server session** gets turn *N* only after *N* completes (`recordSessionTurn`). A queued question (e.g. "does X already have a session?") is planned **without** in-flight *N* drafts/outcomes unless *N* has already landed. Do not assume the model sees work that is still streaming.
- Optional product copy when a message is queued behind an active run: *"Queued — will run after the current reply finishes."*

**Edit / clear:**

- **Edit** on a user message: drain the queue, abort active (silent), truncate chat after that index, restore text to composer.
- **Clear chat**: drain queue + abort; rotate session key if continuity should reset.

**Backend:** One HTTP/stream per job is enough; no server-side queue required unless you add Slack/email workers — document where queue lives (browser vs worker).

**Smells:**

- Disabling send while `pending` → bad for multistep latency.
- Dropping queued jobs on unrelated errors.
- Starting job *N+1* in parallel → race on `proposals`, session turns, and snapshot version.
- User applies drafts from turn *N* while *N+1* was queued with stale `expectedVersion` — pair with **version poll / stale banner** (below).
- Replacing the global `proposals` array on each `onResult` → **dismisses prior turn’s cards** while a queued follow-up runs. **Merge** by proposal id instead.

### Draft cards (per reply)

- Inline **Apply** / **Ignore** on each assistant turn that emitted proposals.
- Editable patch JSON before apply (power users).
- Copy: *"N pending changes — nothing updates until you click Apply."*
- **Statuses (three outcomes):**
  - `draft` → **Pending review** (no action yet — still Apply/Ignore).
  - `applied` → **Applied** (on canonical store; buttons hidden).
  - `ignored` → **Ignored** (soft reject — not on schedule; bot session memory treats as rejected).
- Cards **stay visible** on their assistant turn after Apply/Ignore (badge + helper text), so a **queued** follow-up does not remove earlier drafts.
- Global `proposals` signal = **merged catalog** (`mergeProposals` on each result); `setProposalStatus` syncs catalog + every assistant turn that owns that `prop_*` id.
- Read-only queued questions must not wipe turn *N* drafts — only **merge** new `prop_*` ids from turn *N+1*.

### Bulk review / mass-approve (many drafts in one turn)

A multistep request ("create speaker + draft talk" per person across a roster) routinely emits **8–14 drafts in one reply**. A vertical stack of full Apply/Ignore cards forces N scrolls + N clicks. Collapse to a **table** the moment a turn has >1 draft:

| Element | Behavior |
|---------|----------|
| **Row** | One line per proposal: `[checkbox] summary … [status badge] [▸]` — dense, truncated summary |
| **Checkbox** | Drafts **default checked** (= will apply); unchecking just excludes from the batch (stays `draft`, not ignored) |
| **Header** | `N/M selected to apply` + select-all toggle |
| **Expand (▸)** | Click row/caret → reveals `targetType:targetId`, evidence, editable patch JSON, per-row **Apply just this** / **Ignore** |
| **Footer** | One **`Apply N selected`** button — the mass-approve |
| **Resolved rows** | `applied`/`ignored` show badge only, no checkbox; header flips to `N changes resolved` once no drafts remain |

**Bulk apply must chain the version, not fan out.** Each apply bumps `expectedVersion`; firing all N with the same starting version makes apply #2..N throw `version_conflict`. So:

- Apply **sequentially**, feeding each apply's returned `result.version` into the next (`version = applied.result?.version ?? version + 1`).
- Refresh the snapshot **once at the end**, not between every apply (avoids N grid flashes / N snapshot refetches).
- On a per-row error: record it on that row, `refreshAll()` + resync `version` from the live snapshot, and **keep going** — one bad draft must not abort the rest.
- Post a summary stage line: `Applied 5 of 7 selected changes — 2 need attention, see below`.
- Default the verb to your app's existing one (**Apply**), not "Accept", for consistency with single-card actions.

**Smells:** checkbox = "ignore the unchecked" (confusing — unchecked should just be *skipped*, left as draft); bulk apply with a single fixed `expectedVersion`; refreshing the whole snapshot inside the loop; losing per-row edit/error state on re-render (key expand/patch/error maps by `prop_*` id so they survive status changes).

Reference: `src/frontend/components/AiebotPanel.tsx` (`ProposalReviewTable`).

### Version / staleness (optimistic concurrency)

- Every mutation sends `expectedVersion`; server returns `409 version_conflict` when stale.
- **Never fail silently** on apply/save — show inline error + human message (local vN vs server vM).
- **Poll** lightweight `GET …/version` (not full snapshot) every ~30s while signed in.
- **Persistent banner** when `clientVersion !== serverVersion`: Reload schedule (refresh data) + Reload page (new bundle).
- Any `version_conflict` should also set the stale flag.

### Errors vs chat

- Distinguish **chat errors** (model/provider) from **apply errors** (conflict, validation).
- Surface dropped proposals in the assistant message (bulleted list), not only in devtools.

## Server validation checklist

When adding a new patchable field:

1. Domain operation accepts it
2. `ASSIGNMENT_CONTENT_KEYS` (or equivalent) includes it — **or validator silently strips it**
3. System prompt + repair prompt list the key
4. Alias map if users use alternate names
5. Test: proposal with field survives `validateAiDraftResult`

Other validator habits:

- **Dry-run must model every DB invariant**, not just occupancy — unique external/import ids, FKs, CHECKs. Anything the DB enforces but the snapshot doesn't simulate is a "passed review, failed apply" bug, invisible to the agent's self-repair retry (which re-runs the same validator).
- **Apply must not expand scope vs. the reviewed draft (TOCTOU).** A plain placement whose target slot got occupied between draft and apply must **fail** (`409 slot_occupied` → re-draft), never silently lower into a `cancel + place`. Decide replace at draft time (visible card); refuse synthesis at apply. Generalize to any destructive lowering (create→cancel, cascading delete). See *Apply == review*.
- **Duplicate unique external id → rewrite `*_create` to update/reactivate** the existing row (incl. soft-deleted rows that still hold the key); match the guard predicate to the *index's* predicate (occupancy excludes cancelled; external-id may not).
- `assignment_create` only on truly open slots; **rewrite** create-on-placeholder → `assignment` update
- Strip misplaced keys (`slotId` in patch → belongs in `targetId`)
- Auto-`speaker_create` when placement uses unknown `kind: "text"` speaker
- Cumulative dry-run catches interacting proposals (two talks → same slot)

## Test matrix (must exercise)

Use [test-cases.md](test-cases.md) for scenarios and assertions. Minimum categories:

| Category | Example failure if untested |
|----------|----------------------------|
| **Memory / outcomes** | User ignored draft; bot assumes move happened on follow-up |
| **Voice** | Answer says "I moved" while UI still shows Draft |
| **Version** | Apply with stale tab → silent reject or uncaught promise |
| **Validator allowlist** | User gives IDs in prompt; UI fields empty after apply |
| **Alias normalization** | `proposal_id` in patch dropped as unsupported key |
| **Slot kind** | Create on occupied slot; create on placeholder holder |
| **Apply-time scope expansion (TOCTOU)** | Draft places into an open slot; slot gets booked before Apply → apply silently cancels the new occupant nobody approved |
| **Open vs placeholder feed** | `open_slot` lookup empty; user-visible “open” 5:10 slot ignored |
| **Move vs fill** | Move into placeholder slot dropped as `slot_occupied` |
| **Unique external id reuse** | `create` re-links an already-used cfp/import id → `UNIQUE` fail at apply; create→move/reactivate guard not exercised |
| **Soft-deleted holds the key** | Cancelled row still owns the unique external id; create→move guard that filters out cancelled misses it |
| **Apply-failure feedback** | Rejected apply leaves proposal `draft`, no session line; planner re-proposes the identical doomed change |
| **Dedupe key searchability** | Unique key absent from all lookups → agent can't find existing link → duplicates |
| **Dry-run drop** | Optimistic answer but zero draft cards |
| **Coercion** | Valid placement rewritten create→update |
| **Conflict** | Double-booked speaker; swap unslotted talk |
| **Edit before apply** | User changes patch JSON then applies |
| **Bulk apply** | Apply N drafts at once with one fixed version → #2..N hit `version_conflict`; one bad row aborts the rest |
| **Multi-tab** | Poll raises stale banner; reload clears it |
| **Cross-surface** | Slack approve vs web ignore share same session semantics |
| **Cross-surface control resolution** | A draft resolved from one surface (email/web) leaves another surface's live buttons (Slack card) clickable → double-apply of an already-resolved draft (store the card's channel+ts; rewrite from the resolving path — see [email-surface.md](email-surface.md)) |
| **Email reply From round-trips** | Reply sent from a send-only address → human's `approve` bounces `550`; approval loop silently dead (see [email-surface.md](email-surface.md)) |
| **Email approval auth gate** | Spoofed `From:` "approve" applies changes without SPF/DKIM pass |
| **Email Message-ID idempotency / loop guard** | Redelivered inbound double-replies; bot loops on its own auto-reply |
| **Slack `!help`** | User gets guide without planner call; empty mention works |
| **Slack `!model`** | Invalid slug ignored; valid slug reflected in footer metadata |
| **Slack `!audit`** | Prefetch present in prompt; answer summarizes events, no “I will check…” |
| **Provider timeout** | Stalled model call hangs the background task → ack stuck on 👀, no reply, no run row |
| **Streaming idle vs total cap** | Total-duration cap aborts a long-but-streaming compound answer ("so close"); idle reset lets it finish, true stall still falls back |
| **Audit exclude self** | “not by me” excludes requester; `!mine` includes only requester |
| **Multistep compound** | User says remove 2 + add 1; bot only drafts add or claims done with 0 cards |
| **Partial apply** | Apply 2 of 3; follow-up must not assume the third happened |
| **Queuing** | Second send while first runs blocks or loses message; parallel API races |

## Implementation smells

- Assistant turn stored in session **without** proposal status → follow-up hallucination
- `recordSessionTurn` only stores natural language, not outcomes
- Apply handler without `try/catch` → console `Uncaught (in promise)`
- Apply failure surfaced only in the UI (no `FAILED` session line) → planner never learns, re-proposes the same rejected change
- Apply path **re-derives** the operation from live state and can emit a *more destructive* op (e.g. a cancel) than the reviewed draft → silent overwrite (TOCTOU); decide destructive lowering at draft, refuse scope expansion at apply (one lowering fn, `preview` vs `apply` mode)
- Dry-run/validator that models only occupancy while the DB also enforces unique external ids/FKs → "passed review, failed apply"
- create→move/dedup guard that filters `status != 'cancelled'` while the unique index covers all rows → cancelled row still blocks inserts
- DB-enforced unique key that no lookup indexes → agent can't dedupe, duplicates
- Model-only enforcement of "don't claim applied" without outcome lines
- Full schedule fetch for version poll → expensive; add version-only endpoint
- Routing user message content into deterministic vs model branch when only `contextNote` should ground

## Sample code

Portable excerpts in [samples/](./samples/) (from `swyxio/aiewf2026-internal-schedule` aiebot):

| Sample | What to copy |
|--------|----------------|
| [orchestration-dry-run-and-query.ts](./samples/orchestration-dry-run-and-query.ts) | Plan → cumulative dry-run → persist drafts; apply path |
| [session-memory-with-outcomes.ts](./samples/session-memory-with-outcomes.ts) | DRAFT/APPLIED/IGNORED in context; record Apply/Ignore |
| [proposal-validate-and-normalize.ts](./samples/proposal-validate-and-normalize.ts) | Allowlist, CFP aliases, placeholder coercion |
| [client-request-queue.ts](./samples/client-request-queue.ts) | FIFO queue, queued vs active, Stop/Remove |
| [version-stale-ux.ts](./samples/version-stale-ux.ts) | Version poll endpoint, 409 handling, apply errors |
| [surface-panel-sizing.tsx](./samples/surface-panel-sizing.tsx) | Floating panel ⌘/Ctrl+J size state machine + preset/custom-resize reconciliation + full-height flex layout (see [surface-ux.md](surface-ux.md)) |

Full repo paths: `functions/_lib/aiebot.ts`, `aiebot-store.ts`, `ai.ts`, `src/frontend/components/AiebotPanel.tsx`, `scheduleSync.ts`.

Side files (deeper dives, reference as needed):

| File | When to read |
|------|--------------|
| [surface-ux.md](surface-ux.md) | Copilot **panel/surface ergonomics** — floating-dockable panel, summon-hotkey size state machine, custom-resize coexistence, viewport clamping, snap animation, discoverability |
| [email-surface.md](email-surface.md) | **Email as a copilot surface** — separate inbound Worker, durable-execution handoff for the ~30s handler limit, idempotency/loop-guard/allowlist/SPF-DKIM-gated approvals, `Message-ID` threading, the reply-`From:`-must-round-trip bounce battle scar, verified-destination degradation, button-less intent classification, bidirectional Slack↔email mirroring |
| [test-cases.md](test-cases.md) | Acceptance criteria / test scenarios while building or reviewing |
| [tiered-operation-harness.md](tiered-operation-harness.md) | **Secondary** refactor plan — collapse the copilot write surface into 3 tiers + 1 selector **after** an MVP teaches you the real use cases |
| [audit-log.md](audit-log.md) | Operational deep-dive on audit/history mode + the serverless execution budget |
| [observability.md](observability.md) | **LLM tracing + human feedback** — session.id grouping of multi-turn traces, orphan/"spans without root spans" fix on serverless, thumbs up/down annotation capture, Arize AX (GraphQL) vs Phoenix (REST) APIs |

## Quick build checklist

```
[ ] Proposals never write canonical state directly
[ ] Validator allowlist matches all promoted patch fields (+ aliases)
[ ] Dry-run + dropped list in answer when drafts fail
[ ] Dry-run models ALL DB invariants (unique external ids/FKs/CHECKs), not just occupancy
[ ] Apply == review: a placement whose slot got occupied after drafting FAILS at apply (no synthesized cancel); destructive replace is decided + shown at draft time (preview vs apply mode on the lowering fn)
[ ] Destruction is explicit at the write layer: reducer refuses to overwrite/replace a real booking's identity in place unless `allowReplace`; "empty placeholder" is classified by content (descriptive title ⇒ real, default-deny), shared by planner + reducer
[ ] Unique external id reuse → create rewritten to update/reactivate (incl. soft-deleted rows); guard predicate matches index predicate
[ ] Every dedupe key the agent reasons about is searchable in a lookup (or deduped deterministically server-side)
[ ] Session context includes DRAFT/APPLIED/IGNORED/FAILED per proposal set
[ ] Apply/Ignore recorded in session; apply FAILURE recorded too (authoritative re-plan line)
[ ] System prompt: tentative voice + outcome authority
[ ] Apply/save catches version_conflict with visible error
[ ] Version poll + persistent stale toast
[ ] Tests for memory, allowlist, conflict, placeholder coercion
[ ] Index exposes open + placeholder placeables; lookups do not hide placeholders
[ ] Move-into-occupied dry-run + swap/fill-holder guidance in prompt
[ ] Compound remove+add decomposes to N proposals; cumulative dry-run respects order
[ ] Track/speaker/company lookups before final; JSON blob fields land on patch
[ ] Send while busy queues (FIFO); Remove vs Stop; session turn after prior job completes
[ ] Queued turn does not replace prior proposals — merge catalog; Pending/Applied/Ignored badges persist per turn
[ ] Many drafts → table view: checkbox default-checked, expand for details, one-click Apply N selected (version chained, one final refresh)
[ ] Email surface (if shipped): inbound Worker + durable handoff; Message-ID idempotency + loop guard + allowlist; approvals gated on SPF/DKIM; reply From round-trips (not send-only); Slack is the fallback when async email can't deliver (see email-surface.md)
[ ] Slack: parse/strip !help !model !audit flags; !help bypasses planner; model registry in help blocks
[ ] Audit: prefetch history + audit default model; exclude/actor prefixes on lookups
[ ] Hard timeout (AbortController) on every provider call incl. stream read; degrades to fallback/error
[ ] Streaming = IDLE timeout (reset per chunk/keepalive); only non-streaming gets a total-duration cap
[ ] Audit default = mid reasoning tier (not slowest); audit turns capped
[ ] Ack surface resolves to reply/✅/❌ in finally — never stuck on the working reaction
[ ] Per-run telemetry (model/turns/duration/outcome) so silent kills show as missing rows
[ ] Copilot panel: one summon hotkey; consider a size state machine (cycle presets → minimize); clamp on-screen; restore-on-click vs cycle-on-key; snap transition only during snap + honor reduced-motion (see surface-ux.md)
```
