# Observability / tracing — operational deep-dive

Companion to SKILL.md for **tracing a draft→apply copilot** and **capturing human feedback**, with an LLM-observability backend (Arize AX / Phoenix via OpenInference + OTLP). Written from wiring aiebot's Arize integration on Cloudflare Pages Functions. The audit/change log (SKILL.md + [audit-log.md](audit-log.md)) is your *immutable record of canonical-state changes*; **tracing is a separate, lossy, observability stream** of what the model/agent did per turn. Don't conflate them.

## The hierarchy you must emit: session → trace → spans

| Level | Is | Grouping key | Copilot mapping |
|-------|-----|--------------|-----------------|
| **Session** | A whole conversation | `session.id` (span attribute) | Your conversation key (web session, Slack thread, email thread) |
| **Trace** | One turn (one user msg → one answer) | `trace_id` | One `runCopilotQuery` invocation |
| **Span** | One step inside a turn | `parent_id` chain | LLM call, tool/lookup, validate, persist |

A **root span** has no parent; a **child** points at a parent's span id; an **orphan** points at a parent that never arrived. The backend builds the visual tree purely from `parent_id`, so a missing parent breaks the whole turn's view.

## Lesson 1 — "we only record single turns" usually means **no `session.id`**

The most common confusion: each turn correctly shows up as its own trace, but they never group into a conversation, so it *looks* like the tool only captures single turns. That's right and expected at the trace level — **one turn = one trace is the correct model.** What's missing is the **`session.id` attribute** that links them.

- You almost certainly **already have the key** — it's the same conversation/session key your copilot uses for follow-up continuity (SKILL.md *Session / follow-up context*). Reuse it; don't invent a new one.
- Emit **`session.id`** (and **`user.id`**) on the spans. With manually-created spans you set the attributes yourself (`SemanticConventions.SESSION_ID === 'session.id'`, `USER_ID === 'user.id'`). With auto-instrumentors, use the context manager (`using_session` / `setSession`).
- **Put session/user on EVERY span, not just the root** — the Sessions view groups by `session.id` and span-level filters/search rely on it being present wherever you land. Centralize it: have the trace object inject identity attributes into the root span *and* each `addSpan`/`childSpan` so a caller can't forget.
- The session id **must be a non-empty string** or it's dropped from the Sessions tab.

After this, the backend's **Sessions** tab shows one row per conversation (duration, turn count, total tokens) and you can replay a full multi-turn interaction to see where it went off the rails.

## Lesson 2 — orphan spans ("spans without root spans detected") on serverless

Symptom: a global warning that child spans arrived with no root, so the trace view can't render them. Some traces look complete, others are orphaned — **it's timing-dependent**, which is the tell.

**Root cause (the one that bit us):** the `BatchSpanProcessor` flushes **ended child spans on its scheduled timer** (e.g. every 5s) while the **root span is still open**. Long agent loops make this routine (our P99 turn was ~150s). Those early exports contain children whose parent hasn't shipped yet → transient orphans that become **permanent** if the final root-span export is then lost. On serverless it gets lost because:

1. The root span is ended **last** (at flush), and
2. the final `forceFlush` had a **tight timeout** (e.g. 1.5s) against a sometimes-slow OTLP endpoint, and
3. `shutdown()` was **fire-and-forget**, and
4. **the platform freezes the isolate once the handler returns** (no `waitUntil`), killing the in-flight export.

Net: children land, root never does → orphans forever.

**Fixes (do all):**

- **`await` the full drain** — `forceFlush` *and* `shutdown` — before the handler returns; never fire-and-forget shutdown. Awaiting a few seconds on a multi-minute turn is negligible.
- **Generous export/flush timeouts** (~10s, not 1.5s). The OTLP collector can be slow under load; a tight cap abandons the request that carries the root span.
- **Register the drain on `ctx.waitUntil`** as a safety net so the export survives even if the response already returned (Cloudflare/Lambda kill un-awaited async work otherwise). Plumb `waitUntil` from the request context down to the tracer.
- Prefer **OTLP/HTTP over gRPC** at the edge (HTTP/2 proxy issues cause the same orphan symptom).
- Emitting `session.id`/`user.id` on **all** spans (Lesson 1) also helps the backend group/stitch.

**Don't over-rotate on the wrong fix.** Increasing the batch `scheduledDelay` so children don't ship before the root only helps short turns; with multi-minute turns you *want* incremental export (crash safety). The durable fix is making the **root span's final export reliable**, not suppressing child exports.

## Lesson 3 — human thumbs up/down feedback (capture bad answers to tune)

Goal: a 👍/👎 (+ optional note) on each answer so genuinely bad results are captured with their reason for later prompt tuning.

**Make your own store the source of truth; treat the vendor push as best-effort.**

- Persist every rating in your own DB (table keyed by the turn). This is what you actually query (`WHERE rating='down'`) to find and fix bad answers — independent of the vendor, plan tier, or API availability.
- Best-effort forward to the observability backend as a HUMAN annotation on the span. If that fails (see Lesson 4), the DB row still exists.

**Resolve the span id SERVER-SIDE — never trust a client-supplied span id.** Annotations attach to a **span**, and you can't annotate an already-exported span without its id. So:

1. At generation time, **persist the root span id + trace id + trace start time** alongside the turn (we put them in the proposal-set metadata: `traceId`, `arizeRootSpanId`, `arizeTraceStartMs`).
2. Return a stable turn key to the client (we return `proposalSetId` + `traceId` in the chat result).
3. The feedback endpoint takes the **turn key**, looks up the span id from your store, and annotates that — so a client can only rate its own real turns, never inject an arbitrary span id.

**Idempotent ratings:** key the row on `(turn, actor)` and upsert, so re-clicking 👎 or adding a note overwrites rather than duplicates.

**UX:** 👍 sends immediately; 👎 opens an optional "what went wrong?" note before sending (that note is the gold you tune on). Feedback writes are best-effort — never block or error the chat on them; `waitUntil` the persist.

## Lesson 4 — Arize AX vs Phoenix: the annotation APIs differ, and AX mutations are gated

Easy to follow the wrong doc. They are different products with different feedback ingest:

| | Phoenix (`app.phoenix.arize.com` / self-host) | Arize AX (`app.arize.com`) |
|---|---|---|
| Transport | REST `POST /v1/span_annotations` | GraphQL `https://app.arize.com/graphql`, mutation `updateAnnotations` |
| Auth | `api_key` header | **`x-api-key: <developer key>`** (a *Developer* key — **NOT** the OTLP ingestion key) |
| Target | `span_id` (hex) | `recordId` = span id (hex); also needs `modelId` (base64 relay id of the project, from the URL) |
| Shape | `{name, annotator_kind, result:{label,score,explanation}}` | `{name, annotationType:'label'|'score', label|score, note, modelEnvironment:'tracing', startTime}` |
| Gotcha | — | **Mutations are enterprise-gated** — on a Free/non-enterprise plan the mutation returns an error |

Implications baked into the design:
- The OTLP **ingestion** key (sent as `api_key`/`space_id` headers to the OTLP endpoint) is **not** the GraphQL **developer** key. You need both, configured separately. Without the developer key + model id, skip the push (don't crash) — the DB row is enough.
- `annotationType` is `label` **or** `score`, **not both** (AX); we send `label: 'thumbs-up' | 'thumbs-down'`.
- `startTime` must be **≤24h before** the record's start (it's a search-window filter) — pass the persisted trace start, minus a small margin.
- Because AX mutations are enterprise-gated, **expect `failed`/`skipped` on free plans** and rely on your DB. Record the push outcome (`sent`/`skipped`/`failed` + reason) next to the rating so you know whether it actually reached the vendor.

> **OTLP attributes are not annotations.** You can't smuggle a post-hoc annotation in by setting span attributes — annotations are a distinct ingest path. And you can't "re-open" an exported span. That's exactly why you persist the span id at generation time.

## Lesson 5 — Agent Graph / Path views need OpenInference span kinds

The backend's **Agent Graph / Agent Path** views are derived from spans tagged with OpenInference span kinds. If your tool/lookup/validate spans are plain `INTERNAL` with no `openinference.span.kind`, the agent graph is empty or sparse even though traces look fine.

- Tag the root with `CHAIN` (or `AGENT`), LLM calls with `LLM`, tool/lookup steps with `TOOL`, retrieval with `RETRIEVER`.
- Also set `input.value` / `output.value` per span — without them the backend "shows nothing" for a span even though attributes exist.

## Privacy / cost habits (carry over from any LLM tracing)

- **Redact secrets in span text** (bearer tokens, API keys, base64 data URLs) before export; gate full prompt/response capture behind a `TRACE_CONTENT` switch (`full` vs `redacted` hash+length) so you can turn off content capture without losing structure.
- **Estimate $ cost per LLM span** from token usage + a per-model price table; normalize provider usage shapes (OpenAI `prompt_tokens`/`completion_tokens` vs Gemini `promptTokenCount`/`candidatesTokenCount`).
- **Truncate huge attributes** (full docs, images) — large spans hit collector size limits and get dropped (another orphan source).

## Smells

- Each turn is its own trace but the Sessions tab is empty → you never set `session.id`.
- `session.id` only on the root span → span-level filters and some session grouping miss turns.
- Tracer flushes with a tight timeout + fire-and-forget `shutdown()` on serverless → root span dropped → "spans without root spans".
- Relying on `waitUntil`-less background export after the response → isolate freeze kills the export.
- Storing feedback only in the vendor (no own DB) → can't query bad answers when the vendor push is gated/unavailable; nothing to tune on.
- Trusting a client-supplied span id for annotation → spoofable; resolve it server-side from the persisted turn metadata.
- Using the OTLP ingestion key for the GraphQL annotations API (or vice-versa) → 401/403.
- Following Phoenix `/v1/span_annotations` docs while actually on Arize AX (or vice-versa) → wrong endpoint/auth.
- Tool/lookup spans untagged (`INTERNAL`) → empty Agent Graph.

## Checklist

```
[ ] Reuse the conversation/session key as session.id; emit session.id + user.id on EVERY span (non-empty)
[ ] Sessions tab groups multi-turn conversations after deploy
[ ] Final span export is reliable: await forceFlush AND shutdown (no fire-and-forget), generous (~10s) timeouts, ctx.waitUntil drain
[ ] Long agent loops verified — no permanent orphan spans
[ ] Persist root span id + trace id + trace start at generation time; return a turn key to the client
[ ] Feedback table (own DB) is source of truth; keyed (turn, actor) idempotent upsert; record vendor push outcome
[ ] Feedback endpoint resolves span id SERVER-SIDE from the turn key (never trust client span id)
[ ] Right annotation API for your backend (Phoenix REST vs Arize AX GraphQL); developer key ≠ OTLP key
[ ] Push is best-effort: missing key/model id → skip; enterprise-gated → fails gracefully, DB still has it
[ ] Span kinds set (CHAIN/LLM/TOOL/RETRIEVER) + input/output values for Agent Graph
[ ] Secret redaction + content on/off switch; per-span token + cost; large attrs truncated
```

Reference (from `swyxio/aiewf2026-internal-schedule` aiebot): `functions/_lib/arize-tracing.ts` (`createAiebotTrace`, `OtlpTrace` identity injection + `drainAndShutdown` + `EXPORT_TIMEOUT_MS`, `sendArizeAnnotation` GraphQL push), `functions/_lib/aiebot.ts` (session/user/`waitUntil` into the trace; persists `traceId`/`arizeRootSpanId`/`arizeTraceStartMs` in proposal-set metadata; returns `traceId`), `functions/api/ai/feedback.ts` (server-side span-id resolution), `functions/_lib/aiebot-store.ts` (`recordAiebotFeedback`, `aiebot_feedback` table — migration `0041`), `src/frontend/components/AiebotPanel.tsx` (`FeedbackControl`).
