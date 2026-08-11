---
name: public-qa-chatbot
description: Build or review an unauthenticated public Q&A chatbot backed by a bounded FAQ or documentation corpus. Use when anonymous users can spend server-side model or retrieval resources; do not trigger for an authenticated assistant, a generic chat UI, or a private internal copilot.
license: MIT
metadata:
  author: aidotengineer
  version: "1.1"
  category: "chatbot"
  compatibility: Any web framework with a server-side API route
---

# Public Q&A chatbot

Treat an anonymous chatbot as a public resource-exhaustion and data-exposure
surface. Keep the knowledge scope bounded, make the server authoritative, and
add infrastructure only when it answers a demonstrated risk.

## Required server boundaries

- Count turns and enforce message count, message length, output, request, and
  timeout limits on the server. Never trust client-supplied counters or flags.
- Use a distributed rate limiter in production when the deployment can scale
  beyond one process; an in-memory limiter is a local-development fallback, not
  a shared production control. Choose limits from expected traffic and cost,
  not copied example numbers.
- Validate the request origin/tenant/page against an exact allowlist where the
  widget is intended to be embedded. Parse URLs and compare hostnames rather
  than relying on substring matches.
- Keep provider keys server-side. Return generic errors and redact provider
  payloads, prompts, IPs, and user content from logs unless the reviewed
  observability policy permits a safer representation.
- Restrict model modalities and tools to what the product needs. A text-only
  FAQ assistant should not expose arbitrary code execution, network access, or
  file writes.
- Apply visibility and tenant filters before semantic search, keyword search,
  or virtual-filesystem listing. Do not hide private documents only in the UI.

## Request path

1. Validate origin, page/tenant, content type, body size, message shape, and
   the server-derived turn count.
2. Apply rate/cost limits before retrieval or model calls.
3. Retrieve only from the approved corpus. A short FAQ can use direct context;
   larger docs may use semantic search followed by exact read/search tools.
4. Use a model and output budget sufficient for the task, and stream through one
   response protocol on both cache-hit and live paths.
5. Return a bounded answer with citations or source paths when the corpus
   supports them. Say when the answer is unknown; never fill gaps with guessed
   event, pricing, policy, or account data.

## Optional retrieval and cost controls

These are recommendations, not universal requirements:

- A semantic cache can reduce repeated FAQ calls, but scope entries by tenant,
  corpus version, and model/prompt version; enforce TTL and use a conservative
  similarity threshold. Never serve a cached private answer to another user.
- A read-only virtual documentation filesystem (`ls`/`cat`/exact search) is
  useful for large, hierarchical docs where top-k retrieval misses exact
  syntax. Keep the path tree access-pruned, page reads ordered, and tools
  narrow; a normal FAQ does not need it. See
  [MINTLIFY_VIRTUAL_FILESYSTEM.md](MINTLIFY_VIRTUAL_FILESYSTEM.md) when this
  pattern is actually needed.
- A browsable FAQ list can answer common questions without an LLM call.
- Add tracing for latency, tokens, cost, cache outcomes, retrieval outcomes,
  and errors when those signals answer an operational question. Hash or omit
  personal content and keep audit access separate from debugging telemetry.
- Virtualize chat only for long, dynamically sized histories. For every chat,
  use stable message IDs, keep chronological data, preserve the user's anchor
  when older history is prepended, and follow new output only when the user is
  already near the latest message.

## Graceful degradation

Optional rate, cache, tracing, and retrieval services need explicit fallbacks:
fail closed for authorization and tenant visibility; for non-security services,
skip the optimization or return a bounded error rather than exposing a key or
silently widening access. Keep a provider timeout and terminal error path so a
stream cannot leave the UI in a permanent loading state.

## Focused checks

- Unauthenticated requests cannot bypass origin, tenant, input, or rate
  limits.
- Private/unpublished corpus entries are absent from every retrieval surface.
- Client-provided turn counts, model names, page identifiers, and tool inputs
  are rejected or normalized against an allowlist.
- Cache hits use the same response protocol and cannot cross scope/version.
- API keys and sensitive provider errors stay server-side.
- A long history preserves scroll position while streaming and prepending.
- Provider timeout, rate-limit exhaustion, and optional-service failure produce
  a bounded, user-visible result.

Retrieve current provider/model identifiers and SDK behavior before deployment;
do not preserve the example provider catalog or historical price table in this
always-loaded skill.
