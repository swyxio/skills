# OpenRouter

Checked 2026-09-22; verify current fields when executing:

- [Management keys](https://openrouter.ai/docs/guides/overview/auth/management-api-keys)
- [Create runtime key](https://openrouter.ai/docs/api/api-reference/api-keys/create-a-new-api-key)

Use an approved management credential separately from the app's runtime key. `POST https://openrouter.ai/api/v1/keys` accepts name, USD limit, reset period, BYOK inclusion, expiry and workspace ID. For a USD 5/month allocation use `limit: 5`, `limit_reset: "monthly"`, and `include_byok_in_limit: true`, with approved scope/expiry. Verify BYOK coverage for the actual routing.

Creation returns one-time `key` and `data.hash`; capture privately and retain only IDs/hash. Read back limits, workspace and monthly usage through `GET /api/v1/keys/{hash}`. Reconcile timeouts through inventory; secrets cannot be fetched again. Use the documented PATCH resource for approved cap changes/disable. Split allowance across simultaneous keys; rotation must preserve the current month's remaining balance. Configure provider or existing app warnings; never auto-purchase credits.
