# Validation and release checklist

Read this reference when adding an operation or patchable field, changing the
planner schema, modifying dry-run/apply behavior, or preparing a mutation
copilot release. This is the one implementation checklist; detailed scenario
fixtures and manual QA live in [test-cases.md](test-cases.md) and are not
duplicated here.

## Adding a patchable field

Verify one end-to-end path:

1. The domain operation accepts and persists the canonical field.
2. The planner schema and server allowlist include it.
3. User-facing aliases normalize to the canonical key before validation.
4. The planning and repair prompts describe the canonical field only as needed.
5. Sanitization places structural values such as target IDs outside content
   patches when the operation contract requires it.
6. Dry-run retains the field and models interactions with other proposals.
7. Apply uses the edited/reviewed value through the normal authorization and
   audit path.
8. A focused test proves the value survives planner output, normalization,
   validation, persistence, review edits, and apply.

Silent stripping is a bug. Return a visible validation reason when a field is
unsupported or malformed.

## Validation pipeline

Keep these stages explicit and independently testable:

| Stage | Required proof |
|---|---|
| Parse | Output matches a bounded schema; unknown operation kinds fail closed |
| Normalize | Known aliases and misplaced structural fields become canonical |
| Resolve | Every target is real and unambiguous; candidate ambiguity is visible |
| Authorize | Actor may read the context and propose/apply the requested scope |
| Validate | Operation fields, references, status transitions, and domain rules hold |
| Cumulative dry-run | Operation N sees effects of operations 1…N−1 |
| Persist draft | Reviewed operation and evidence are immutable or versioned |
| Apply | Reviewed scope is rechecked against current state without expansion |
| Database | Unique, foreign-key, check, occupancy, and transaction constraints remain final authority |
| Outcome | Applied, ignored, or failed result is stored and reflected in session memory |

The dry-run should model every database invariant reasonably available in the
snapshot. A self-repair turn cannot fix a constraint its validator cannot see.
Return per-proposal reasons to one bounded repair attempt; if no drafts survive,
the answer must not claim success.

## Before release

- [ ] The model can propose but cannot write canonical state directly.
- [ ] Planner operation kinds, fields, aliases, and target resolvers are
      allowlisted.
- [ ] IDs required for mutation or dedupe are searchable or resolved
      deterministically server-side.
- [ ] Cumulative dry-run covers database invariants and interacting proposals.
- [ ] Dropped drafts and repair failures are visible to the user.
- [ ] Destructive actions and identity replacements are explicit at draft time.
- [ ] Apply executes the reviewed scope or fails; it never synthesizes a more
      destructive operation.
- [ ] Placeholder/content classification is shared by planning and writing and
      defaults ambiguous content to protected.
- [ ] Cancelled-row reactivation remains possible without an internal override.
- [ ] Unique external keys reuse/update/reactivate the existing owner according
      to the actual index predicate.
- [ ] Session context distinguishes DRAFT, APPLIED, IGNORED, and FAILED.
- [ ] Apply failures are recorded before the error is returned to the user.
- [ ] Optimistic version conflicts are visible and refresh behavior is defined.
- [ ] Compound requests become independently reviewable proposals or one
      explicitly atomic batch.
- [ ] Bulk sequential apply chains versions; atomic batch uses one transaction.
- [ ] Every shipped adapter shares authorization, proposal IDs, apply semantics,
      idempotency, and authoritative outcomes.
- [ ] Audit and tracing are distinct; sensitive history is opt-in and scoped.
- [ ] Long-running requests have bounded provider calls and a terminal UI state.
- [ ] The relevant acceptance cases in [test-cases.md](test-cases.md) pass.

Apply surface-specific checks only when that surface ships:

- Web review cards: [proposal-review-ux.md](proposal-review-ux.md)
- Slack controls: [slack-surface.md](slack-surface.md)
- Email authentication/threading: [email-surface.md](email-surface.md)
- Audit operations: [audit-log.md](audit-log.md)
- Tracing and feedback: [observability.md](observability.md)
- Floating panel ergonomics: [surface-ux.md](surface-ux.md)

## Implementation smells

- Assistant prose is replayed without authoritative proposal outcomes.
- Apply catches an error for UI display but never records `FAILED` for the next
  planner turn.
- Apply re-derives intent from live state and can increase destructive scope.
- Dry-run models occupancy while the database also enforces unseen unique,
  foreign-key, or check constraints.
- A unique key is enforced by the database but absent from every read index.
- Active-only dedupe disagrees with a unique index that also covers cancelled
  rows.
- Planner prompts are the only protection against an unsafe write.
- A full canonical snapshot is fetched merely to poll a version number.
- New turns replace the proposal catalog and erase unresolved cards.
- Bulk apply fans out one fixed version or claims atomicity while allowing
  partial completion.
- Adapter-specific paths bypass the shared proposal/apply authority.
- Sensitive audit history is included in ordinary planner context.
- Optional email, Slack, tracing, panel, or tier infrastructure is treated as a
  prerequisite for an unrelated copilot.

## Evidence at handoff

Report the focused validation that proves the changed contract, including the
operation/field path, destructive and failure cases, database constraint test,
session outcome, and each affected surface. Do not substitute a large passing
suite for the one regression that motivated the change.
