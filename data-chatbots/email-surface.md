# Email surface (forward-an-email-to-the-copilot)

Email is **another adapter over the same core** — parse the inbound MIME, call
`runAiebotQuery`, render a reply, and **mirror everything to Slack**. The brain,
draft→apply pipeline, audit log, and session semantics are identical to web and
Slack; only the transport and the approval UX change (no buttons — you classify
intent from reply text). Read this once you ship "forward an email to the bot."

Reference implementation: `swyxio/aiewf2026-internal-schedule` — `email-worker/`
(separate Workers project) + shared `functions/_lib/*`, migration
`0021_email_threads.sql`, docs `docs/email-aiebot.md`.

## Platform shape (Cloudflare, but the lessons generalize)

- **A Pages/serverless app cannot receive inbound email.** Only a Worker with an
  `email()` handler (bound via Email Routing) can. So the email surface is a
  small **separate Workers project** that shares the **same D1 database** (by
  `database_id`) and imports the same channel-agnostic core. Don't fork the
  brain; share the lib.
- **The `email()` handler is torn down after ~30s** (and `message.reply()` dies
  with it) — the exact "never run agent work inline" ceiling from
  [slackbot-builder L5](../slackbot-builder/level-5-hardened.md). So: **ack
  instantly inside the handler** (`message.reply()`), then **offload the agent
  loop to a durable Workflow** (own time budget + per-step retries) that sends
  the real reply via the outbound binding. Same three-phase
  ack → work → guaranteed-result-or-error pattern, different mechanisms.
- **One inbound, two phases:** the handler does only fast, synchronous gating +
  the instant ack + the Slack-thread open; the Workflow does the slow planning,
  proposal posting, and summary/approval reply.

## Gate before you do any work (inbound safety)

Email has no signature header you control like Slack, so the gate is a stack:

1. **Idempotency — dedupe on `Message-ID`.** Mail gets redelivered. Record the
   `Message-ID` once in D1 *before* processing; a second delivery is a no-op.
   (This is also what you match replies against — see threading.)
2. **Loop guard.** A bot that replies to its own bounce/auto-reply loops forever.
   Stamp outbound with a marker header (`X-Aiebot`) and **drop** inbound that has
   it, comes from your own address, or is `Auto-Submitted`/auto-reply.
3. **Allowlist senders by domain.** Never let arbitrary internet mail drive
   mutations. `EMAIL_ALLOWLIST_DOMAINS` → permanent SMTP rejection otherwise.
4. **Gate *approvals* on authentication (the email analog of Slack signature
   verify).** `From:` is trivially spoofable. Only treat an email as an
   **approval** when the platform's `Authentication-Results` shows **SPF or DKIM
   pass (and DMARC not fail)**. If it can't be verified, still draft + mirror to
   Slack, but force the human to approve from the Slack button.

Allowlist + auth are *different jobs*: allowlist decides "may this sender talk to
the bot at all"; auth decides "may this specific message *apply* changes."

## Threading = the session boundary (same as Slack `thread_ts`)

- Persist a thread per conversation, keyed by the root `Message-ID`. Match
  replies via **`In-Reply-To` + `References`** (parse the full list; clients vary).
  `session_key = email:<threadId>`, so the copilot's memory/outcomes work
  unchanged.
- Two tables: `email_threads` (conversation ⟷ Slack thread ⟷ session) and
  `email_messages` (append-only, keyed by `Message-ID` — doubles as the
  idempotency guard *and* the reply→thread lookup).
- **Outbound must set `Message-ID`, `In-Reply-To`, `References`** and keep the
  subject `Re:` so the human's client threads it. Store your sent `Message-ID` so
  the eventual reply matches back.

## Deliverability battle scars (the part that actually bit us)

### 1. The reply `From:` is part of the control plane — it must round-trip.

**Real incident.** aiebot's replies were sent `From: schedule@aieconf.com`, a
**send-only** address with no inbox. The instant ack and summary went out fine —
but when the human hit reply and typed `approve`, it bounced `550 address does
not exist`. The entire **email-approval loop was silently broken**: the bot could
talk *at* people but never hear them back. Fix: send all **conversation** replies
`From:` a real, routable inbox (`aiebot@aieconf.com`) via a dedicated
`AIEBOT_EMAIL_ADDRESS` + `aiebotReplyFrom(env)` helper; keep the generic
send-only `EMAIL_FROM` only for one-way mail (password resets, snapshots).
**Lesson: if a reply can carry an instruction, the `From:` you put on the
outbound must be able to receive that reply.** Test the round-trip, not just the
send.

### 2. The outbound binding only delivers to *verified destinations* — design for graceful degradation.

Cloudflare's `send_email` binding can only deliver to addresses **verified in
Email Routing** (unless the whole domain is onboarded to Email Sending). For
addresses on a domain that isn't on Cloudflare, you verify **each one
individually** (it emails a confirmation link; recipient clicks once). So treat
the "rich async reply" as **best-effort** and make the flow survive its loss:

- the **instant ack** uses `message.reply()` (replies to whoever emailed you, no
  verification needed) → **always lands**;
- the **Slack thread + proposal cards** never depend on email delivery;
- only the later **summary / approval-confirmation email** can fail → tell the
  user to **approve from the Slack thread** instead.

Escape hatch: route replies through an API email provider (Resend, etc.) with a
verified sending *domain* to skip per-address verification — but then mind the
precedence between the platform binding and the API provider in your send lib.

### 3. You can only send/receive on domains you actually control on the platform.

We wanted everything on `@ai.engineer`, but its DNS/MX lived on Vercel, so
**inbound and the reply `From:` had to live on `aieconf.com`** (owned in
Cloudflare). Allowlisting `@ai.engineer` senders is fine (it's just a string
check), but *receiving* and *replyable-From* are constrained by which domain has
Email Routing enabled. Sort the domain reality out **before** wiring addresses.

## Approvals without buttons (intent classification)

Email has no Block Kit. Replies are free text, so:

- **Classify intent** (`approve` / `reject` / `modify` / follow-up) with a model
  call + a **regex fallback** (`approve all`, `approve 1,3`, `reject 2`). Don't
  rely on the model alone for the safety-critical verb.
- **Strip the quoted reply** first (`On <date> X wrote: > …`) or you classify the
  bot's own prior message.
- `modify` → re-plan and draft fresh proposals (same as a new turn). `approve`
  only applies if the message also passed the **auth gate** above.
- Map the result onto the **exact same apply pipeline** (operation + audit +
  version bump) as the web Apply button. Email is not a shortcut around
  `apply == review`, the destruction guards, or the FAILED-outcome session line.

## Bidirectional mirroring (the whole point)

- Every inbound email → its **own Slack thread** in a default channel + an instant
  email ack. Proposals post as cards in that thread.
- Link the proposal set to the thread (`metadata.emailThreadId`) so the **Slack
  interactivity handler can email the forwarder** when a card is approved/rejected
  from Slack — Slack action → email reply, threaded. And email approve → mirror
  the outcome into Slack. Neither surface is a dead end.
- Service-user attribution: email-applied changes are attributed to the **same
  synthetic service user** as Slack-applied ones, so the audit log identity is
  unified across surfaces.

### Battle scar: mirroring an action must *resolve the other surface's controls*, not just announce it

**Real incident.** Approving a draft **by email** applied the change and posted a
`:email: Email action … Applied` line into the Slack thread — but the original
**proposal card still showed live Approve / Reject buttons**. A teammate could
click Approve on a draft that was *already applied* (double-apply, or a confusing
`version_conflict`/"already resolved" error). Posting a confirmation **message**
is not the same as **resolving the interactive card**.

The trap is asymmetric surface state: the surface that *originates* a click has
the message blocks in its payload and rewrites the buttons in place; the surface
that resolves the draft **out of band** (email reply, web Apply, a cron) has no
such payload and silently skips the rewrite. The buttons are canonical-looking
UI over a draft that no longer exists.

**Guardrail — when any surface resolves a proposal, resolve *every* surface's
controls for it:**

- **Persist the control's address.** When you post the Block Kit card, store its
  `channel` + message `ts` on the proposal set (`metadata.slackCardChannel` /
  `slackCardTs`). The out-of-band path can't rewrite a message it can't locate.
- **Re-fetch + rewrite from the resolving path.** On email/web apply, fetch the
  stored message's current blocks (`conversations.history` by `ts`), replace the
  acted proposal's action block with a status line (the *same* resolver the click
  handler uses), and `chat.update`. If the whole set is resolved, retire the
  bulk "Approve all" block too.
- **Best-effort, never blocking.** A missing card or Slack hiccup must not fail
  the email reply — log it (`card_rewrite: no_blocks|error`) and move on.
- **It's retroactive-blind.** Cards posted *before* you started storing the `ts`
  can't be resolved out of band — only new ones. Ship the store-the-ts change and
  the rewrite together.

Generalize: this is the **N-surface corollary of `apply == review`** — the same
draft is reachable from web, Slack, and email, so "resolved" has to fan out to
every surface's affordance, not just the one that happened to trigger it.

## Tooling

`postal-mime` to parse inbound MIME → structured object; `mimetext` to build the
instant raw-MIME ack reply. The Workflow's later sends go through your normal
outbound email lib (binding or API provider).

## Test matrix additions (email surface)

| Category | Example failure if untested |
|----------|-----------------------------|
| **Reply From round-trips** | Replies sent from a send-only address → human's `approve` bounces `550`; approval loop silently dead |
| **Unverified destination degrades** | Async summary email fails to deliver → flow must still ack + post Slack cards, not hang |
| **Message-ID idempotency** | Redelivered inbound double-processes / double-replies |
| **Loop guard** | Bot replies to its own auto-reply/bounce → infinite mail loop |
| **Allowlist** | Off-allowlist sender drives a mutation |
| **Auth gate on approval** | Spoofed `From:` "approve" applies changes without SPF/DKIM pass |
| **Thread matching** | Reply with `In-Reply-To`/`References` starts a new thread instead of continuing the session |
| **Intent fallback** | Model misreads `approve 1,3`; regex fallback not exercised |
| **Quoted-reply strip** | Classifier reads the bot's quoted prior message as the user's intent |
| **Handler timeout** | Agent loop run inline in `email()` → torn down at ~30s, no reply, no error |
| **Cross-surface mirror (outcome)** | Slack Approve on an email-drafted proposal does not email the forwarder back |
| **Cross-surface mirror (controls)** | Email approve applies the draft but the Slack card's Approve/Reject buttons stay live → teammate double-applies an already-resolved draft |

## Quick checklist (email surface)

```
[ ] Inbound handled by a Worker email() handler (not Pages/serverless app); shares the same DB + core
[ ] email() does only fast gating + instant ack (message.reply); agent loop runs in a durable Workflow
[ ] Message-ID recorded once before processing (idempotent); duplicate deliveries are no-ops
[ ] Loop guard: X-Aiebot marker on outbound; drop own-address / Auto-Submitted / marked inbound
[ ] Sender allowlist by domain (talk-to-bot gate) — distinct from the approval auth gate
[ ] Approvals require SPF/DKIM pass (DMARC not fail); else draft + mirror, approve via Slack button
[ ] Threading: persist by Message-ID, match replies via In-Reply-To + References, session_key = email:<id>
[ ] Outbound sets Message-ID/In-Reply-To/References + Re: subject so clients thread it
[ ] Reply From is a REAL routable inbox (round-trips) — never a send-only address; test the reply, not just the send
[ ] Verified-destination limit handled: ack always lands; rich async reply is best-effort; Slack is the fallback
[ ] Domain reality settled first: receive + replyable-From on a domain you control on the platform
[ ] Email approve/reject/modify classified (model + regex fallback) on quote-stripped text
[ ] Email apply goes through the SAME operation + audit + version pipeline (no apply==review/guard bypass)
[ ] Bidirectional mirror: inbound → Slack thread; Slack action → email the forwarder; proposal set linked by emailThreadId
[ ] Resolving a draft from ANY surface rewrites EVERY surface's controls: store the card's channel+ts when posted; email/web apply re-fetches blocks and rewrites the buttons to a status line (retire the bulk button too); best-effort + logged
[ ] Email-applied changes attributed to the same service user as Slack-applied
```
