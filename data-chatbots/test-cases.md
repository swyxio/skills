# Test cases: propose-then-apply data chatbots

Use as acceptance criteria when building or reviewing a copilot. Each case should have **setup**, **action**, **expected UI**, **expected canonical state**, **expected next-turn model behavior**.

---

## 1. Proposal lifecycle & memory

### 1.1 Draft not applied — follow-up must not assume success

- **Setup:** Bot drafts "move speaker A to slot X". User does **not** click Apply.
- **Action:** User says "create assignment from scratch, I didn't accept the last one."
- **State:** Canonical data unchanged; proposal status `draft`.
- **Session context must show:** prior proposal `DRAFT` or user never applied.
- **Bot must not:** reference A as already in slot X; must not use past tense "I moved."

### 1.2 Ignored draft

- **Setup:** User clicks **Ignore** on a draft.
- **Action:** Follow-up related to same entity.
- **State:** Unchanged; proposal `ignored`.
- **Session:** `[Human ignored draft "…"]` or outcome line `IGNORED`.
- **Bot must:** treat prior proposal as void.

### 1.3 Applied draft

- **Setup:** User clicks **Apply**; version bumps.
- **Action:** "Move them to the afternoon instead."
- **State:** Reflects first apply; proposal `applied`.
- **Bot may:** plan a second draft from current positions.

### 1.4 New reply replaces global draft list

- **Setup:** Turn 1 has draft card; Turn 2 emits new proposals (UI merges — turn 1 cards stay).
- **Action:** User returns to Turn 1 card mentally — old drafts still in DB as `draft` unless ignored.
- **Test:** Session loader still marks old sets `DRAFT` even if UI no longer shows card.

### 1.5 User corrects in natural language without Ignore

- **Setup:** Draft pending; user says "no don't use sponsor hold slot."
- **Expect:** New plan respects rejection even if Ignore wasn't clicked (best-effort via message; Ignore is still the source of truth for status).

---

## 2. Voice & copy

### 2.1 Answer tense vs UI chrome

- **Assert:** While status is `draft`, answer does not claim completion.
- **UI:** Shows "Draft" badge + Apply/Ignore.
- **Regression:** "I moved…" + Draft badge = bug.

### 2.2 Dropped proposals called out

- **Setup:** Validator drops invalid proposal (bad slot, bad status).
- **Assert:** Answer includes ⚠️ list; `proposals.length === 0` not paired with success prose.

---

## 3. Optimistic versioning

### 3.1 Stale apply

- **Setup:** Tab at vN; server advanced to vN+2 (other tab or teammate).
- **Action:** Apply draft with `expectedVersion: N`.
- **Expect:** 409 `version_conflict`; inline error mentions both versions; stale banner on.

### 3.2 Poll detects drift

- **Setup:** Load vN; externally commit vN+1.
- **Action:** Wait for poll interval.
- **Expect:** Banner before user clicks anything.

### 3.3 Reload schedule clears stale

- **Action:** Click "Reload schedule".
- **Expect:** Snapshot vM; banner gone; apply uses vM.

### 3.4 Uncaught promise regression

- **Action:** Apply while stale without handling.
- **Expect:** No silent failure — error on card or toast.

---

## 4. Patch validation & field mapping

### 4.1 Allowlist — field survives validation

- **Setup:** Proposal patch includes domain field F (e.g. foreign key).
- **Assert:** After validate + dry-run, patch still contains F; after apply, entity has F.

### 4.2 Allowlist — unsupported key dropped

- **Setup:** Model puts `slotId` inside `assignment_create` patch.
- **Expect:** Stripped or coerced; not "success" with wrong target.

### 4.3 Alias normalization

- **Setup:** User/patch uses `proposal_id`, `source_row_hash`.
- **Expect:** Stored as canonical `cfpProposalId`, `cfpSourceRowHash`.

### 4.4 Edit patch JSON then apply

- **Setup:** User edits draft JSON (title, slot ref).
- **Expect:** Applied operation uses edited patch, not original only.

---

## 5. Scheduling-specific (adapt to your domain)

### 5.1 Open slot vs placeholder holder

- **Setup:** Slot has generic "Keynote" row, no real speaker.
- **Expect:** `assignment` update on `assignmentId`, not `assignment_create` on occupied slot.

### 5.2 Truly open slot

- **Expect:** `assignment_create` with `targetId = slot_*`.

### 5.3 Occupied slot

- **Expect:** Draft dropped or conflict flagged; no overbook.

### 5.4 Swap / rotate

- **Swap:** Two slotted assignments exchange slots atomically.
- **Rotate:** 3+ cycle; invalid if any talk unslotted.

### 5.5 Speaker not in catalog

- **Expect:** Placement draft + `speaker_create` (explicit or synthesized).

### 5.6 `open_slot` lookup misses placeholder the user calls “open”

- **Setup:** Main Stage keynote at 5:10 PM has seed holder `Keynote`, `speakers: []` (shows empty in grid).
- **Action:** Model runs lookup `open_slot` with query `"July 1 Main Stage 5:10pm"`.
- **Expect:** Empty or wrong results if lookup only scans `openSlots`; **must** use `placeableSlotsByDayRoom` (placeholder sample with `assignmentId`) or extended lookup.
- **Follow-up:** User says “put Tomasz there” — draft uses `assignment` update on holder id, not `assignment_create` / not move with `slotId` only.

### 5.7 Move into occupied slot (real booking vs placeholder)

- **Setup A:** Target slot has **real** talk (named speaker). User: “move A to that slot.”
- **Expect:** Dry-run drop `slot_occupied` + answer offers **swap** or alternate slot; no silent draft.
- **Setup B:** Target has **placeholder** holder; A is already slotted elsewhere.
- **Expect:** Not a single `{ slotId }` move onto that slot id — use fill-holder + clear source, or swap; dry-run must not pass naive overbook.

### 5.8 Keynote window — earliest sample vs user-named time

- **Setup:** Day has keynote slots 4:30, 4:50, 5:10; user says “closing keynote at 5:10.”
- **Expect:** Proposal targets **5:10** slot/holder, not earliest placeable (4:30) unless user said “first available in the block.”

### 5.9 HOLD rows excluded; overwrite dropped

- **Setup:** Track has `S1` placeholder at 11:40, booked Perplexity at 11:40 (another slot), and `HOLD` at 15:20 (`status: hold`, no speaker).
- **Expect:** `placeableSlotsByDayRoom` includes `S1` placeholder, **not** the HOLD row.
- **Expect:** `assignment` update filling `asn_hold_*` with a new speaker → dropped (“HOLD/reserved”).
- **Expect:** `assignment_create` on Perplexity’s `slot_*` → dropped (“already booked”).
- **Expect:** `assignment` move with `{ slotId: hold_slot }` → dropped (destination HOLD).
- **Expect:** “Replace Perplexity with Lin” → targets Perplexity’s `asn_*` (or cancel + fill that slot), not earliest placeholder nor the HOLD.

### 5.10 Apply-time overwrite guard (TOCTOU) — reviewed placement must never synthesize a cancel

- **Setup:** Draft a plain `assignment_create` into slot **S while S is open**; the draft is reviewed/approved.
- **Action:** Before Apply, another talk is placed into S (S now holds a real booking). Then Apply the original draft.
- **Expect:** Apply **fails** (`409 slot_occupied` → re-draft); it must **not** lower into `batch[cancel occupant, place]`. The occupant is untouched; nothing was cancelled.
- **Expect:** `expectedVersion` matching is **not** sufficient on its own — the guard must hold even when versions match (scope, not just version, must be re-checked).
- **Setup B (draft-time):** Draft a placement into a slot that is **already** occupied by a real booking.
- **Expect:** The *stored* draft is an explicit replace `batch[cancel X, place Y]` (visible cancel card, destructive → unchecked by default), **not** a bare create whose cancel would only materialize at apply.
- **Forensic:** A read-only audit-log scan for cancels whose reviewed proposal was a placement/move (not an explicit cancel / not a batch with a visible cancel op) returns **zero** once the guard ships.

### 5.11 Replacement is destructive — in-place identity overwrite refused unless opted in

- **Setup:** A **real** booking with a descriptive title but **no linked speaker** (speaker named only in the title, empty `speakers` array), status `confirmed`.
- **Classify:** Occupant kind is **booking**, not `placeholder` — it must **not** appear in the placeable index. (A short/empty label-like title — `Keynote`, `M1`, sponsor holder — *does* stay a fillable placeholder.)
- **Action:** Apply an `assignment` update on that row whose patch swaps in a **different** talk (title + speaker changed, or a different external/CFP id).
- **Expect:** Apply **fails** (`destructive_replace` → re-draft); the booked row is untouched.
- **Expect (opt-in):** The same op with `allowReplace: true` **succeeds** (intentional in-place replacement).
- **Expect (edits still pass):** Renaming the same talk, linking its real speaker, or filling a genuine empty placeholder are **not** flagged.
- **Note:** Same classifier module backs both the planner index and the reducer, so "what's placeable" and "what's protected" can never disagree.

---

## 6. Agent loop & tools

### 6.1 need_more then final

- **Assert:** Lookups resolve; final turn has `lookups: []` and proposals or explicit read-only answer.

### 6.2 Metrics not guessed

- **Ask:** "How many open slots?"
- **Assert:** Number matches deterministic report or lookup, not hallucinated.

### 6.3 Web search / enrichment

- **Setup:** User gives company URL only.
- **Expect:** Search enriches speaker profile; company URL in notes, not wrong twitter.

---

## 7. Multi-surface & audit

### 7.1 Web Apply creates operation + audit

- **Assert:** `operations` row; `audit_events`; version increment.

### 7.2 Slack approve same proposal id

- **Assert:** Same `applyProposalById` path as web.

### 7.3 Session key resolution without client passing key

- **Setup:** Apply from API without `sessionKey`.
- **Expect:** Resolve session via `proposal_set_id` on assistant message.

### 7.4 Slack `!help` (no planner)

- **Action:** `@aiebot !help` or empty @mention.
- **Expect:** Block Kit guide with model slugs; no `runAiebotQuery` / no draft cards; footer does not show a model run.

### 7.5 Slack `!model` override

- **Action:** `!model openai-gpt-5.4-high <scheduling question>`.
- **Expect:** Footer/metadata shows `gpt-5.4` + high reasoning; same orchestration as web `modelSlug`.
- **Action:** `!model totally-fake-slug …`
- **Expect:** Slug ignored; default model used; help lists valid slugs.

### 7.6 Slack `!audit` + exclude self

- **Action:** `!audit last day edits not by me`.
- **Expect:** History prefetch in first turn; answer lists non-requester edits; no stall text (“once I have them”).
- **Action:** `!audit !mine …`
- **Expect:** Only requester’s edits (opposite of exclude).

### 7.7 `!model` wins over audit default

- **Action:** `!model openai-gpt-5.4-mini-medium !audit 6h …`
- **Expect:** Uses mini model, still has history access + prefetch.

---

## 8. Edge UX

### 8.1 Concurrent drafts in one turn

- **Setup:** Speaker create + assignment create.
- **Apply:** One succeeds, one fails version — partial state documented.

### 8.2 Long session truncation

- **Setup:** >N turns.
- **Expect:** Recent turns + outcomes still include last proposal states.

### 8.3 Provider error vs apply error

- **Chat stream fails:** Show in chat, no draft cards.
- **Apply fails:** Draft card error, chat unchanged.

---

## 9. Multistep compound requests (one message)

### 9.1 Track-scoped remove two + add one (JSON blob)

- **Setup:** Inference track has talks for "Perplexity" (sponsor/company) and "Denis Yarats"; an 11a placeable slot exists.
- **Action:** *"In Inference track, remove Perplexity's talk and Denis Yarats, and add"* + JSON with `proposal_id`, `speaker`, `session`, `description`.
- **Expect proposals (≥3):**
  1. Cancel/unschedule Perplexity talk (`asn_*` from lookup)
  2. Cancel/unschedule Denis Yarats talk
  3. Place new talk (create or placeholder fill) with title/abstract/speakers + CFP ids from JSON
  4. Optional `speaker_create` for new speaker
- **Expect answer:** Numbered list matching cards; names resolved track; chosen slot/time stated; "drafted" not "removed and added."
- **Dry-run:** All `kept` when ordered cancels-before-create.

### 9.2 Lookup turn before proposals

- **Setup:** User gives only names, no ids.
- **Action:** Compound remove+add.
- **Expect:** At least one `need_more` with `assignment`/`track` lookups; `final` has ids, not "I couldn't find ids."

### 9.3 Partial apply of bundle

- **Setup:** 3 drafts from 9.1; user Applies cancels only, ignores add.
- **Action:** Follow-up "put Lin Qiao in that slot."
- **Expect:** Session shows 2× APPLIED, 1× IGNORED/DRAFT; bot does not claim Lin is already scheduled.

### 9.4 Company/sponsor removal phrasing

- **Setup:** Talk listed with sponsor Perplexity, speaker may differ.
- **Action:** "Remove Perplexity's talk."
- **Expect:** Resolves correct assignment via sponsor/title, not random "Perplexity" speaker string match.

### 9.5 JSON-only fields not stripped

- **Setup:** Patch includes `proposal_id` / alias keys from pasted JSON.
- **Assert:** Survives validator; present on entity after apply (see §4.3).

### 9.6 No single mega-proposal

- **Assert:** Never one proposal patching two unrelated `asn_*` ids or mixing cancel+create in one illegal patch shape.

---

## 10. Client request queuing

### 10.1 Send while active — FIFO wait

- **Setup:** Long-running turn (multistep lookups + streaming answer).
- **Action:** User sends second message before first completes.
- **UI:** First shows `writing` + elapsed + tool lines; second shows `queued` (no timer); composer cleared and accepts more input.
- **Network:** Second `streamAi` starts only after first settles.

### 10.2 Remove queued job

- **Action:** Click **Remove** on queued pending.
- **Expect:** Job removed from queue; user + pending bubbles for that id gone; never hits API.

### 10.3 Stop active job

- **Action:** Click **Stop** during streaming.
- **Expect:** Abort; message restored to composer (unless silent abort); queue continues with next job if any.

### 10.4 Session ordering

- **Setup:** Turn 1 compound draft still streaming.
- **Action:** Turn 2 queued then runs: "does speaker X have a session here?"
- **Expect:** Turn 2 planner session context includes turn 1 only **after** turn 1 `recordSessionTurn`; turn 2 must not claim turn 1 drafts were applied unless outcomes say APPLIED.

### 10.5 Edit drains queue

- **Action:** Edit an earlier user message while one active + one queued.
- **Expect:** Queue cleared; active aborted; history truncated; composer filled.

### 10.6 proposals persist across queued turns

- **Setup:** Turn 1 completes with 2 draft cards; user queues turn 2 (e.g. read-only question) before acting on turn 1.
- **Expect:** Turn 1 cards **still visible** with **Pending review** while turn 2 shows `queued` / runs.
- **Expect:** `proposals` catalog **merges** turn 2 ids — does **not** replace turn 1 entries.
- **Action:** Apply one turn-1 draft while turn 2 is queued or after turn 2 finishes.
- **Expect:** That card → **Applied**; others stay **Pending** until acted on.
- **Action:** Ignore a draft.
- **Expect:** Card → **Ignored** (still visible, no Apply); session context shows IGNORED not APPLIED.
- **Expect:** Applying during stale snapshot → version-stale path (§3).

### 10.7 Proposal status labels

- **Assert:** UI uses Pending review / Applied / Ignored — not a single “Draft” that disappears on the next message.
- **Assert:** Session `[Proposal outcomes]` uses DRAFT vs IGNORED vs APPLIED (authoritative for the bot).

---

## Regression suite mapping (Vitest-style)

| Test name | Covers |
|-----------|--------|
| `formatProposalStatusLines` | 1.x session labels |
| `validateAiDraftResult` open slot | 5.2 |
| `validateAiDraftResult` occupied | 5.3 |
| `validateAiDraftResult` CFP aliases | 4.3 |
| `dryRunProposals` cumulative | 8.1 |
| `coercePlaceholderCreate` | 5.1 |
| E2E manual | 3.x, 1.1, 2.1, 9.1 |

---

## Manual QA script (5 minutes)

1. Draft a move; **do not** Apply — ask "did it move?" → must say no / still draft.
2. Ignore draft — ask to redo → must start fresh.
3. Apply draft — confirm grid + CFP fields if provided in prompt.
4. Open second tab; edit there; return to first — banner appears; Apply shows conflict message.
5. Reload schedule — Apply succeeds.
6. Compound: *"in [track], remove X and Y, add"* + JSON — expect 3+ draft cards, numbered answer, CFP fields on new talk.
7. While (6) runs, send a second question — see `queued`, then an answer after the first turn finishes; Remove cancels the wait.
