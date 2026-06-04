---
name: data-chatbots
description: >-
  Design and implement AI copilots that analyze structured data and propose
  mutations for human approval (draft → apply), not direct writes. Covers
  prompting, validation, session memory, optimistic versioning UX, and test
  matrices. Use when building scheduling/admin chatbots, proposal workflows,
  human-in-the-loop agents, or reviewing aiebot-style features.
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

### Underspecified requests

- Be **permissive**: draft now with TBD placeholders (title, speaker, slot) rather than refusing.
- Call out placeholders and auto-picked slots in the answer so humans can fix one field at a time.

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
| **Dry-run drop** | Optimistic answer but zero draft cards |
| **Coercion** | Valid placement rewritten create→update |
| **Conflict** | Double-booked speaker; swap unslotted talk |
| **Edit before apply** | User changes patch JSON then applies |
| **Multi-tab** | Poll raises stale banner; reload clears it |
| **Cross-surface** | Slack approve vs web ignore share same session semantics |

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
```
