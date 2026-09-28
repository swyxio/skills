# Communication-app attention and notifications

Use for interruption policy, notification text/actions, batching, or AI recaps.

## Importance and cadence are separate decisions

Personal default: explicit rules plus model assistance and discoverable user
corrections. Protect actionable/personal communication; neither unread status nor
an “urgent” subject alone establishes importance. A bulk-sender rule should not
silently hide urgent work.

Cadence is **undecided**. Present configurable rolling batches, scheduled digests,
or an in-app summary without routine pushes and let the user choose when relevant
([tradeoffs](clarifications.md)). Do not impose a fixed interval. Explain server
scheduling versus best-effort/device constraints before promising timing.

Group routine items by coherent ownership, such as account and window. Preserve
originals, accurate counts, deduplication, and access to the constituent list.
Avoid empty/duplicate digests and badges that conflate unread routine content
with urgent work.

## Text and privacy

Decode supported HTML entities so snippets do not display `&#39;`. Decoding,
rich-content sanitization, and HTML rendering are separate; use established
helpers, avoid double decoding, and never render untrusted mail HTML as alert UI.
Inspect long/missing/multilingual sender, subject, and preview text in affected
collapsed/expanded states.

Respect existing OS/app preview settings; neither generic counts nor private
body/AI previews are a universal personal default. Product importance does not
itself authorize time-sensitive or critical interruption levels; check the
applicable capability and platform contract
([Apple guidance](https://developer.apple.com/design/human-interface-guidelines/managing-notifications),
[levels](https://developer.apple.com/documentation/usernotifications/unnotificationinterruptionlevel)).

## Recaps and proof

Preserve list access while optional AI generation is pending, unavailable, or
failed. A claimed AI recap must come from the intended provider and source items,
with access to originals. Do not fabricate requested actions or urgency from
truncated snippets. Allowed private data, provider, cost, retention, and retry
policy remain product-specific.

Keep evidence separate: importance classification → scheduling → content →
transport → OS presentation → routing → action. A healthy APNs destination does
not establish recap readiness; payload acceptance is not device display; canned
prose is not live AI generation. Arbitrary cached messages labeled “routine
newsletters” test display/navigation, not classification, especially if the list
contains urgent personal mail.

## Routing and actions

Carry account/connection and exact record identity through extension, deep link,
app, and backend. A digest ID is not a message-action ID. Preserve navigation
back to the owned batch. Opening, marking read, archiving, reminding, trashing,
unsubscribing, and sending have distinct effects; classification or recap text
cannot authorize them. Reuse action authentication, idempotency, confirmation,
and Undo contracts; use actual receipts for live-success claims.

Keep destination/permission health, recap readiness, and detailed action receipts
separate in settings. Isolate and visibly label synthetic test controls/data.
