# Stateful agent workflows

Read this when a Slack bot continues multi-turn operational work, resolves named
resources, or proposes external mutations. Ordinary one-shot Q&A can stay with
the maturity-level references.

## Preserve causal thread context

Slack thread replies are returned oldest-first and may paginate. A fixed first
page silently gives the model stale context. Build each turn from:

1. the thread root;
2. the newest replies strictly before the triggering message;
3. persisted operational state such as active domain and proposal outcomes.

Use the triggering message timestamp as a strict causal cutoff (`message.ts <
trigger.ts`). Traverse cursors before selecting the tail, then fit the root plus
the newest tail into a character/token budget. Do not include later sibling
messages that arrived while the current job was running.

```ts
type ThreadContextQuery = {
  beforeTs: string; // strict: ts < beforeTs
  maxMessages: number;
  maxChars: number;
};

const replies = await fetchAllReplyPages(channel, threadTs, {
  latest: triggerTs,
  inclusive: false,
});
const prior = replies.filter((message) => compareSlackTs(message.ts, triggerTs) < 0);
const context = rootPlusNewestTail(prior, { maxMessages: 40, maxChars: 16_000 });
```

Keep context sources distinct:

- **Live Slack context:** what humans and the bot said in the thread.
- **Persisted operational state:** applied/rejected/draft outcomes, active domain,
  selected target, and other server-authoritative facts.

Merge them. Never choose Slack *or* persisted state merely because one is
present. Proposal outcomes override optimistic prose.

## Make a Slack thread the shared session

Key operational continuity by workspace + channel + root timestamp, not by the
requesting actor:

```ts
const sessionKey = `slack-thread:${teamId}:${channel}:${threadTs}`;
```

This lets a teammate continue the same operational workflow. If some replies or
results are actor-private, add per-message visibility (`session | actor`) and
viewer identity; do not revert the whole session to actor-scoped.

Persist a compact `activeDomain` (`youtube`, `schedule`, `support`, etc.) even
when the turn text itself is transient. This lets safe routing state survive
without retaining sensitive search results.

## Serialize work per thread

Two sibling mentions can arrive before either finishes. Without serialization,
both load the same stale context and execute independently. Enqueue before
loading context, then claim only the earliest unfinished turn for that thread.

```text
accept + dedupe event
  → enqueue(thread, trigger_ts)
  → durable worker claims earliest turn
  → load causally prior Slack + persisted state
  → plan
  → persist outcome
  → deliver
  → complete queue row
  → next sibling may claim
```

Use a durable database/queue with:

- unique `(thread_key, trigger_ts)` for idempotency;
- monotonic sequence per accepted turn;
- `queued | running | completed | failed`;
- lease owner + expiry for crashed workers;
- visible terminal error delivery;
- regression tests for rapid siblings and stale leases.

Do not hold an in-memory mutex in serverless code.

## Route statefully, not by stray nouns

Classify the raw current request, never the context-augmented prompt. Separate:

- **Strong explicit intent:** “move this session to Room 8 at 10 AM” can switch
  to scheduling.
- **Ambiguous nouns:** “talk,” “session,” “track,” “those,” and a person’s name
  inherit the active workflow.
- **Domain-explicit intent:** “playlist,” “video,” or “thumbnail” selects the
  media workflow.

A weak noun must not override an active domain. Conversely, an active domain
must not block a strong explicit request to switch.

Scope prompt grounding to the chosen domain. Do not inject a complete scheduler
index, conflict report, CRM dump, or other unrelated corpus into every turn.
Expose targeted lookups for cross-domain questions.

## Resolve owned resources before asking for IDs

For frequently referenced owned resources, maintain a compact catalog with:

- human-readable name/title;
- exact provider ID and URL;
- publication/update time;
- normalized title/name/alias tokens;
- source and refresh timestamp.

Start with a complete crawl, refresh incrementally, and periodically reconcile
fully. Resolve locally first; use the provider’s authenticated search only on a
catalog miss. General web search is a separate opt-in capability, not the
fallback for owned-resource lookup.

The planner must:

1. exhaust owned-catalog resolution before asking a human for an ID;
2. pair every opaque ID with the human-readable name;
3. draft actions for unambiguous matches immediately;
4. list unresolved names separately rather than dropping the whole batch.

## Ground writes independently

Discovery context is not write authority. Slack search may identify a title, but
a persisted external action must be independently hydrated from the owning
provider:

1. resolve the exact target ID;
2. re-read it with server-managed credentials;
3. verify tenant/account/channel ownership;
4. capture human-readable display fields and current state;
5. freeze the typed request and ETag/version precondition;
6. apply only after authorization + human approval;
7. re-read and verify the result.

Do not blanket-drop an otherwise verified action merely because transient Slack
search helped discover it. Keep raw Slack hits transient; persist only the
bounded, provider-verified action and safe rendering.

## Make approval controls state-aware

Buttons are projections of backend state, not state themselves.

- Store only opaque result/action IDs in button values.
- Ack the click immediately.
- Claim actions atomically.
- Replace/remove a resolved action’s buttons in the original message.
- For **Approve all**, re-read the set and apply only actions still in `draft`;
  individual actions already applied/rejected must be skipped.
- Rewrite progress after each item and continue after an isolated failure.
- Validate both HTTP status and Slack `{ok:false}` responses.
- Log route, message timestamp, action/result ID, and actionable Slack error.

For publish-private-result flows, persist a short-lived rendered-result snapshot
and put only its ID in the button. Do not depend on Slack including
`payload.message` for an ephemeral message. On click:

1. return/dispatch an immediate acknowledgement;
2. claim the snapshot;
3. authorize workspace, actor, channel, and thread;
4. publish with `chat.postMessage` into the exact thread;
5. validate Slack’s response;
6. scrub or expire the retained payload.

## Render for Slack

- Use native `table` blocks for real tables, not Markdown pipe tables.
- Keep a complete top-level `text` fallback for accessibility/notifications.
- Pair names with IDs: `AIE World's Fair Complete (PL…)`, not a bare `PL…`.
- Disable `unfurl_links` and `unfurl_media` where previews add noise.
- Keep approval cards concise; link to the durable system of record for detail.

## Regression checklist

- [ ] Thread longer than one Slack page returns root + newest prior tail.
- [ ] Trigger message and later sibling messages are excluded.
- [ ] Persisted outcomes and live Slack context are both present.
- [ ] A teammate can continue the same thread session.
- [ ] Rapid sibling requests execute in message order.
- [ ] Ambiguous follow-up retains the active domain; strong explicit intent switches.
- [ ] Named resources resolve from the owned catalog before provider search.
- [ ] Partial matches produce partial drafts plus an unresolved list.
- [ ] Slack-assisted discovery can still produce independently hydrated actions.
- [ ] Approve all acts only on remaining drafts.
- [ ] Resolved buttons cannot be clicked again.
- [ ] Ephemeral publish works without `payload.message`.
- [ ] Slack `ok:false` produces a visible, actionable failure.
