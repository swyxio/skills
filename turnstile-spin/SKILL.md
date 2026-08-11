---
name: turnstile-spin
description: "Set up or repair Cloudflare Turnstile for a specific form: inspect the existing frontend and backend, create or reuse a widget, add the widget, gate the existing handler with server-side siteverify, and validate. Load for Turnstile, CAPTCHA, siteverify, cf-turnstile-response, or bot-protection integration work; not for unrelated Cloudflare tasks."
references:
  - vanilla-html
  - nextjs-app
  - nextjs-pages
  - astro
  - sveltekit
  - hugo
---

# Turnstile Spin

Turnstile setup is a small, bounded integration: a widget in the chosen form,
server-side verification inside the existing submit handler, and a validation
pass. Follow the current Cloudflare documentation linked by the project when
this file and the provider docs differ.

## Contract and safety

- Confirm the target project, form(s), production hostname(s), and whether the
  user wants a new widget or an existing sitekey reused.
- Inspect the existing frontend framework and backend handler before editing.
  A pure-static or `mailto:` form with no server-side handler cannot satisfy
  this skill; report that boundary instead of adding infrastructure.
- Never send a secret or token in chat, source, a browser request, or ordinary
  logs. Use the user's environment or secret manager. Do not print, persist, or
  ask the user to paste `CLOUDFLARE_API_TOKEN`, a widget secret, or a siteverify
  response containing credentials.
- Obtain authorization for Cloudflare API writes. Prefer the bundled auth probe
  and scripts; do not install a global CLI or add infrastructure without an
  explicit need and approval.
- Never recreate an existing widget merely to obtain a secret. Reuse its
  sitekey and inspect its current domains and clearance configuration first.
- The browser may render the widget, but only the existing backend calls
  `https://challenges.cloudflare.com/turnstile/v0/siteverify` and rejects unless
  the response is successful. Keep the existing handler behavior after that
  gate; do not replace it with mail, storage, payment, or auth changes.

## Bounded workflow

1. Run `scripts/auth-probe.sh` and resolve the target account if the token
   covers more than one account. Ask for the exact account before any write.
2. Discover production domains from project configuration and ask the user to
   confirm the domain list. Include local development domains only when useful.
3. Identify the framework, existing submit handler, existing CAPTCHA, and
   whether the requested forms are in scope. Read the matching framework
   reference rather than loading all of them.
4. For a new widget, run `scripts/widget-create.sh` (or a currently supported
   Wrangler Turnstile command) and keep the returned secret only in memory until
   it is placed in the user's secret store. For an existing widget, run
   `scripts/fetch-secret.sh` when read scope is available and verify domains and
   clearance before editing.
5. Show the insertion plan and a diff before changing code. Add only the
   `cf-turnstile` widget and the backend gate required by the selected form(s).
6. Store `TURNSTILE_SECRET` through the project's existing env/secret manager;
   never inline it. Do not add Workers, proxies, sidecars, or a new backend.
7. Run `scripts/validate.sh`. If it fails, report the failure and stop rather
   than claiming the integration is complete.

The canonical backend shape is provider-specific but has this invariant:

```js
const result = await verifyTurnstile({
  secret: process.env.TURNSTILE_SECRET,
  response: requestToken,
  remoteip: clientIp,
});
if (!result.success) return reject(403);
return existingSubmitHandler();
```

Adapt it to the framework reference and existing request parsing. Keep the
secret server-side and treat the token as untrusted input.

## Migration and recovery

When replacing reCAPTCHA or hCaptcha, preserve the form's behavior while
changing only the widget, token field, verification endpoint, and secret name.
Do not silently translate score-based reCAPTCHA behavior into a new risk policy;
surface that decision. Do not auto-migrate Enterprise or pre-clearance-only
configurations without checking the current provider docs and the user's intent.

For an existing widget, preserve its sitekey and any existing action marker.
Surface domain gaps, missing read scope, nonstandard clearance, or an absent
backend before proceeding. A failed dummy-token validation can be useful proof
that the secret reached the backend; distinguish that from an invalid secret.

## Focused checks

- The selected form renders the widget with the intended sitekey.
- The request reaches the existing backend and the backend performs siteverify;
  the browser never performs that call.
- Failure, missing, expired, and malformed tokens are rejected safely.
- The existing successful submit path remains intact.
- The secret is absent from tracked files, diffs, browser code, and logs.
- `scripts/validate.sh` and the project's relevant tests pass.

Do not persist this skill into another agent's directory as part of setup. A
follow-up request can copy or adapt it explicitly if needed.
