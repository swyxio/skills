# Image generation (optional capability)

**Read this only if your bot generates or edits images.** It's a cross-cutting
capability layered on top of the ladder — the mechanics live at the levels below,
this file is the image-specific glue and the gotchas that cost real iterations.

- **Upload mechanics, iterate buttons, settings modal** → [L3 § rich outputs](level-3-interactive.md#rich-outputs-filemedia-uploads--in-message-controls--a-settings-modal)
- **Tracing / per-modality cost** → [L5 § instrument every model call](level-5-hardened.md#instrument-every-model-call-not-just-the-text-one)
- **Sanitized errors, durable callbacks** → [L5](level-5-hardened.md)

## Lifecycle

```
mention/DM/button → fast handler (ack: 👀 + setStatus)
                  → trigger durable job  ──►  generate → upload → post (👀 → ✅)
                                              └ on failure: post ⚠️ + trace id (👀 → ⚠️)
```

The fast handler only **acks and triggers**. The slow generate→upload→post runs in
durable execution and owns the final reaction flip.

## A render is a long job, not a background promise

GPT Image generate+upload routinely takes **30–90s** — longer than serverless
request-scoped background primitives survive. Cloudflare Pages Functions'
`ctx.waitUntil()` is **cancelled ~30s after the response is sent**; the promise is
killed mid-flight. Symptom: the bot acks (👀 lands), then **nothing** — no image,
no error. Logs show `waitUntil() tasks ... have been cancelled` with `wallTime`
pinned near 30000ms.

Move the work into **durable execution** and let the Slack handler only *trigger* it:

- **Cloudflare Workflow** — built-in per-step retries, multi-minute timeouts, and
  persisted state; outlives the request that started it. Pages Functions can't host
  a Workflow/Durable Object class, so the Workflow lives in a companion **Worker**,
  invoked from Pages over a **service binding** guarded by a shared
  `INTERNAL_TRIGGER_SECRET`.
- Alternatives: a **Durable Object** `alarm()`, or a **queue** consumer. Any of
  them beats `waitUntil` for >20s work.
- Make each step **idempotent / self-contained** — re-read the thread + reference
  images from Slack inside the step so a retry re-renders rather than double-posts.
- **Make failure visible from inside the job.** On exhausted retries, post the
  sanitized ⚠️ + `trace_id` and flip 👀 → ⚠️ *there*, not in the trigger — otherwise
  an exhausted job looks identical to the original "walked away" bug.

## Gate provider params by model family

Image params are **not** uniform across model versions. `input_fidelity:high`
(keeps speaker headshots/logos intact on edits) is a `gpt-image-1.x` feature;
`gpt-image-2` rejects it outright (`does not support the 'input_fidelity'
parameter`). Send it conditionally:

```ts
function supportsInputFidelity(model: string): boolean {
  return model.startsWith('gpt-image-1');   // not gpt-image-2
}
// ...
if (supportsInputFidelity(model)) form.append('input_fidelity', 'high');
```

Same discipline for quality vocab (`gpt-image-2`: `standard|high`; `1.x`:
`low|medium|high|auto`), `size`, and `response_format` (GPT Image rejects it).
Centralize a per-model normalizer so one call site can't ship a wrong-model param.

## War story: two bugs, one masking the other

> A Slack image feature ran generate-and-post inside `waitUntil`. Renders >30s were
> silently cancelled → 👀 then silence. Moving it into a Workflow fixed the timeout
> **and immediately exposed a second bug the timeout had been hiding**: the edits
> call always sent `input_fidelity:high`, which `gpt-image-2` rejects. With no 30s
> guillotine, the request finally ran to completion and surfaced the *real* API
> error.
>
> **Lessons:** (1) gate provider params by model family, not globally; (2) **a
> timeout will mask the failure underneath it** — fixing latency often unmasks a
> correctness bug, so verify the happy path actually produces output, not merely
> that it stopped timing out; (3) instrument the image call like any model call so
> the provider error is greppable instead of a guess (L5).

## Stateless iteration

To "edit the last output" without a blob store: re-read the thread
(`conversations.replies`), re-download the prior image(s) as references, and
distinguish the bot's own outputs (`bot_id` set) from human-supplied references so
**Regenerate** replays the original sources instead of recursively editing its own
last frame. (Full upload/button/modal mechanics in [L3](level-3-interactive.md).)

## Route image mode once, then keep it sticky

Choose mode with one small pure function rather than inline conditionals spread
across signature verification, D1, and webhook code. A stable policy is:

```ts
function shouldRouteToImage(input: {
  explicitImage: boolean;
  noImage: boolean;
  inThread: boolean;
  threadHasImageActivity: boolean;
}): boolean {
  if (input.explicitImage) return true;
  if (input.noImage) return false;
  return input.inThread && input.threadHasImageActivity;
}
```

- Require explicit opt-in (`!image`, an image action, or equivalent) to start.
- A bare attachment alone must not **start** image mode. In an already-sticky
  image thread it is the current edit reference unless the user invokes the
  ordinary-work escape hatch.
- Persist image mode in existing per-thread state, then keep later mentions in
  that thread in image mode without repeating the flag.
- Provide an explicit one-message escape hatch (`!ask`) for ordinary bot work.
- Never let stickiness leak outside the thread.
- Put the opt-in/escape-hatch rules in help and every generated-image footer.
  Undiscoverable routing controls are broken controls.

Exhaustively unit-test the pure policy; separately test state lookup and handler
wiring. Keep docs in the same change whenever routing behavior changes.

## Select references from intent; do not vacuum and blend

Reference selection is a routing decision. Treat text as the authority for
*which* visual is the subject, not merely as a spelling hint after collecting a
pile of pixels.

Use this precedence:

1. A file attached to the triggering message, or an explicitly replied-to image,
   is authoritative.
2. An explicit "edit my last render" or plain refinement ("make it darker")
   may use the bot's newest output as the primary edit base.
3. A semantic correction/redirection ("no, use the subway design"; "that's the
   wrong logo"; "use the retro colorway instead") rejects the prior render. Drop
   bot-authored outputs and rebuild from human-shared references.
4. A request to make something new from shared designs uses human references,
   not the bot's prior renders.
5. If multiple human images remain, use thread text (or a bounded vision
   relevance pass) to rank/select the referenced design.
6. If intent does not resolve one candidate, use the newest human-shared image
   as the fallback primary. Do not give every image equal weight.

Keep correction detection conservative and require a human reference on the
triggering message or earlier in the thread to fall back to; otherwise preserve
normal refinement behavior. Detect the instruction's intent, not the mere
presence of an isolated negation keyword: "make it darker, but don't change the
logo" is a refinement, not a rejection of the render. Include both positive
corrections and negative-constraint refinements in tests. Separate **reference
selection** from **image generation** so selection can be tested without calling
the provider.

Log safe selection metadata on every render: routing mode, refinement versus
redirection, human-only versus mixed references, reference count, primary source
kind, and stable non-secret identifiers. This makes a wrong-base render
diagnosable without logging private file URLs or image bytes.

## Checklist

- [ ] Generation runs in **durable execution** (Workflow/Durable Object/queue), not `waitUntil`.
- [ ] Trigger is fast (ack + 👀 + `setStatus`); the durable job owns the final reaction.
- [ ] Failure path flips 👀 → ⚠️ + posts sanitized error + `trace_id` from inside the job.
- [ ] Provider params gated by model family (`input_fidelity`, quality, size).
- [ ] Steps are idempotent — retry re-renders from re-read thread state, no double-post.
- [ ] Image call emits a trace span with usage + per-modality cost (L5).
- [ ] Generated artifact arrives with iterate buttons + settings modal (L3).
- [ ] Image mode is explicit to start, sticky only within its thread, and has a
  documented one-message escape hatch.
- [ ] Thread image/file-only messages survive context rendering and attachments
  reach the durable workflow.
- [ ] Direct/replied-to references outrank thread fallback; corrections exclude
  the bot's rejected output; plain refinements may keep it.
- [ ] Thread text selects/ranks the intended human reference when several designs
  are present.
- [ ] Render logs record safe routing/reference metadata.

## Anti-patterns

- ❌ Running a 30–90s render inside `waitUntil` / a request-scoped promise → cancelled mid-flight, bot goes silent after 👀.
- ❌ Sending a param the chosen model rejects (e.g. `input_fidelity` on `gpt-image-2`) → every edit 400s.
- ❌ Treating a fixed latency bug as the *only* bug — removing the timeout often unmasks a correctness failure cut off before it could surface.
- ❌ Flipping the success/failure reaction from the trigger instead of the durable job — they diverge the moment a retry happens.
- ❌ Standing up R2/S3 just to remember the last image when re-reading the thread is enough.
- ❌ Flattening thread context to text and silently deleting image-only messages.
- ❌ Passing a private `url_private` to a model instead of downloading it with the
  bot token and validating the response `Content-Type`.
- ❌ Accepting an attachment field at the handler but dropping it before the
  workflow/provider seam.
- ❌ Requiring the image flag on every iteration, or auto-entering image mode for
  unrelated requests.
- ❌ Feeding the bot's rejected render back after a semantic correction such as
  "no, use the subway design" and compounding the mistake.
- ❌ Vacuuming every thread image most-recent-first and expecting a short text
  correction to overcome an equal-weight visual blend.
