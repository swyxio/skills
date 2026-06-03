# L0 — Skeleton (it responds)

**Goal:** a deployed HTTP service that Slack accepts, verifies requests, completes
the URL-verification handshake, and returns `200` fast. No intelligence yet.

## Checklist

- [ ] `GET /health` — verifies deploy + dependency reachability (lightweight counts, **no secrets**).
- [ ] `POST /events` — Slack Events API endpoint.
- [ ] Signature verification on every Slack-facing route, **from the raw body**.
- [ ] `url_verification` handshake handled.
- [ ] Returns within Slack's ~3s window.

## Routes

Build the bot as a small HTTP service. The full route set you'll grow into:

| Route | Purpose |
|---|---|
| `GET /health` | Deploy + dependency check. |
| `POST /events` | URL verification + `event_callback`. |
| `POST /interactions` | Block Kit actions, menus, modals (arrives at L3). |
| `POST /callbacks/...` | Internal signed callbacks from workers/agents (arrives at L5). |

## Verify Slack signatures

Slack signs the **exact raw body**. Do not parse or mutate it before verifying.

- Read `X-Slack-Signature` and `X-Slack-Request-Timestamp`; reject if missing.
- Reject timestamps outside a **5-minute replay window**.
- Compute `v0:${timestamp}:${rawBody}` with HMAC-SHA256 + the signing secret.
- Compare **timing-safe**.

```ts
export async function verifySlackSignature(req: Request, rawBody: string, secret: string): Promise<boolean> {
  const sig = req.headers.get("x-slack-signature") ?? "";
  const ts = req.headers.get("x-slack-request-timestamp") ?? "";
  if (!sig.startsWith("v0=") || !ts) return false;
  const age = Math.abs(Date.now() / 1000 - Number(ts));
  if (!Number.isFinite(age) || age > 300) return false;
  const expected = `v0=${await hmacSha256Hex(secret, `v0:${ts}:${rawBody}`)}`;
  return timingSafeEqual(expected, sig);
}
```

Interaction payloads (L3) arrive as form data with a `payload=` field, but the
signature still covers the **original raw form body** — verify the same way.

## Handshake + skeleton handler

```ts
app.post("/events", async (c) => {
  const traceId = crypto.randomUUID();
  const body = await c.req.text();                 // raw, once
  if (!(await verifySlackSignature(c.req, body, c.env.SLACK_SIGNING_SECRET))) {
    return c.json({ error: "invalid signature" }, 401);
  }
  let payload: any;
  try { payload = JSON.parse(body); }
  catch { log.warn("bad_json", { traceId }); return c.json({ error: "bad request" }, 400); }
  if (payload.type === "url_verification") return c.json({ challenge: payload.challenge });
  // ...L1 adds dedupe + background work here...
  return c.json({ ok: true });
});
```

## Anti-patterns

- ❌ Skipping verification "because it's internal".
- ❌ Re-serializing / pretty-printing the body before HMAC (signature won't match).
- ❌ Reading the body twice (consume once as text, then `JSON.parse` a copy).
- ❌ Returning the challenge without verifying the signature.
- ❌ Putting secrets or tokens in `/health` output.

## Graduate when…

A signed event reaches your handler, an invalid signature is rejected `401`, a
stale timestamp is rejected, and `url_verification` succeeds in the Slack UI.
