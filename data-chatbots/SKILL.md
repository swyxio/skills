---
name: data-chatbots
description: >-
  Design and implement AI copilots that analyze structured data and propose
  mutations for human approval (draft → apply), not direct writes. Covers
  prompting, multistep compound requests (remove + add in one turn), validation,
  session memory, optimistic versioning UX, and test matrices. Use when building
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

One orchestration function per product surface (web, Slack, email) so behavior stays identical.

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

**Prompt + validator habits:** System prompt must document both `open` and `placeholder` states; coerce `assignment_create` on placeholder → `assignment` update; dry-run drops moves into real bookings with the occupant id in the reason. See [test-cases.md](test-cases.md) §5.6–5.8.

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

## UX

### Draft cards (per reply)

- Inline **Apply** / **Ignore** on each assistant turn that emitted proposals.
- Editable patch JSON before apply (power users).
- Copy: *"N draft changes — nothing updates until you click Apply."*
- When drafts for a turn are gone (applied/ignored), show *"resolved"* — do not leave phantom cards.

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
| **Multistep compound** | User says remove 2 + add 1; bot only drafts add or claims done with 0 cards |
| **Partial apply** | Apply 2 of 3; follow-up must not assume the third happened |

## Implementation smells

- Assistant turn stored in session **without** proposal status → follow-up hallucination
- `recordSessionTurn` only stores natural language, not outcomes
- Apply handler without `try/catch` → console `Uncaught (in promise)`
- Model-only enforcement of "don't claim applied" without outcome lines
- Full schedule fetch for version poll → expensive; add version-only endpoint
- Routing user message content into deterministic vs model branch when only `contextNote` should ground

## Reference implementation

AIEWF 2026 internal schedule (`aiewf2026-internal-schedule`):

- `functions/_lib/aiebot.ts` — orchestration, dry-run, apply
- `functions/_lib/aiebot-store.ts` — session + proposal outcomes
- `functions/_lib/ai.ts` — planner prompt, validator, alias normalize
- `src/frontend/components/AiebotPanel.tsx` — draft cards
- `src/frontend/scheduleSync.ts` + `ScheduleStaleToast.tsx` — version poll + banner

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
```
