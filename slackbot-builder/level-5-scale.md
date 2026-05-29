# L5 — Multi-surface / scale (polished platform)

**Goal:** the bot is one surface of a product, not a standalone script. The same
core powers web + Slack + cron + future bots; it runs across many workspaces and
handles load gracefully.

Reach for L5 only when the product need is real. Most bots are great at L4.

## Checklist

- [ ] **One channel-agnostic core** serves every surface; Slack/web/cron are thin adapters.
- [ ] **Multi-workspace / tenancy** — per-workspace tokens, isolation, install lifecycle.
- [ ] **Queues + backpressure** for heavy/bursty work; no unbounded fan-out.
- [ ] **Target/config caching** with short TTLs and stale-delete-on-failure.
- [ ] **Usage analytics store** (PostHog-free option: your own table).
- [ ] **Break-glass / degraded config** that's actually implemented.

## One core, many surfaces

The single rule from the index, fully realized: planning, validation, persistence,
audit, dry-run, sessions, and observability live in **one** entrypoint
(`runBotQuery(input, { emit })`). Each surface only adapts I/O:

```
core: runBotQuery(input, { emit })   ← plan, validate, persist, audit, log
  ▲              ▲              ▲
web /api      slack /events    cron / scheduled
```

`emit` is the seam: web streams it over SSE, Slack maps it to `setStatus`, cron
ignores it. Adding a surface = a new adapter, never new business logic.

## Multi-workspace / tenancy

- Store per-workspace bot tokens + signing context keyed by `team_id`; never share one token.
- Isolate state by tenant in keys (`team:${teamId}:thread:${channel}:${ts}`).
- Handle install / uninstall / token-revocation lifecycle (`app_uninstalled`, `tokens_revoked`).
- Re-check authorization per workspace for sensitive actions — IDs are not auth.

## Queues + backpressure

Background heavy work through a real queue/durable workflow, not detached promises.
Cap concurrency, dead-letter failures, and make completion callbacks idempotent.
Bursty mentions (a noisy channel, a retry storm) must not melt the backend.

## Caching dynamic config

Cache target lists / config with a 1–5 min TTL; on a stale-mapping failure, delete
and refetch. Don't hammer the control plane on every event.

| Data | Key | TTL |
|---|---|---|
| Dynamic target cache | `targets:cache` (or per-tenant) | 1–5 minutes |
| Workspace tokens | `team:${teamId}:auth` | until revoked |

## Usage analytics

Log one row per run to your own store (surface, provider/model, turns, tool calls,
proposals, drops, latency, outcome) — queryable usage/latency/failure analytics
without a third-party dependency. All writes best-effort so analytics never break a
reply.

## Break-glass / degraded config

If you advertise outage fallback, build it: cached config, static break-glass
config, or a clear degraded response. An empty fallback list is fine in early dev,
not in production.

## Anti-patterns

- ❌ Forking business logic per surface instead of sharing one core.
- ❌ A single global bot token across workspaces.
- ❌ Unbounded background fan-out (no queue, no concurrency cap).
- ❌ Refetching dynamic config on every event.
- ❌ Tenant data bleeding across workspaces via unscoped keys.
- ❌ Advertising graceful degradation you never implemented.

## Graduate when…

A new surface ships by writing only an adapter; the bot runs in multiple
workspaces with isolated state and tokens; heavy work flows through a bounded
queue; and you can answer "how is the bot being used?" from your own analytics.
