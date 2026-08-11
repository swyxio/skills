# Proposal review UX

Read this reference when building or reviewing draft cards, multi-proposal
review, apply/ignore behavior, or proposal state across queued turns. This is
the review surface for canonical mutations; [surface-ux.md](surface-ux.md)
covers the outer floating/dockable panel.

## Cards belong to the assistant turn that created them

Render proposals immediately beneath the corresponding answer. Keep resolved
cards visible so later turns do not erase what the human reviewed.

Each card should show enough identity and effect to support informed approval:

- a clear summary using domain names, not only internal IDs;
- operation kind, target identity, and relevant before/after values;
- evidence or lookup context when ambiguity was resolved;
- a visible destructive-risk treatment for cancel, delete, replacement, or
  cascade;
- editable structured arguments only when the product intentionally supports
  expert edits; and
- one authoritative status with an inline error when applicable.

Suggested status presentation:

| Stored outcome | Label | Actions | Meaning |
|---|---|---|---|
| `DRAFT` | Pending review | Apply, Ignore | Canonical state has not changed |
| `APPLIED` | Applied | None | The reviewed operation committed |
| `IGNORED` | Ignored | None or Re-draft | The human rejected this proposal |
| `FAILED` | Apply failed | Re-draft or inspect | The write was attempted and rejected; canonical state did not change |

Do not collapse `DRAFT`, `IGNORED`, and `FAILED` into one visual “not applied”
state; they lead to different follow-up behavior.

Useful copy is explicit: “3 pending changes—nothing updates until you click
Apply.” Assistant prose must remain tentative while cards are pending.

## Preserve cards across turns

Maintain both:

- a per-message list of proposal IDs for rendering history; and
- a merged proposal catalog keyed by stable proposal ID for current status.

When turn N+1 completes, merge new proposals into the catalog. Never replace
the catalog wholesale, because that makes unresolved turn-N cards disappear.
Applying or ignoring from any surface updates the shared stored outcome and
every visible representation of that proposal.

The existing queue pattern is in
[samples/client-request-queue.ts](samples/client-request-queue.ts). The review
state pattern is in
[samples/proposal-review-table.tsx](samples/proposal-review-table.tsx).

## One proposal versus many

One proposal can use a full card. For multiple proposals in one answer, prefer
a compact review table so the user can scan the set before acting:

| Element | Behavior |
|---|---|
| Row | Checkbox, concise summary, risk/status badge, and disclosure control |
| Selection | Pending rows may be selected; destructive rows should follow the product's explicit approval policy |
| Disclosure | Shows IDs, evidence, operation details, editable arguments, and per-row errors |
| Per-row controls | Apply only this proposal or Ignore |
| Footer | `Apply N selected` with a clear count and disabled state while applying |
| Resolved row | Persistent Applied/Ignored/Failed status; no stale active button |

Unchecking means “skip this bulk action,” not “ignore.” It should leave the
proposal in `DRAFT` unless the user explicitly chooses Ignore.

## Sequential bulk apply versus atomic batch

These are different product contracts and the UI must name the one it uses.

**Sequential selected proposals:**

1. Start from the displayed current version.
2. Apply selected rows in deterministic order.
3. Feed each returned version into the next request.
4. Record a row-level outcome or error before continuing.
5. If an error requires resynchronization, refresh and resume only when doing
   so preserves the reviewed scope.
6. Refresh the full canonical snapshot once at the end when possible.
7. Summarize partial completion: “Applied 5 of 7; 2 need attention.”

**Atomic batch proposal:** one reviewed batch is one transaction and one
outcome. Validate cumulatively, apply all-or-nothing, and show every contained
destructive step before approval. Do not represent an atomic batch as a set of
independently resolved checkboxes.

## Editing before apply

If expert users can edit proposal JSON:

- parse and validate the edited value before enabling Apply;
- apply the reviewed edited value, not the original hidden value;
- rerun normalization, authorization, dry-run, and risk classification;
- show changed fields clearly; and
- never permit an edit to add a non-allowlisted operation or expand destructive
  scope without the corresponding approval treatment.

For ordinary users, a structured form or Re-draft action is safer than raw JSON.

## Concurrency and errors

- A version conflict belongs on the affected card and should also set the
  application's persistent stale indicator.
- A provider/chat failure belongs in the conversation and must not create
  phantom draft cards.
- A validation or apply failure belongs on the proposal and in authoritative
  session memory as `FAILED`.
- Apply/Ignore buttons must be idempotent or disabled while resolving.
- A proposal resolved from another tab or surface must lose its live controls
  when the shared outcome is observed.
- Key selection, expanded-state, edited arguments, and row errors by proposal
  ID so rerenders do not attach state to the wrong row.

## Accessibility and destructive review

- Use actual buttons, checkboxes, labels, and an accessible disclosure control.
- Announce asynchronous status changes and bulk summaries through an
  appropriate live region.
- Do not communicate status or risk by color alone.
- Keep keyboard focus stable after a row resolves.
- Require the product's explicit destructive approval control; do not default a
  destructive replacement into a bulk selection merely for convenience.

## Canonical checks

Use [test-cases.md](test-cases.md) for acceptance behavior, especially proposal
lifecycle (§1), versioning (§3), edge UX (§8), and queue/card persistence
(§10). Do not reproduce that matrix in component documentation.
