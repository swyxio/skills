---
name: slackbot-builder
description: Build or harden a Slack app, bot, agent-in-Slack workflow, or Slack Events API/Block Kit integration. Load for signed ingress, event handling, interactive approvals, shared threads, durable work, or multi-surface Slack systems; not for generic chat or unrelated Cloudflare work.
license: MIT
metadata:
  author: swyx
  version: "2.4"
  category: "slack"
  compatibility: Slack Events API, Slack Web API, serverless or long-running workers
  tags: "slack, bot, events-api, block-kit, modals, file-uploads, durable-execution, security, tracing"
---

# Slackbot Builder

Treat Slack as a thin adapter over a channel-agnostic core. The Slack layer
authenticates requests, acknowledges them, calls the Slack Web API, renders
Block Kit, and delegates business logic to the shared core.

## Choose the smallest relevant surface

| Surface | Read |
|---|---|
| Basic Events API bot | [level-0-skeleton.md](level-0-skeleton.md), [level-1-mvp.md](level-1-mvp.md) |
| Shared conversational thread | [level-2-context.md](level-2-context.md) |
| Buttons, modals, approvals, files, or drafts | [level-3-interactive.md](level-3-interactive.md) |
| Agents & AI Apps streaming | [level-4-native-agent.md](level-4-native-agent.md) |
| Durable jobs, callbacks, rate limits, audit, or observability | [level-5-hardened.md](level-5-hardened.md) |
| Multiple surfaces, workspaces, tenants, or queues | [level-6-scale.md](level-6-scale.md) |
| Multi-turn mutations or owned resources | [stateful-agent-workflows.md](stateful-agent-workflows.md) |
| Image generation | [image-generation.md](image-generation.md) |
| Cloudflare durable ingress | [cloudflare-durable-ingress.md](cloudflare-durable-ingress.md) |

Do not load every level for a small task. Start at the requested level and read
the referenced lower-level contract only when the implementation depends on it.

## Invariants

- Verify Slack signatures against the raw request body before parsing, including
  URL verification and interactive payloads. Keep signing secrets and tokens out
  of source, logs, responses, and client code.
- Acknowledge events, commands, and interactions within Slack's deadline after
  authentication and idempotency checks. Move slow work to an execution model
  that can finish reliably; do not rely on an unobserved background promise.
- Deduplicate event IDs and serialize turns that can mutate the same thread or
  owned resource. Use a real shared store for sessions, idempotency, pending
  approvals, and preferences; in-memory state is development-only.
- Use workspace, channel, and thread identity deliberately. Build causal
  context from messages before the trigger, preserve relevant files/images, and
  ignore bot messages and unrelated subtypes before expensive work.
- Keep Slack rendering terse and accessible. Canonical long output and artifacts
  belong in a durable result/session surface. Use appropriate unfurl settings
  when publishing links or media.
- Require explicit human approval for external mutations. Show a bounded,
  reviewable draft; apply the same validated request that was reviewed; record
  actor, target, result, and failure. Never silently widen a batch.
- Treat reactions, typing/status updates, enrichment, and context fetches as
  best effort. They must not replace or abort the real answer. Log fallbacks,
  provider failures, retries, and terminal success/error with a trace ID.
- Apply rate limits, bounded retries, timeouts, cancellation, access checks, and
  safe error text at every entry surface, not only mentions.

## Implementation path

1. Identify entry points, target maturity, shared-core boundary, state stores,
   and external writes.
2. Read only the relevant references above and inspect existing project
   conventions before choosing a framework or storage layer.
3. Implement the smallest level bottom-up: signed ingress, fast ack, dedupe,
   thin adapter, then only the requested context, interaction, durability, or
   scale capability.
4. Test signature failures, replayed events, bot/subtype filtering, timeout and
   provider failures, concurrent thread turns, approval boundaries, and the
   terminal result/error path. Verify each Slack surface independently.

The references contain detailed code and platform-specific patterns. Keep this
file focused on the safety and architecture contracts that must hold at every
level.
