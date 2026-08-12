---
name: agents-sdk
description: Build or debug Cloudflare Agents SDK code for stateful agents, Agent routing, callable RPC, scheduling, durable workflows, chat/streaming, MCP, webhooks, or client hooks. Use when the Agents SDK API or its Durable Object lifecycle is part of the task; do not trigger for generic Workers, generic LLM code, or ordinary WebSocket work.
---

# Cloudflare Agents SDK

Use current [Agents SDK documentation](https://developers.cloudflare.com/agents/)
and the installed package types/examples before relying on API names, package
versions, compatibility flags, or experimental features. Load only the
reference for the feature being changed.

## Start with the runtime contract

1. Identify the agent class, instance identity, request route, client, and
   Durable Object binding that own the operation.
2. Inspect the installed `agents` and related package versions plus the
   Wrangler configuration. Do not infer bindings or lifecycle declarations from
   a generic example.
3. Separate synchronous state validation from asynchronous side effects. Use
   the smallest feature family that satisfies the task: Agent state/RPC,
   scheduling, `queue()`, Workflows, chat streaming, or an integration.
4. Test the affected route or client path, including reconnect or mixed-version
   behavior when a stateful or streaming contract changed.

## Configuration and state boundaries

- Each agent class needs the matching Durable Object binding and lifecycle
  declaration. Never edit an applied migration; add a new migration according
  to the current Cloudflare guide.
- Treat instance names and routes as part of the application authorization
  boundary. Validate who may address an instance before exposing callable
  methods or state updates.
- Use `validateStateChange` for synchronous invariants before persistence. Keep
  non-gating notifications or cleanup in the appropriate asynchronous hook.
- Use `ctx.waitUntil()` or the SDK's durable execution/Workflow facilities for
  work that must outlive the request or an object eviction. Make retries
  bounded and idempotent.

## High-risk integrations

- For chat streaming, preserve the request abort signal and completion callback
  required by the current chat API so disconnects and message persistence are
  handled correctly.
- For external webhooks, authenticate the raw payload before parsing it,
  acknowledge quickly, and deduplicate event IDs before asynchronous work.
- For MCP, browser, voice, push, and other experimental or optional features,
  load the matching reference below and verify current support before adding
  the dependency or compatibility flag.
- Keep secrets in platform secret storage. Do not log tokens, raw private
  payloads, or unredacted provider errors.

## Minimal shape

```ts
import { Agent, routeAgentRequest } from "agents";

type State = { count: number };

export class Counter extends Agent<Env, State> {
  initialState = { count: 0 };

  validateStateChange(next: State) {
    if (next.count < 0) throw new Error("invalid count");
  }
}

export default {
  fetch: (request: Request, env: Env) =>
    routeAgentRequest(request, env) ?? new Response("Not found", { status: 404 }),
};
```

Treat this as a shape, not a current API contract. Confirm the exact imports,
generic parameters, decorators, and Wrangler fields against installed types and
the current docs.

## Selective references

- [configuration.md](references/configuration.md), [routing.md](references/routing.md),
  and [state-scheduling.md](references/state-scheduling.md) for the core Agent
  lifecycle, bindings, routes, state, SQL, and schedules;
- [callable.md](references/callable.md), [client-sdk.md](references/client-sdk.md),
  [streaming-chat.md](references/streaming-chat.md), and
  [server-driven-messages.md](references/server-driven-messages.md) for RPC,
  React clients, chat, and proactive turns;
- [workflows.md](references/workflows.md), [durable-execution.md](references/durable-execution.md),
  and [queue-retries.md](references/queue-retries.md) for long-running or
  retryable work;
- [mcp.md](references/mcp.md), [webhooks-push.md](references/webhooks-push.md),
  [email.md](references/email.md), and [observability.md](references/observability.md)
  for integrations; and
- [human-in-the-loop.md](references/human-in-the-loop.md), [voice.md](references/voice.md),
  [browse-the-web.md](references/browse-the-web.md), [codemode.md](references/codemode.md),
  and [think.md](references/think.md) only when that optional feature is named.
