# Anthropic / Claude API

Official references checked 2026-09-22; refresh before execution:

- [Workspaces and limits](https://platform.claude.com/docs/en/manage-claude/workspaces)
- [API key operations](https://platform.claude.com/docs/en/api/cli/beta/organization/api_keys)
- [Admin API](https://platform.claude.com/docs/en/manage-claude/admin-api)
- [Enterprise Spend Limits API](https://platform.claude.com/docs/en/manage-claude/spend-limits-api)

Create a dedicated app/environment workspace in the approved Console organization, set monthly spend/rate limits, and create a named workspace-bound runtime key in Settings → API keys. Use `ANTHROPIC_API_KEY` or the app's existing server secret contract. Do not use a subscription/session token or the managed Claude Code workspace.

The documented key resource has list, retrieve and update, without a creation operation. Use Chrome for Console creation; do not invent `POST /v1/organizations/api_keys`. Admin access depends on organization type/role; individual accounts do not support it. Authorized admin credentials can reconcile keys and update exact key name/status.

Non-default workspaces support monthly spend caps below organization limits. Read them back before traffic. A lifetime allowance still needs a runtime gate because monthly caps renew. The separate Spend Limits API applies to Claude Enterprise members, not Console API workspaces. Confirm actual key workspace scope from metadata. Do not archive a workspace to revoke one key: archiving is irreversible and affects every workspace key.
