# Production incidents behind the contract

Read this reference when designing the write boundary, reviewing an unfamiliar
implementation, investigating a data-loss near miss, or deciding why one of the
main skill's safeguards exists. It preserves the failure stories because the
sequence from innocent assumption to production failure is often more useful
than a bare rule.

Do not turn every incident-specific mechanism into a requirement for every
product. Retain the invariant, adapt the implementation to the domain, and use
the linked acceptance case when the failure mode is in scope.

## 1. A reviewed placement became an unreviewed cancellation

**What happened.** A human approved a plain placement into a slot that was open
when the proposal was drafted. Several minutes later, another editor filled the
slot. At apply time, the write path inspected current occupancy and helpfully
lowered the original placement into `cancel occupant, then place new item`.
Canonical data lost a real item that the reviewer had never agreed to cancel.
The immutable audit log was the only reliable reconstruction.

**Why ordinary guards missed it.** The draft-time dry-run had validated the
harmless placement. Optimistic versioning proved only that a version matched;
it did not prove that the applied operation retained the reviewed scope. Some
clients also submit the latest version at click time, making that check even
less useful as evidence of proposal identity.

**Durable rule.** Decide destructive lowering while drafting and display it as
an explicit destructive proposal. At apply time, execute that reviewed scope or
fail and request a new draft. Never synthesize a cancel, cascade, move, or
replacement that was absent from the review surface.

**Regression.** See §5.10 in [test-cases.md](test-cases.md).

## 2. A unique import key required reactivation, not creation

**What happened.** A proposal tried to create an item carrying a previously
used external/CFP identifier. The domain dry-run passed, but the database
rejected the write because a soft-deleted row still owned the unique key.

**Why it happened.** The in-memory simulation modeled occupancy but not every
database invariant. The lookup index also omitted the external identifier, so
the planner could not discover the existing row. A guard that searched only
active rows would still miss the cancelled owner of a non-partial unique index.

**Durable rule.** Every dedupe key must be searchable or resolved
deterministically at the write choke point. Match lookup predicates to the
database index predicate. Convert the operation at draft time when possible so
the reviewer sees an update/move/reactivation; retain a final server-side guard
for every surface.

**Regression.** Exercise active and cancelled owners, duplicate operations in
one cumulative batch, and the actual database constraint. See §4 in
[test-cases.md](test-cases.md).

## 3. Apply failure was missing from session memory

**What happened.** A proposal had three modeled outcomes: draft, applied, and
ignored. When Apply failed, the handler threw before changing status or writing
a session event. On the next turn the planner saw the proposal as merely
pending and emitted the same doomed operation again.

**Durable rule.** `FAILED` is a terminal, authoritative outcome for the
attempt. Before surfacing or rethrowing an apply error, record that canonical
state did not change and include a bounded reason. Follow-up planning must
diagnose or alter the proposal, not repeat it verbatim.

**Regression.** Apply a proposal that violates a DB or version invariant and
verify both the visible card error and the next-turn context.

## 4. An audit run vanished inside a serverless budget

**What happened.** History prefetch, token-heavy context, a slow reasoning
configuration, and an unbounded provider call exceeded the background
execution budget. The process was reaped before posting a reply or writing the
normal success/error telemetry row, leaving only a permanent working reaction.

**Durable rule.** Audit/history is an explicit, bounded mode. Put an idle
timeout around streaming calls, a total timeout around one-shot calls, cap
agent turns, emit terminal UI state in `finally`, and track accepted requests
separately so missing run rows are observable. Move genuinely long work to a
durable runner.

The diagnosis and escalation details live in [audit-log.md](audit-log.md); they
are not repeated here.

## 5. “Open” in the UI was not open in the data model

**What happened.** Seed placeholder rows occupied slots in the database while
appearing empty in the schedule grid. An `open_slot` lookup indexed only slots
with no active row, so it omitted user-visible openings and undercounted
capacity. The planner either chose the wrong time or tried a create against an
occupied placeholder.

**Durable rule.** Model placeability as domain state, not absence of one row.
Expose both truly empty slots and fillable placeholder holders, including the
holder identity required for an update. Exclude HOLD/reserved rows. Use the
same classifier in the planner index and write reducer.

**Regression.** See §5.6 in [test-cases.md](test-cases.md).

## 6. Bulk apply reused one stale version

**What happened.** The client sent many approved proposals concurrently with
the same starting `expectedVersion`. The first write incremented the version;
the remaining writes failed even though the human had approved all rows.

**Durable rule.** If separate writes are intentional, apply them sequentially
and feed each returned version into the next request, preserving row-level
errors and refreshing once at the end. If the operations must be all-or-nothing,
represent and review one atomic batch instead.

**Regression.** Test both partial sequential application and atomic rollback;
do not let the UI imply one when the backend implements the other.

## 7. A real item looked like an empty placeholder

**What happened.** A confirmed talk had no linked speaker because the speaker
was temporarily represented only in a descriptive title. A heuristic treated
“no linked speaker” as an empty holder, exposed the row as placeable, and a
benign-looking in-place update replaced the talk. There was no version skew or
slot movement, so the earlier occupancy guard never ran.

**Durable rule.** Destruction includes identity replacement, not only delete or
cancel. Classify using multiple signals—content, status, and domain metadata—and
treat ambiguity as real content. Enforce the no-replacement rule at the shared
write reducer using current stored content, with an explicit reviewed opt-in
for legitimate replacement.

**Regression.** See §5.11 in [test-cases.md](test-cases.md).

## 8. The replacement guard blocked legitimate reactivation

**What happened.** After the previous incident, the new destructive-replacement
guard inspected content but ignored status. A cancelled item still had a real
title and speaker, so correcting its external ID and reactivating it looked like
an identity replacement. Every normal draft was rejected and the planner began
surfacing an internal override to users.

**Durable rule.** Default-deny guards need explicit tests for legitimate
destructive-looking operations. A cancelled row occupies no live slot and
reactivating that same identity is not erasing live content. Key the guard on
status as well as content, and keep internal override flags out of ordinary
planner vocabulary.

## Forensic check after shipping the guard

Periodically scan the append-only audit history for executed cancellations
whose stored reviewed proposal was neither an explicit cancellation nor a
batch containing a visible cancellation. The expected count is zero. This is a
diagnostic over the product's real operation schema, not a substitute for the
write-layer invariant.
