---
name: public-qa-chatbot
description: Build or review an unauthenticated public Q&A chatbot backed by a bounded FAQ or documentation corpus. Use when anonymous users can spend server-side model or retrieval resources; do not trigger for an authenticated assistant, a generic chat UI, or a private internal copilot.
license: MIT
metadata:
  author: aidotengineer
  version: "1.1"
  last-updated: "2026-08-11"
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

## Optional widget UX recommendations (deliberate product guidance)

These patterns are intentionally retained as a design shortcut. Apply only the
ones that fit the public widget; the security and retrieval contract above does
not require a draggable window, tool shelf, hover treatment, or theme system.

### Markdown rendering

Render a small, sanitized Markdown subset so answers can use emphasis, links,
and readable lists. Tell the model to keep formatting light:

```text
You may use markdown formatting when appropriate:
- use **bold** sparingly for important facts;
- use [links](https://example.com) for cited public resources;
- use bullets for short lists;
- keep formatting compact and readable.
```

Common renderers are `react-markdown` with `remark-gfm`,
`vue-markdown-render`, or `marked`/`markdown-it`. Configure URL handling and
HTML sanitization deliberately; do not render arbitrary model-supplied HTML or
unsafe URL schemes.

### Draggable and resizable window

For desktop widgets that users may keep open beside page content, allow the
window to move and resize. Persist geometry to `localStorage`, version the
stored shape, and clamp it to the current viewport so a window saved on a large
display cannot reopen off-screen on a smaller one:

```ts
const width = Math.min(saved.width, window.innerWidth);
const height = Math.min(saved.height, window.innerHeight);
const x = Math.max(0, Math.min(pointerX - dragOffset.x, window.innerWidth - width));
const y = Math.max(0, Math.min(pointerY - dragOffset.y, window.innerHeight - height));
```

- Give the widget sensible minimum and maximum dimensions.
- Keep drag and resize handles keyboard/touch accessible or disable the feature
  on layouts where those interactions are unreliable.
- Re-clamp on viewport resize and orientation change.
- Do not begin a drag from interactive header controls.
- Provide a reset-position action when geometry becomes inconvenient.

### Bottom command shelf

The bottom of an AI interface is useful thumb-reachable space for controls used
while forming a prompt: attach, tools, model, voice, send, mode, effort, runtime
context, or tool launchers. Use a progressive command shelf only when the
product actually exposes enough controls to justify it:

- Keep the default composer compact: input, add/attach, tools, model, mic, and
  send as applicable.
- Put secondary controls in an expandable bottom sheet instead of crowding the
  default composer; keep send one tap away in both states.
- Represent mode and execution state as compact chips, such as plan/build,
  effort, project/branch, or usage budget.
- Keep tool launchers near the prompt when they are commonly used mid-turn.
- Provide an obvious collapse control and preserve vertical space for reading.
- Reserve layout space for the compact composer; expanding the shelf should
  overlay upward without resizing, jumping, or re-anchoring the transcript.
- Test software-keyboard open/close, safe-area insets, shelf expansion,
  streaming, and history reading together.

A constrained public FAQ with no tools or settings usually needs only a compact
composer and suggested-question chips; do not import an agent-console command
plane into a simple support widget.

### Hover previews

On pointer-capable devices, the closed launcher may preview a few high-value FAQ
questions or example prompts. This reduces “what can I ask?” friction before a
user opens the chat. Keep previews brief, dismissible, non-blocking, and
available through an equivalent focus/tap interaction; do not make essential
content hover-only.

### Theme-aware and adaptive styling

Accept the host page's theme state or CSS custom properties and derive the
widget from one semantic palette rather than scattering literal colors. Define
tokens for background, text, muted text, borders, surfaces, buttons, focus,
errors, links, shadows, and code blocks.

An embedded widget can contrast with its host—a light panel on a dark page or a
dark panel on a light page—when that improves discoverability, but contrast is
a product choice rather than a universal inversion rule. Verify text, focus,
link, disabled, hover, and streaming states in both themes and respect reduced
motion and high-contrast preferences.

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
