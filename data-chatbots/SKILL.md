---
name: data-chatbots
description: >-
  Design and implement AI copilots that analyze structured data and propose
  mutations for human approval (draft → apply), not direct writes. Covers
  prompting, multistep compound requests (remove + add in one turn), FIFO client
  queuing for long agent loops, validation, session memory, optimistic versioning
  UX, and test matrices. Use when building
  scheduling/admin chatbots, proposal workflows, human-in-the-loop agents, or
  reviewing aiebot-style features.
---

# Data chatbots

Copilots over **authoritative structured state** (schedules, CRMs, configs) should **draft** changes and **apply** only after explicit human approval. Treat the model as a planner, not a writer.

## Architecture (non-negotiables)

| Layer | Responsibility |
|-------|----------------|
| **Planner** | Reads compact index + optional lookups; returns answer + structured proposals |
| **Validator** | Allowlisted patch keys, real entity IDs, domain rules (conflicts, occupancy) |
| **Dry-run** | Simulate proposals cumulatively on in-memory snapshot; drop invalid drafts before humans see them |
| **Persist drafts** | `draft` / `applied` / `ignored` status in DB, separate from canonical state |
| **Apply path** | Same mutation pipeline as manual UI (`expectedVersion` + audit log) |
| **DB invariants** | Enforce mutual exclusivity in SQLite, not only in TS (partial UNIQUE + CHECK) |

One orchestration function per product surface (web, Slack, email) so behavior stays identical.

### Slot occupancy (schedule-shaped products)

Enforce in **SQLite**, not only application code:

- **Partial UNIQUE** on `assignments(slot_id)` where `status != 'cancelled'` — at most one active occupant per slot.
- **CHECK** `(status != 'cancelled' OR slot_id IS NULL)` — cancelled rows cannot keep a `slot_id` (prevents “NO PROGRAMMING” ghosts shadowing a real talk).
- **App layer** mirrors DB: `releaseSlotWhenCancelled` on update; grid uses active-only `assignmentsBySlot`; map `UNIQUE`/`CHECK` failures to `409 slot_occupied`.

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
6. **HOLD / reserved rows are NOT placeholders:** Rows with `status: "hold"` or title `HOLD`/`Reserved` have no speaker but are **intentionally blocked**. They must be **excluded** from `placeableSlotsByDayRoom`. Validation must **drop** proposals that fill a hold row or `assignment_create` / `slotId` move onto an occupied booked or hold slot — never silent overwrite. When the user says “replace X’s slot”, resolve **X’s** `asn_*`, not the earliest placeholder in the track.

**Prompt + validator habits:** System prompt must document both `open` and `placeholder` states; coerce `assignment_create` on placeholder → `assignment` update; dry-run drops moves into real bookings with the occupant id in the reason; hold rows excluded from placeable index. See [test-cases.md](test-cases.md) §5.6–5.9.

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
```

Preamble for the model: *only APPLIED means the change happened; ignore "I moved" if outcomes say DRAFT/IGNORED.*

On Apply/Ignore, append explicit user lines: `[Human applied draft "…"]` / `[Human ignored draft "…"]`.

### Validation repair turn

When the validator drops proposals, one retry prompt listing **per-proposal reasons** and allowed patch keys — prevents silent "success" answers with zero drafts.

### Slack inline flags (`!help`, `!model`, `!audit`) — why they exist

Slack has no model dropdown and no “History access” checkbox. Users need **explicit, strip-before-planning flags** in the message (same orchestration core as web; flags only affect the Slack adapter).

| Flag | Purpose | Why not implicit? |
|------|---------|-------------------|
| **`!help`** | Post the full capabilities guide (Block Kit); **no model call** | Empty @mentions and “what can you do?” should be instant; avoids burning tokens on static docs |
| **`!model <slug>`** | Override planner model for this request | Default is fast/cheap; audit and hard reasoning need a stronger tier without changing global config |
| **`!audit [duration]`** | Opt-in audit/operations history + prefetch | History is sensitive and token-heavy — never on by default; `!audit` also auto-picks the **audit default model** unless `!model` overrides |
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
| `!audit` | “History access” checkbox |
| `!help` | “What can aiebot do?” examples panel |
| Selected grid slot context | Autofill composer with slot/assignment ids |

**Model slugs** live in one registry (`AI_MODEL_OPTIONS`) shared by frontend + backend. Document every slug in `!help`. Typical defaults: fast mini for Q&A; `openai-gpt-5.4-high` for `!audit` unless `!model` wins.

**Best practices:**

- Combine flags: `@aiebot !model openai-gpt-5.4-high !audit 2d summarize edits not by me`
- Prefer `!help` for onboarding; keep `SLACK_HELP_TEXT` one line pointing to `!help`
- Never classify routing on flag-stripped vs raw message inconsistently — strip flags **before** persistence, not before help detection
- Log chosen model slug + `historyAccess` on each run for debugging “why was this dumb?”

Reference: `functions/_lib/slack-flags.ts`, `functions/_lib/slack.ts` (`buildHelpBlocks`), `src/domain/aiModels.ts`. See [slackbot-builder](../slackbot-builder/level-3-interactive.md) § inline flags.

## UX

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
| **Open vs placeholder feed** | `open_slot` lookup empty; user-visible “open” 5:10 slot ignored |
| **Move vs fill** | Move into placeholder slot dropped as `slot_occupied` |
| **Dry-run drop** | Optimistic answer but zero draft cards |
| **Coercion** | Valid placement rewritten create→update |
| **Conflict** | Double-booked speaker; swap unslotted talk |
| **Edit before apply** | User changes patch JSON then applies |
| **Multi-tab** | Poll raises stale banner; reload clears it |
| **Cross-surface** | Slack approve vs web ignore share same session semantics |
| **Slack `!help`** | User gets guide without planner call; empty mention works |
| **Slack `!model`** | Invalid slug ignored; valid slug reflected in footer metadata |
| **Slack `!audit`** | Prefetch present in prompt; answer summarizes events, no “I will check…” |
| **Audit exclude self** | “not by me” excludes requester; `!mine` includes only requester |
| **Multistep compound** | User says remove 2 + add 1; bot only drafts add or claims done with 0 cards |
| **Partial apply** | Apply 2 of 3; follow-up must not assume the third happened |
| **Queuing** | Second send while first runs blocks or loses message; parallel API races |

## Implementation smells

- Assistant turn stored in session **without** proposal status → follow-up hallucination
- `recordSessionTurn` only stores natural language, not outcomes
- Apply handler without `try/catch` → console `Uncaught (in promise)`
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

Full repo paths: `functions/_lib/aiebot.ts`, `aiebot-store.ts`, `ai.ts`, `src/frontend/components/AiebotPanel.tsx`, `scheduleSync.ts`.

## Quick build checklist

```
[ ] Proposals never write canonical state directly
[ ] Validator allowlist matches all promoted patch fields (+ aliases)
[ ] Dry-run + dropped list in answer when drafts fail
[ ] Session context includes DRAFT/APPLIED/IGNORED per proposal set
[ ] Apply/Ignore recorded in session
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
[ ] Slack: parse/strip !help !model !audit flags; !help bypasses planner; model registry in help blocks
[ ] Audit: prefetch history + audit default model; exclude/actor prefixes on lookups
```
