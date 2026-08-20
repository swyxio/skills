---
name: cloudflare-do-turn-based-multiplayer
description: Design, implement, debug, or verify a remote turn-based multiplayer game whose rooms run on Cloudflare Durable Objects. Use for room and invite identity, reconnectable seats, WebSocket hibernation, concurrent turns, action idempotency, revision conflicts, or cross-browser game-state agreement. Do not trigger for generic Durable Object applications or local-only games.
---

# Cloudflare DO Turn-Based Multiplayer

Model each room as one server-authoritative state machine. Keep the deterministic
game reducer independent from Cloudflare transport so rules and concurrency can
be tested without Wrangler.

## Establish authority

Before editing, identify:

- the room's deterministic Durable Object ID;
- the public room code and any private invite credential;
- how a device resumes and which seats it owns;
- the persisted room revision and action identity; and
- how clients recover after an unknown result.

The URL room code is the room selector, not authentication. Store resume
credentials per room, exchange private invites for device credentials, and
remove invite secrets from the visible URL after exchange. Re-authorize the
device against current room state on every mutation.

Read [protocol-and-architecture.md](references/protocol-and-architecture.md)
when changing URLs, identity, message schemas, persistence, or recovery.

## Serialize mutations

Durable Objects serialize events, but handlers can interleave at external
`await` boundaries. For every authoritative action:

1. enter one room mutation gate;
2. re-read state and re-authorize the device inside it;
3. check immutable `actionId` duplication before checking `expectedRevision`;
4. validate the fresh revision and deterministic game rule;
5. persist the accepted state before acknowledgement or broadcast; and
6. return the canonical snapshot for acceptance, duplication, or rejection.

A duplicate action returns the prior accepted result without applying side
effects again. A stale or illegal action returns its `actionId`, reason, and
canonical snapshot. The client proposes an action; it never submits trusted
scores, turn order, or board outcomes.

## Keep acknowledgement and recovery explicit

Correlate every syntactically valid mutation with its `actionId`. Apply snapshots
monotonically by revision. Keep a rejected local draft available for repair.
After an acknowledgement timeout, treat the result as unknown: reconnect, load
the canonical snapshot, and retry only with the same action identity when the
protocol permits it.

One in-flight action per client is the simple default. More optimistic behavior
requires an explicit conflict and rebase design.

## Durable Object and WebSocket boundaries

- Use the Hibernation WebSocket API for idle server connections when appropriate.
- Store only stable identifiers in WebSocket attachments; persistent room state
  belongs in Durable Object storage.
- Derive presence from live sockets rather than treating it as game authority.
- Version and normalize stored room state, then validate cross-field invariants.
- Put alarm-driven bot or timeout transitions through the same mutation path.
- Bound message sizes, text, activity rate, and retained action IDs.
- Parse explicit inbound and outbound protocol allowlists.
- Hash long-lived device credentials and return room/join/resume responses with
  `Cache-Control: no-store`.

Exercise the actual Worker entrypoint and Durable Object binding; a frontend-only
development server is not a multiplayer test.

## Verify the failure cases that matter

At minimum, cover wrong-room credential isolation, private-invite exchange,
invalid resume recovery, same-revision concurrent actions, duplicate delivery,
disconnect/resume, and two isolated browsers completing turns with identical
room state. Add four-player or full-round playthroughs only when supported by
the game being changed.

Read
[failure-modes-and-verification.md](references/failure-modes-and-verification.md)
for reported lobby/start failures or a release-readiness review. Report exactly
which layer passed: pure protocol, local Worker/DO, isolated-browser playthrough,
or deployed custom-domain behavior.
