---
name: turnstile-spin
description: Add or repair Cloudflare Turnstile on an existing web form by creating or reusing a widget, embedding it, wiring mandatory server-side Siteverify in the existing backend, and validating the result. Use when the user explicitly asks to add Turnstile, replace reCAPTCHA or hCaptcha with Turnstile, protect a form from bots, or fix a Turnstile integration. Do not trigger for unrelated Cloudflare or general form work.
---

# Turnstile Spin

Integrate Turnstile into the user's existing frontend and backend. Do not create
a new backend, proxy Worker, or other infrastructure merely to host Siteverify.
Current canonical guidance lives at
[Cloudflare Turnstile Spin](https://developers.cloudflare.com/turnstile/spin/).

## Resolve the integration

Inspect the project before asking questions:

- identify the frontend framework and forms that need protection;
- locate the existing server-side submit handler;
- detect an existing Turnstile, reCAPTCHA, or hCaptcha integration; and
- resolve the production hostnames from project configuration when possible.

If no server-side handler exists, report that Turnstile cannot be completed
securely in the current architecture and stop. Siteverify is mandatory and must
run on the server.

Show the proposed forms and hostnames when a material choice remains. Do not
broaden the task into form persistence, email delivery, payment, OAuth, styling,
or framework migration.

## Create or reuse the widget

1. Run `scripts/auth-probe.sh` to resolve an account and the required Turnstile
   permission. Prefer credentials already available to the user's environment;
   never print a token or commit it.
2. If several accounts are available and the project does not resolve one, ask
   the user to select the account.
3. For a new widget, use the current `wrangler turnstile widget create` command
   when installed; otherwise use `scripts/widget-create.sh`.
4. Register only the intended hostnames. Include local hostnames only when local
   development requires them, and validate the production hostname returned by
   Siteverify in production.
5. Put the returned secret directly into the user's existing secret store as
   `TURNSTILE_SECRET`. Never inline it or save an extra copy.

For an existing sitekey, use `scripts/fetch-secret.sh` when authorized and keep
the current widget. Verify its domains and pre-clearance mode. Do not recreate a
widget merely to recover its secret, because that changes the sitekey used by
deployed pages.

## Gate the existing handler

Embed the widget using the framework-specific reference:

- [vanilla-html.md](references/vanilla-html.md)
- [nextjs-app.md](references/nextjs-app.md)
- [nextjs-pages.md](references/nextjs-pages.md)
- [astro.md](references/astro.md)
- [sveltekit.md](references/sveltekit.md)
- [hugo.md](references/hugo.md)

Send the resulting token to the existing backend and call the canonical
Siteverify endpoint there. Continue the original handler only when
`success === true`. Validate the returned hostname and any expected action or
customer data. Tokens expire and are single-use; never rely on client-side
success alone.

Preserve the original submit behavior. Turnstile gates the handler; it does not
replace it.

## Migrate another CAPTCHA carefully

Replace the provider script, widget/sitekey, response field, server verification
endpoint, and secret together. Preserve intentional action names. Do not
automatically translate reCAPTCHA v3 score thresholds or reCAPTCHA Enterprise
policy; surface those semantic differences before editing.

## Validate

Run `scripts/validate.sh` and the project's focused tests. Verify the chosen
forms contain the widget, the token reaches the backend, valid Siteverify output
allows the original handler, invalid or missing tokens are rejected, and the
secret is bound to the intended environment. Report provider setup, local code,
and live behavior separately.
