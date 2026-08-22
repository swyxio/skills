# Slack follow-up controls and execution-receipt delivery

Read this only when a channel-agnostic core already produces typed follow-up
choices or receipt events and the task is to deliver them safely in Slack. This
reference does not define general answer quality, visualization publishability,
or a product's channel-neutral transcript schema. Use
`search-and-retrieval.md` for requester-scoped evidence,
`analytical-visualizations.md` for charts or artifacts, and
`level-3-interactive.md` for mutation approvals or public-message publication.

## Render optional follow-up choices

Accept zero to four typed, read-only choices from the core. The Slack adapter
must not invent domain-aware fallback questions when the core returns none.
Render each choice as numbered ordinary text for notifications, accessibility,
copying, and clients that do not support Block Kit. Add a separate button when
the interactive surface is enabled.

Put only an opaque, short-lived key in each button value. The server-side action
record owns the normalized query and is bound to the workspace, channel, exact
thread, requester, expiry, and idempotency state. On click, acknowledge
immediately, authorize and atomically claim the record, then dispatch through
the same authenticated, serialized thread path as a fresh request.

Keep requester-scoped follow-ups private by default. Omit choices for errors,
pending clarification, approval-only cards, and any answer for which the core
returned no meaningful next question.

## Deliver bounded execution receipts

Never expose hidden reasoning, platform prompts, credentials, raw private
context, unrestricted connector payloads, or unrestricted provider traces.
Distinguish two surfaces:

- A transient authenticated run view may render field-level-redacted evidence
  currently authorized for that requester. It is not automatically retained or
  exportable.
- A persisted or portable receipt contains only allowlisted event fields. Never
  persist, log, or export a prompt, thread context, or tool payload wholesale.

Useful allowlisted fields include event type, provider/model, terminal status,
duration, safe public identifiers, rows/items/bytes, output size, truncation,
omission state, validation or repair outcome, a concise user-safe decision
summary, and provider-reported usage or cost. Label unavailable fields rather
than inferring them. Keep observed data, generated prose, inferred claims,
repairs, and validation outcomes distinguishable.

Represent omitted private material with an explicit marker such as `Private
lookup completed; details were not retained`. Define per-event and total byte
budgets plus a TTL; record original sizes and truncation instead of presenting a
prefix as complete. Store large safe artifacts by reference rather than inline.

Any public link or `Make public` action uses a separately redacted projection and
the authorization, atomic-claim, one-time publication, and expiry flow in
`level-3-interactive.md`. Offer it only when the data lineage is publishable and
the destination is authorized; an authenticated private receipt is not evidence
of public authorization.

## Verify proportionally

Test the claims changed by the task. Follow-up work should prove opaque-key
routing, authorization, immediate acknowledgement, idempotency, and requester
privacy. Receipt work should prove allowlisting, omission, truncation, TTL, and
public-projection boundaries that it modifies.

After deployment, inspect the affected behavior through the authenticated Slack
surface. A first release of the complete capability should additionally exercise
an ordinary answer, an empty or unavailable result, a follow-up click, private
receipt rendering, and any offered export or public-share path. Later bounded
changes do not need to repeat that full matrix unless they affect those claims.
