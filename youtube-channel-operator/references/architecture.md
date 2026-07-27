# Operator architecture

Use this file when implementing the provider core, OAuth accounts, raw methods,
external-action proposals, durable execution, or audit.

## Contents

- [Layer model](#layer-model)
- [Account routing](#account-routing)
- [Raw method registry](#raw-method-registry)
- [External-action ledger](#external-action-ledger)
- [Draft and apply](#draft-and-apply)
- [Idempotency and reconciliation](#idempotency-and-reconciliation)
- [Actor and secret boundaries](#actor-and-secret-boundaries)

## Layer model

| Layer | Responsibility |
| --- | --- |
| Planner | Select registered reads/actions and produce intent |
| Resolver | Map account/resource references to exact IDs and verify ownership |
| Provider adapter | Refresh OAuth, call official APIs, normalize errors/responses |
| Action registry | Declare method schema, effects, quota class, mutable parts, reconciliation |
| Draft validator | Fetch current state, merge updates, evaluate provider constraints |
| External proposal store | Persist exactly what the human reviews |
| Executor | Claim, drift-check, apply/reconcile once, and refetch |
| Audit | Append actor, before/after, attempts, errors, and outcome |
| Surface adapter | Slack/web/CLI rendering, signed approvals, status, and deep links |

Keep external YouTube actions out of product-specific canonical ledgers such as a
conference schedule proposal table. Share the proposal pattern, not unrelated
foreign keys, target types, or version numbers.

## Account routing

Use immutable account keys:

```ts
type YouTubeAccountKey = "ai_engineer" | "latent_space";

type YouTubeAccount = {
  key: YouTubeAccountKey;
  channelId: string;
  credentialNamespace: string;
};
```

For every draft and apply:

1. load credentials for `accountKey`;
2. refresh the user OAuth token;
3. call `channels.list(mine=true)`;
4. require the configured channel ID;
5. fetch the exact target resource;
6. verify resource ownership when the API exposes it.

Use separate environment bindings or secrets:

```text
YOUTUBE_<ACCOUNT>_CHANNEL_ID
YOUTUBE_<ACCOUNT>_READ_OAUTH_*
YOUTUBE_<ACCOUNT>_WRITE_OAUTH_*
```

Read and write tokens may be separate for blast-radius control, but a full
operator can use one intentionally broad grant per account. Never distribute the
owner refresh token to chatbot users.

## Raw method registry

Expose four public tool families:

```text
youtube.data.call
youtube.live.call
youtube.analytics.query
youtube.reporting.call
```

Represent methods as server-owned registrations:

```ts
type YouTubeMethod = {
  id: string;                    // "videos.update"
  api: "data" | "live" | "analytics" | "reporting";
  effect: "read" | "create" | "update" | "delete" | "transition";
  inputSchema: JsonSchema;
  requiredParts?: string[];
  resourceKind?: string;
  ownerCheck?: string;
  normalize(input: unknown): NormalizedRequest;
  preview(ctx: CurrentResource, request: NormalizedRequest): Preview;
  reconcile(attempt: Attempt): Promise<Reconciliation>;
};
```

Reject:

- arbitrary URL/host/method combinations;
- caller-supplied Authorization or quota project headers;
- undocumented Studio endpoints;
- caller-supplied `execute: true` that bypasses the proposal policy;
- fuzzy titles at persistence time;
- secrets or local filesystem paths as durable media identities.

Resolve fuzzy human references before creating the draft. Persist only exact
channel, video, playlist, playlist-item, comment, caption, broadcast, or stream
IDs.

## External-action ledger

Recommended provider-neutral tables:

```text
external_action_proposals
  id, provider, account_key, channel_id
  action_type, resource_kind, resource_id
  base_etag
  before_json, desired_patch_json, request_json, preview_json
  effect, risk, status, idempotency_key UNIQUE
  created_by, approved_by
  created_at, approved_at, applied_at, expires_at

external_action_attempts
  id, proposal_id, attempt_no, lease_until
  provider_request_id, status, error_code
  response_etag, response_json
  created_at, completed_at

external_action_audit_events
  id, proposal_id, sequence
  actor_id, actor_email, surface_principal
  action, before_json, after_json
  base_etag, result_etag, metadata_json, created_at

youtube_account_members
  account_key, user_id, role
```

Make audit rows append-only. Do not persist tokens, Authorization headers, raw
provider stack traces, or media bytes in the ledger.

Use statuses such as:

```text
draft → applying → applied
      ↘ rejected
      ↘ conflicted
      ↘ failed
```

## Draft and apply

### Draft

1. resolve exact account/resource;
2. fetch current mutable parts and ETag;
3. merge the requested patch into the complete mutable part;
4. validate provider state restrictions;
5. compute a normalized request and before/after preview;
6. derive an idempotency key;
7. persist an expiring immutable proposal;
8. render the review card.

### Apply

1. reauthenticate the signed approver;
2. atomically claim `status='draft'`;
3. refetch channel and resource;
4. compare ETag/canonical before state;
5. mark `conflicted` instead of silently rebasing;
6. dispatch the exact persisted request;
7. reconcile an uncertain response;
8. refetch the resource;
9. persist attempt and append audit outcome;
10. resolve all active surfaces and schedule measurement.

Send `If-Match` when supported, but keep the application-level refetch/compare
because client libraries and endpoints do not expose conditional writes
uniformly.

## Idempotency and reconciliation

Use:

```text
sha256(accountKey + methodId + resourceId + normalizedRequest + baseETag)
```

Handle operation classes separately:

- **Updates:** retry only after reading state; success if canonical after state
  already matches.
- **Playlist insert:** search exact `(playlistId, videoId)` membership before
  retrying and retain returned playlist-item ID.
- **Uploads:** use resumable sessions, immutable object IDs, content SHA-256, and
  a durable job.
- **Thumbnail/caption media:** use immutable object IDs and checksums.
- **Deletes:** treat retry-time 404 as success only after a recorded dispatched
  attempt and exact-resource reconciliation.
- **Multi-step packages:** each step owns an attempt and outcome. Continue or stop
  according to the reviewed package policy; report partial completion.

## Actor and secret boundaries

Record the actual signed human proposer and approver. A synthetic service user may
perform the provider call but must not replace human attribution.

Suggested account roles:

```text
viewer   read and analytics
proposer draft common or raw actions
editor   approve metadata, thumbnail, playlist, comment, caption actions
owner    approve uploads, publication state, deletes, live transitions, channel-wide changes
```

Trusted environments may grant every power user every role. Keep roles and audit
in the model because OAuth's broad scope cannot identify which human initiated a
call.

Give write secrets only to the executor runtime. Analytics workers receive read
credentials unless they also execute approved writes. Redact external data from
traces when it contains private/unpublished content.
