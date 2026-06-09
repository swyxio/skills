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

## Checklist

- [ ] Generation runs in **durable execution** (Workflow/Durable Object/queue), not `waitUntil`.
- [ ] Trigger is fast (ack + 👀 + `setStatus`); the durable job owns the final reaction.
- [ ] Failure path flips 👀 → ⚠️ + posts sanitized error + `trace_id` from inside the job.
- [ ] Provider params gated by model family (`input_fidelity`, quality, size).
- [ ] Steps are idempotent — retry re-renders from re-read thread state, no double-post.
- [ ] Image call emits a trace span with usage + per-modality cost (L5).
- [ ] Generated artifact arrives with iterate buttons + settings modal (L3).

## Anti-patterns

- ❌ Running a 30–90s render inside `waitUntil` / a request-scoped promise → cancelled mid-flight, bot goes silent after 👀.
- ❌ Sending a param the chosen model rejects (e.g. `input_fidelity` on `gpt-image-2`) → every edit 400s.
- ❌ Treating a fixed latency bug as the *only* bug — removing the timeout often unmasks a correctness failure cut off before it could surface.
- ❌ Flipping the success/failure reaction from the trigger instead of the durable job — they diverge the moment a retry happens.
- ❌ Standing up R2/S3 just to remember the last image when re-reading the thread is enough.
