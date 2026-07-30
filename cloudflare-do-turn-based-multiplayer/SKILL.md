---
name: cloudflare-do-turn-based-multiplayer
description: Design, implement, debug, review, or verify remote turn-based multiplayer games on Cloudflare Durable Objects. Use for room URLs and invites, reconnectable player identity, WebSocket hibernation, server-authoritative turns, revision conflicts, idempotent actions, concurrent move races, presence, lobby/start failures, deterministic bots, local Wrangler testing, cross-browser playthroughs, or production verification of a Durable Object game room.
---

# Cloudflare DO Turn-Based Multiplayer

Build each room as one server-authoritative state machine. Treat the room URL,
resume credential, WebSocket connection, player seat, game revision, action
acknowledgement, deployment, and browser-visible outcome as separate facts.

Use this skill together with the adjacent `cloudflare-production-builder` skill
when the work includes provisioning, migrations, deployment, observability,
cost, or live release verification.

## Start with the authority sentence

Write this before changing code:

> The Durable Object owns ____. The room is addressed by ____. A device resumes
> with ____. Mutations serialize by ____. Every action is identified by ____ and
> fenced by revision ____. Clients recover from uncertainty by ____.

Stop and resolve ambiguity if the URL, local storage, client reducer, and
Durable Object can select different rooms or disagree about canonical state.

## Inspect the full path

Trace these surfaces before designing:

1. room creation and `getByName()` routing;
2. public and private invitation URL generation;
3. local credential storage and resume behavior;
4. join, resume, and WebSocket upgrade routes;
5. Durable Object class export, binding, migration, storage schema, and
   generated deployment config;
6. WebSocket attachment, tags, presence, and hibernation;
7. client action submission, acknowledgement, retry, and error UI;
8. deterministic reducer, validation, scoring, bots, and turn advancement;
9. local Wrangler bindings, browser tests, and release path.

Do not infer a working Durable Object from a frontend-only dev server. Exercise
the real Worker entry point with the actual local DO binding.

Keep the deterministic room coordinator/reducer independent of Cloudflare
transport so authority, migrations, and adversarial concurrency can be tested
without Wrangler.

## Enforce the room and identity contract

- Make the explicit room code in the URL the sole room selector.
- Store resume credentials by room code, never as one global “last room.”
- Let a public room URL resume only credentials for that exact room.
- Force a private seat invite through the join path even if another credential
  exists.
- Strip private seat and invite tokens from the visible URL after successful
  exchange for a device resume token.
- Treat a room code as routing information, not authentication.
- Model a device as owning one or more seats; do not assume one token equals one
  player. Re-authorize ownership against current room state on every message.
- Add an authenticated resume preflight. Return `200` for a valid device,
  `401` for an invalid credential, and `404` for a missing room.
- On `401` or `404`, remove only that room’s credential and show a recoverable
  join screen. Do not reconnect forever.
- Make leaving one room preserve credentials for other rooms.
- Do not silently resume a saved room from a bare online landing route.

Read [protocol-and-architecture.md](references/protocol-and-architecture.md)
when designing URLs, identity storage, message schemas, or recovery behavior.

## Serialize every authoritative mutation

Durable Objects provide a single logical owner, but WebSocket handlers can
interleave at `await` boundaries. A read-modify-write sequence is not safe
merely because it runs in one object.

- Put create, join, seat changes, game actions, and bot transitions through one
  mutation gate when they can touch the same room state.
- Re-read room state and re-authorize the device inside the gate.
- Use an immutable `actionId` as the idempotency key.
- Check duplicate `actionId` before `expectedRevision`, so a retry of an already
  committed action with its old revision remains idempotently accepted.
- Validate `expectedRevision` against fresh state for nonduplicates.
- Persist accepted state before acknowledging or broadcasting it.
- Acknowledge duplicates as accepted with the canonical snapshot, but do not
  apply, persist, broadcast activity, or trigger bots twice.
- Reject a stale or illegal action with its `actionId`, reason, and canonical
  snapshot.
- Keep deterministic rule validation, scoring, turn order, and bot state
  authoritative on the server. The client proposes actions; it does not submit
  trusted outcomes.

## Make acknowledgement explicit

Use a correlated result for every syntactically valid game action:

```ts
type ActionResult = {
  type: "action.result";
  actionId: string;
  accepted: boolean;
  reason?: string;
  snapshot: RoomSnapshot;
};
```

- Allow one in-flight game action per client unless a more sophisticated
  optimistic protocol is deliberately implemented.
- Disable mutation controls while awaiting the result and expose syncing state.
- Apply snapshots monotonically by revision; ignore older arrivals.
- Clear a local draft only after acceptance. Keep it on rejection so the player
  can repair the move.
- On acknowledgement timeout, treat the result as unknown: reconnect, install
  the canonical snapshot, then let the player decide whether to retry.
- Never blindly resend an uncertain mutation with a new action ID.

## Keep transport and lifecycle safe

- Hash long-lived device tokens at rest and compare them without early exit.
- Put only stable device or seat identifiers in WebSocket attachments.
- Derive presence from live tagged sockets; do not make presence authoritative
  game state.
- Version stored room state and normalize older versions on read.
- Validate cross-field invariants after normalization: one host, correct seat
  count/order, unique seat ownership, bidirectional device-seat links, and
  mode-specific bot/invite/local fields.
- Include scheduled bot/alarm transitions in the same mutation discipline.
- Close every tagged socket for a device immediately when host action revokes
  that device.
- When proxying request bodies from a Worker to a Durable Object, consume or
  clone the body deliberately before constructing the forwarded request.
  Reusing a request stream after sending a response can fail under Wrangler.
- Bound message sizes, text lengths, activity frequency, chat rate, recent
  action IDs, and retained activity.
- Parse explicit message allowlists in both directions. Never cast arbitrary
  decoded JSON into a protocol union.
- Return room, join, and resume responses with `Cache-Control: no-store`.

## Verify adversarially

At minimum, prove:

1. stored room A plus URL room B opens B, never A;
2. A and B credentials coexist, and leaving A preserves B;
3. private invites force joining and secrets disappear from the URL;
4. invalid resume credentials return to join without an infinite loop;
5. two same-revision concurrent actions result in exactly one state mutation;
6. a duplicate action returns the same canonical state without duplicate work;
7. rapid local transforms followed by commit submit the latest transform;
8. two remote humans join, start, complete one turn each, and agree on round,
   active player, scores, and board;
9. four players join, start, complete a full round, and agree on the next turn;
10. disconnect and resume preserve seat ownership and canonical state.

Use actual browsers where compatibility matters. Keep each player in an
isolated browser profile or context. Capture the room code, player names,
revision/round, active player, and scores as evidence.

Read
[failure-modes-and-verification.md](references/failure-modes-and-verification.md)
before diagnosing a reported lobby/start failure or declaring multiplayer
ready.

## Completion language

Report these separately:

- `implemented locally`
- `focused protocol tests pass`
- `local Durable Object browser flow passed`
- `cross-browser playthrough passed`
- `committed`
- `pushed`
- `Worker deployed`
- `custom-domain multiplayer verified`

Never call a create/join smoke test a turn-playthrough, or a successful build a
multiplayer verification.
