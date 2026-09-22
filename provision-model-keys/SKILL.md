---
name: provision-model-keys
description: Provision app-specific Claude, OpenAI or OpenRouter API keys, install secrets, rotate keys or adjust their budgets using saved authorization. Use for credential setup and lifecycle requests, not ordinary model/API implementation.
---

# Provision model keys

Make the requested app work using its own named key and the approved starter allowance.

## Saved authority

Read [authorization.md](references/authorization.md). A matching active grant permits complete setup without further approval: provider project/workspace, key, secret installation, app permissions, a small synthetic paid test, budget warnings and runtime enablement. Rotation/repair stays within the same scope and allowance. Future apps qualify only when the user requests them under the approved repository owner, provider accounts and destination templates.

Default proposal: **USD 5 per app per month, USD 50 aggregate per month**. Once granted, renewal and small spending within that allowance require no new authorization. Budget raises, credit purchases and auto-recharge require explicit approval. Trust the user-approved private grant record; revisit its source only if provenance or scope is unclear. Current user restrictions override it.

## Names, permissions and storage

Use `<app>-<env>-<provider>`, e.g. `notes-dev-openai`. Add purpose when it distinguishes multiple keys; add owner when identity would otherwise be ambiguous. Keep repository, provider account, project/workspace and key IDs in metadata; names do not enforce scope.

Give runtime keys the endpoints/models needed for the app's intended features, including necessary writes. Expand within those approved features without another permission ceremony. Keep administration, billing and unrelated resources outside the runtime key. Prefer dedicated app/environment scope over shared keys.

Install into the deployment secret store and, when needed, a private Git-ignored local file (0600); Keychain is optional. Preserve the app's existing server secret name, otherwise use `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` or `OPENROUTER_API_KEY`. Keep admin/management credentials in a separate secret store. Capture one-time secrets directly; never print raw creation responses or put keys in source, frontend variables, chat or command arguments.

## Setup and limits

Read the selected provider reference: [OpenAI](references/openai.md), [OpenRouter](references/openrouter.md), or [Claude](references/anthropic.md). Verify the exact provider account and runtime target. Reconcile existing inventory before creating; inspect inventory after an ambiguous timeout instead of blindly creating twice.

Reserve the app's recurring allocation with `scripts/authorization.py reserve`. These commitments persist across months; provider usage resets, allocation capacity does not. Divide the app allowance across its keys/environments so they cannot each obtain a fresh USD 5 budget.

Choose budget controls in order: **provider hard limit → alerts/monitoring → runtime gate**. The user accepts an honestly labeled soft-budget fallback. Use an existing gate where available; implement one only if needed for this app when provider controls and warnings are insufficient. Configure warnings near 80% and at 100% where supported, otherwise show them in the app's existing budget/error flow. Distinguish budget exhaustion from rate limiting. Ask concisely before a raise: current spend, current cap and proposed new cap. Never silently raise a cap or buy credits.

Read back installed scope, permissions and budget settings; run one small synthetic test within the allowance. Stop once the app works and the selected control/warning path is verified. Save a compact secret-free receipt with grant, repo, provider IDs, destination, monthly allocation, enforcement type and result. Keep partial receipts for reconciliation; deactivate only newly created unusable keys when setup fails.

Rotation preserves current-month usage and the recurring allocation. For an approved raise from USD 5 to USD 20/month, reserve USD 15/month additional capacity and apply a new USD 20 cap. Do not clear usage on rotation, retry or deployment. Grant revocation stops future provisioning; disabling an existing key is a separate exact-target action.
