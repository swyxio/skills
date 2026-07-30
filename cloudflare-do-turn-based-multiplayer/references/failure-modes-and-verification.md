# Failure modes and verification

## Contents

- [Failure catalog](#failure-catalog)
- [Test layers](#test-layers)
- [Concurrency test](#concurrency-test)
- [Browser scenarios](#browser-scenarios)
- [Local Wrangler discipline](#local-wrangler-discipline)
- [Production acceptance](#production-acceptance)
- [Evidence template](#evidence-template)

## Failure catalog

### Invite opens the wrong room

Symptom: a friend follows room B but reconnects to room A or sees an apparently
stuck lobby.

Cause: one global saved identity is loaded before the URL is inspected.

Prevention: make the URL authoritative and key credentials by room code. Test
stored A plus requested B explicitly.

### Friends cannot start the room

Check these independently:

- every required seat is claimed or assigned;
- every joining browser is in the same room code;
- the host still has host authority;
- all clients completed resume and WebSocket authentication;
- presence is not being mistaken for durable seat ownership;
- the start action received a correlated acknowledgement;
- all clients installed the same canonical snapshot revision.

A green health endpoint or lobby render does not prove these.

### Endless reconnect after local state reset

Cause: a browser keeps retrying a token for a deleted local room or a changed
Durable Object namespace.

Prevention: resume preflight with terminal `401`/`404`, room-scoped credential
removal, and a visible rejoin path.

### Last-write-wins same-revision race

Cause: two WebSocket messages read the same revision before either persists.
Durable Object single ownership does not prevent interleaving across awaits.

Prevention: serialize the complete read-authorize-apply-persist sequence and
read state inside the gate.

### Duplicate effects after retry

Cause: an uncertain client retry gets a new ID, or a duplicate is reapplied
before checking the stored idempotency window.

Prevention: stable action IDs, bounded recent-action storage, accepted duplicate
acknowledgement, and no duplicate broadcast/activity/bot trigger.

### UI clears a rejected piece

Cause: optimistic local cleanup occurs when the action is sent.

Prevention: keep the draft until correlated acceptance. On rejection, install
the canonical snapshot and preserve the candidate for repair.

### Rapid controls commit an old transform

Cause: several arrow/rotation inputs and Enter occur before a framework render,
so the click handler closes over an older draft.

Prevention: update a synchronous candidate reference with every transform and
commit from that reference. Test without sleeps between inputs and commit.

### Local multiplayer test has no Durable Object

Cause: the browser suite starts the frontend production server but bypasses the
Worker entry and bindings.

Prevention: build, then run:

```bash
npx wrangler dev --config dist/server/wrangler.json \
  --ip 127.0.0.1 --port 4173
```

Verify the configured Durable Object binding is listed at startup.

### Browser sockets drop during QA

Cause: the build output changes while Wrangler watches it, causing a reload.

Prevention: after the final build, copy `dist` to an isolated temporary
directory and run Wrangler from that immutable copy for long click-throughs.
Classify a build-triggered local reload separately from an application
reconnect bug.

### Request stream error after a proxied 404

Symptom under Wrangler:

```text
Can't read from request stream after response has been sent
```

Cause: forwarding a request object whose body stream is later read again.

Prevention: consume the body into an `ArrayBuffer` and construct a fresh request
for the Durable Object.

### Four tabs pass while four browsers fail

Cause: shared browser storage, identical engine behavior, WebGL differences,
background throttling, or browser-specific WebSocket behavior is hidden by
same-browser contexts.

Prevention: use isolated contexts for deterministic automation, then repeat the
join/start and representative turns in the actual supported browser engines.

## Test layers

Keep each layer independently runnable.

### Pure identity tests

- URL B never loads room A credentials.
- Matching public room credentials resume.
- Private invite forces join.
- Bare online route does not auto-resume.
- Multiple room credentials coexist.
- Leaving A preserves B.
- Malformed storage is ignored.
- Matching legacy credentials migrate only when safe.

### Protocol parser tests

- Validate IDs, room codes, tokens, revisions, message sizes, and action shapes.
- Accept well-formed `action.result`.
- Reject missing snapshots, invalid IDs, invalid accepted flags, and malformed
  rejection reasons.
- Keep stored room schema version separate from wire protocol version.

### Coordinator tests

- Only the host starts.
- Only the active device acts.
- Illegal and stale actions do not advance revision.
- Accepted actions advance exactly once.
- Duplicate actions return accepted without changing revision.
- Resume returns `200`, `401`, and `404` correctly.
- Released devices lose authority even if their socket remains open.
- Host release removes the device and closes all tagged sockets.
- Stored-room migrations preserve seats and canonical game data.
- Bots use the same canonical reducer and failure fallback.

### Worker routing tests

- Creation routes to the generated room name.
- Join, resume, and socket routes address the same object.
- POST bodies survive Worker-to-DO forwarding.
- WebSocket upgrade headers and query token survive forwarding.

## Concurrency test

Force the storage read to yield so a broken implementation reliably races:

```ts
const storage = {
  get: async (key) => {
    const captured = values.get(key);
    await delay(15);
    return captured;
  },
  put: async (key, value) => values.set(key, value),
};

await Promise.all([
  room.webSocketMessage(socketA, actionAtRevision(10, "action-a")),
  room.webSocketMessage(socketB, actionAtRevision(10, "action-b")),
]);
```

Assert:

- two correlated results are returned;
- exactly one is accepted;
- the other carries the canonical rejection snapshot;
- stored revision is 11, not two competing versions of 11;
- exactly one game mutation and activity entry occurred.

Also test the same action ID twice. Both callers may receive acceptance, but
storage, broadcast, activity, and bot work occur once.

Force two simultaneous joins for the same seat and require exactly one winner.
Test lost acknowledgement after commit: reconnect must reveal the committed
revision, and retrying the same action ID must not duplicate the transition.

## Browser scenarios

Run browser E2E against local Wrangler with isolated storage:

1. Seed storage with room A, open URL B, and assert the join form contains B.
2. Seed invalid credentials for A and valid credentials for B; open A and
   assert only A is removed after resume failure.
3. Create a two-player room in context 1; join from context 2; start and verify
   both clients show the same active player and room URL.
4. Complete a legal host turn, resolve it, advance, complete the guest turn,
   and assert both return to host on round 2 with equal scores and board state.
5. Create four isolated players, complete one full round, and assert all clients
   agree on the next active player, round, scores, territory, and revision.
6. Disconnect one client, reconnect with its room-scoped token, and confirm its
   seat and current snapshot return.
7. Disconnect after the server commits but before the acknowledgement is
   observed; reconnect and prove the move appears exactly once.
8. Deliver an older snapshot after a newer one and prove the client does not
   regress.
9. Release a remote device and prove its existing socket is closed and cannot
   mutate the room.
10. Submit rapid rotations/nudges followed immediately by commit.
11. Attempt a second action while the first is pending and verify it is blocked
   visibly.

For click-throughs, use a deterministic legal-move witness from the same
server-authoritative rules engine. Record the exact room code and expected
post-turn state so an invalid construction is not misdiagnosed as a networking
failure.

## Local Wrangler discipline

Build before starting the acceptance server. Ensure the browser config points
to Wrangler rather than a binding-less frontend server.

For long manual runs:

1. build once;
2. copy `dist` to a unique temporary directory;
3. start Wrangler from that copied config;
4. do not rebuild during the run;
5. inspect server output for exceptions and unexpected reconnects;
6. stop the server after QA.

Do not use production for destructive room E2E. Use disposable local state or a
disposable preview environment.

Confirm the actual build/deploy config exports the Durable Object class and
declares both its binding and required `new_sqlite_classes` migration. Inspect
the generated `dist/server/wrangler.json` when that is the file Wrangler and the
release command consume.

## Production acceptance

When deployment is requested, verify separately:

1. exact source SHA and clean build;
2. Durable Object class export, binding, and migration;
3. uploaded Worker version;
4. route and custom hostname;
5. health endpoint;
6. create, join, resume, and WebSocket upgrade on the owning hostname;
7. two-player turn exchange;
8. representative four-player round;
9. reconnect after a real network interruption;
10. logs and metrics without new exceptions.

Do not claim production multiplayer from a successful Wrangler deploy alone.

## Evidence template

```text
Environment:
Source/build:
Worker/DO binding:
Hostname:

Two-player room:
Browsers/contexts:
Join/start:
Turn exchange:
Final round/active player/scores:

Four-player room:
Browsers/contexts:
Join/start:
Full-round result:
Final round/active player/scores:

Reconnect:
Server logs:
Known unrelated failures:
Release state:
```
