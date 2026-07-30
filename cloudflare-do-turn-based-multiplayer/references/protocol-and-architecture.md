# Protocol and architecture reference

## Contents

- [Authority and partitioning](#authority-and-partitioning)
- [Room URL and local identity](#room-url-and-local-identity)
- [HTTP lifecycle](#http-lifecycle)
- [WebSocket protocol](#websocket-protocol)
- [Serialized action algorithm](#serialized-action-algorithm)
- [Client state machine](#client-state-machine)
- [Durable Object lifecycle](#durable-object-lifecycle)
- [Security and privacy](#security-and-privacy)

## Authority and partitioning

Use one Durable Object instance per room code:

```ts
const stub = env.GAME_ROOMS.getByName(roomCode);
```

The Durable Object owns:

- room configuration and lifecycle;
- devices, seats, and host authority;
- canonical reducer state and revision;
- recent action IDs;
- deterministic rule validation, scoring, and turn advancement.

The client owns only presentation state, an uncommitted placement draft,
preferences, and a room-scoped resume credential.

Do not split one room's mutable game authority between a Durable Object and D1,
KV, browser storage, or multiple Workers. Those systems may hold indexes,
analytics, archives, or read models, but the room transition must have one
serialization point.

## Room URL and local identity

Use a canonical public URL:

```text
/play?room=ABCD234567#online
```

Use private parameters only for initial seat claim:

```text
/play?room=ABCD234567&seat=seat_id&invite=secret#online
```

After a successful private join, replace the visible URL with the public form.
Store the returned device token locally:

```json
{
  "version": 2,
  "rooms": {
    "ABCD234567": {
      "token": "64-hex-device-token",
      "name": "Alex"
    }
  }
}
```

Resolution rules:

1. Parse and validate the explicit URL room code.
2. If private seat and invite parameters are both present, force join.
3. Otherwise load only the credential keyed by that room code.
4. If there is no explicit room code, show the online landing/setup state.
5. Never let a stored identity change the selected room.

Legacy migration is safe only when the legacy identity's room exactly matches a
public URL intent. It must never override a different URL or a private invite.

## HTTP lifecycle

Recommended endpoints:

```text
POST /api/rooms
POST /api/rooms/:code/join
POST /api/rooms/:code/resume
GET  /api/rooms/:code/socket?token=...
```

Creation generates a high-entropy, non-ambiguous code at the routing Worker,
then addresses the Durable Object by that exact code. A code collision returns
conflict rather than overwriting a room. The routing Worker may generate a new
code and retry a bounded number of times.

Join exchanges a public/open or private seat claim for a random device token.
Store only its hash in the Durable Object.

Resume accepts the device token in a POST body and returns:

- `200`: the device exists in the room;
- `401`: the room exists but the device token is invalid;
- `404`: the room does not exist.

Perform resume before opening the WebSocket. A failed resume is terminal for
that stored credential, not a transient reconnect condition.

When forwarding a request into a Durable Object, read the body once:

```ts
const body = request.method === "GET" || request.method === "HEAD"
  ? undefined
  : await request.arrayBuffer();

return stub.fetch(new Request(targetUrl, {
  method: request.method,
  headers: request.headers,
  ...(body?.byteLength ? { body } : {}),
}));
```

## WebSocket protocol

Version client and server envelopes independently from stored room schema:

```ts
type GameActionMessage = {
  v: 1;
  type: "game.action";
  actionId: string;
  expectedRevision: number;
  action: OnlineAction;
};

type ActionResult = {
  v: 1;
  type: "action.result";
  actionId: string;
  accepted: boolean;
  reason?: string;
  snapshot: RoomSnapshot;
};
```

Use `welcome` for authenticated connection identity plus the initial snapshot.
Use `snapshot` for accepted state broadcast, `presence` for transient socket
state, and separate bounded messages for activity and chat.

Reserve an uncorrelated `rejected` message for malformed or unauthorized
non-action traffic. A valid `game.action` should always receive its correlated
`action.result`.

Every snapshot needs a monotonically increasing revision. An accepted duplicate
may return the existing revision. Presence-only changes need not advance the
game revision if presence is explicitly non-authoritative.

## Serialized action algorithm

Use a promise gate, `blockConcurrencyWhile`-compatible design, or another
well-tested mutex. The essential property is that the read and write occur in
the same serialized section:

```ts
await serial(async () => {
  const room = await loadRoom();                 // read inside gate
  const device = authorize(room, attachment);    // auth inside gate

  if (room.recentActionIds.includes(msg.actionId)) { // before revision check
    sendResult(socket, accepted(room, msg.actionId));
    return;
  }

  if (msg.expectedRevision !== room.revision) {
    sendResult(socket, rejected(room, msg.actionId, "State changed"));
    return;
  }

  const result = applyDeterministicAction(room, device, msg.action);
  if (!result.accepted) {
    sendResult(socket, rejected(room, msg.actionId, result.reason));
    return;
  }

  await storeRoom(result.room);                  // persist first
  sendResult(socket, accepted(result.room, msg.actionId));
  broadcastSnapshot(result.room, result.activity);
  await advanceBotsOrScheduleAlarm(result.room);
});
```

Do not load `room` before entering the gate. Two WebSocket handlers can both
read revision 10, await, and otherwise both write revision 11.

Keep a bounded recent-action window in authoritative storage. Use an action ID
that is unique per logical user intent. If the client retries after uncertainty,
reuse the same action ID.

## Client state machine

Connection:

```text
idle -> connecting -> live
                  \-> reconnecting -> live
                  \-> join screen on resume 401/404
```

Action:

```text
ready -> pending(actionId) -> accepted(snapshot) -> ready
                           \-> rejected(snapshot, reason) -> ready
                           \-> timeout -> reconnect and reconcile
```

Rules:

- Permit one pending game action.
- Keep its action ID outside render timing, such as in a stable ref.
- Disable mutation controls while pending.
- Accept a snapshot only when `incoming.revision >= current.revision`.
- Match action results by action ID.
- Preserve a rejected local draft.
- Clear an accepted draft only after the result arrives.
- Use a synchronous draft reference when rapid keyboard/click transforms can
  occur before React renders; commit from the reference, not a stale closure.

## Durable Object lifecycle

Store a versioned room document and normalize on read. Include:

- room code and display name;
- revision and player/map/rules/theme configuration;
- seats with modes and controlling device IDs;
- devices with token hashes, host flag, and owned seat IDs;
- canonical game reducer state;
- bounded recent action IDs.

After normalization, validate cross-field invariants: exactly one host, seats
match the selected map and player order, each seat has at most one owner,
device-to-seat and seat-to-device links agree, and local/invite/bot fields match
their modes. Persist successful migrations idempotently.

Use WebSocket hibernation attachments for stable identifiers and rate-limit
counters, not canonical room state. Tag sockets by device and seat to support
presence and targeted closure after a host releases a seat.

One device may own several local/pass-and-play seats. Resolve the acting seat
from the current active player and current device ownership. Treat a client
supplied actor seat ID as a request that still requires server authorization.
Joining is lobby-only; starting is host-only and requires every non-bot seat to
be assigned. A seat claim is atomic and single-winner. Reconfigure a claimed
remote seat only through an explicit release transition that removes its device
and closes tagged sockets.

Route deterministic bot turns through the same state transition code and
serialization gate. Use an alarm for follow-on bot work if it should outlive the
current event or avoid a long recursive event.

## Security and privacy

- Use at least 128 bits of randomness for device and invite tokens.
- Hash tokens at rest.
- Compare equal-length hashes without early exit.
- Keep invitation secrets out of canonical URLs, activity, logs, analytics, and
  screenshots.
- Validate room codes, IDs, revisions, actions, transforms, text lengths, and
  message sizes at the protocol boundary.
- Parse explicit allowlists for every client and server message shape; do not
  return a protocol cast for an otherwise unknown `type`.
- Re-authorize every message from the WebSocket attachment against current room
  state; a host may have released that device since connection.
- Treat client scores, legal-move claims, active-player claims, timers, and bot
  outputs as untrusted proposals.
- Rate-limit chat and nonessential activity separately from game actions.
