# Anthropic / Claude API

Checked 2026-09-22; verify current capabilities when executing:

- [Workspaces and monthly limits](https://platform.claude.com/docs/en/manage-claude/workspaces)
- [API key operations](https://platform.claude.com/docs/en/api/cli/beta/organization/api_keys)
- [Admin API](https://platform.claude.com/docs/en/manage-claude/admin-api)

In the approved Console organization, create dedicated app/environment scope, configure monthly spend/rate limits and warnings, then create a named workspace runtime key in Settings → API keys. Read back actual workspace scope and limits. Don't use subscription/session tokens or the managed Claude Code workspace.

The documented key API exposes list/retrieve/update, without creation; use Console rather than inventing a POST creation endpoint. Admin access depends on account type/role. Non-default workspace monthly caps are bounded by organization limits. If controls are unavailable, use the approved warning fallback. Claude Enterprise member spend APIs are not Console API-workspace controls. Revoke exact keys rather than archiving the whole workspace, which is irreversible and affects every key.
