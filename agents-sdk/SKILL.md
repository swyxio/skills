---
name: agents-sdk
description: Build or debug stateful applications that specifically use Cloudflare's `agents` package, including Agent classes, routing, callable methods, synchronized state, scheduling, AIChatAgent, durable execution, or Agents SDK client hooks. Do not trigger for generic AI-agent design, the OpenAI Agents SDK, or ordinary Durable Object work that does not use the Cloudflare Agents SDK.
---

# Cloudflare Agents SDK

Use current Cloudflare documentation and the installed `agents` package as the
contract. APIs in this SDK evolve quickly; do not trust remembered signatures or
examples without checking the relevant version.

## Inspect first

1. Read the project's package version, Wrangler configuration, Agent exports,
   routing entrypoint, and generated binding types.
2. Retrieve the current docs for the feature being changed.
3. Inspect installed exports and `.d.ts` files before adding casts or adapters.
4. Identify the Agent instance name and who is authorized to select it. Instance
   naming is a state-partition and access-control decision, not just a URL detail.

Agents require Durable Objects. Verify the exact class export, binding, and
lifecycle declaration used by the target environment. Do not copy a migration
or configuration example without checking the current lifecycle model.

## Preserve the runtime contract

- Treat persisted Agent state, connection state, scheduled work, and client UI
  state as separate surfaces.
- Validate client-originated state and callable methods at the server boundary;
  a callable method is not authorization by itself.
- Use stable operation identities for work that may be retried or resumed.
- Distinguish ordinary request work from SDK durable-execution primitives. Use
  the latter only when work must survive Durable Object eviction or restart.
- Expect the Agent constructor and in-memory state to be recreated. Persist
  anything required after eviction.
- Keep routing and client naming consistent. Test the actual route through
  `routeAgentRequest` or the project's custom router.
- Treat experimental integrations as version-specific. Pin and test the seam
  rather than spreading preview types through domain code.

## Load only the relevant reference

| Need | Reference |
| --- | --- |
| State, SQL, schedules, or alarms | [state-scheduling.md](references/state-scheduling.md) |
| Callable RPC, streaming, or timeouts | [callable.md](references/callable.md) |
| Routing, bindings, or project setup | [routing.md](references/routing.md), [configuration.md](references/configuration.md) |
| React/browser clients or chat streaming | [client-sdk.md](references/client-sdk.md), [streaming-chat.md](references/streaming-chat.md) |
| Server-driven turns or approval flows | [server-driven-messages.md](references/server-driven-messages.md), [human-in-the-loop.md](references/human-in-the-loop.md) |
| Workflows, fibers, queues, or retries | [workflows.md](references/workflows.md), [durable-execution.md](references/durable-execution.md), [queue-retries.md](references/queue-retries.md) |
| MCP, email, webhooks, push, or observability | [mcp.md](references/mcp.md), [email.md](references/email.md), [webhooks-push.md](references/webhooks-push.md), [observability.md](references/observability.md) |
| Preview features | [think.md](references/think.md), [voice.md](references/voice.md), [codemode.md](references/codemode.md), [browse-the-web.md](references/browse-the-web.md) |

Read current first-party docs before relying on limits, package names,
configuration fields, or experimental availability.

## Verify proportionally

Run the narrow type, route, and state tests for the changed seam. For connection
or recovery behavior, test disconnect/reconnect and a recreated Agent instance.
For scheduled or durable work, prove that duplicate delivery converges and that
the persisted result—not an in-memory flag—defines completion.
