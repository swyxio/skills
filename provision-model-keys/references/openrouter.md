# OpenRouter

Official references checked 2026-09-22; refresh before execution:

- [Management keys](https://openrouter.ai/docs/guides/overview/auth/management-api-keys)
- [Create runtime key](https://openrouter.ai/docs/api/api-reference/api-keys/create-a-new-api-key)

Use an approved management credential. Management keys administer account keys and cannot call completions. Hold them in a separate secret store with expiry, never in the app.

With the management key in the Authorization header, `POST https://openrouter.ai/api/v1/keys` accepts `name`, `limit` (USD), `limit_reset` (`null`, `daily`, `weekly`, `monthly`), `include_byok_in_limit`, `expires_at`, and `workspace_id`. For an approved USD 5 lifetime allowance use `limit: 5`, `limit_reset: null`, `include_byok_in_limit: true`, plus approved workspace/expiry. Resets authorize recurring spending. Verify BYOK billing coverage for the actual routing.

Creation returns the one-time `key` and `data.hash`. Capture privately; retain IDs/hash in the receipt. Verify name, workspace, usage and limits through `GET /api/v1/keys/{hash}`. Reconcile timeouts using paginated inventory; secrets cannot be fetched again. Use `PATCH /api/v1/keys/{hash}` for an approved cap change or disable; refresh its schema first. Rotation must not reset the shared app allowance.
