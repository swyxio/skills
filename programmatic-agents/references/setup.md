# CLI setup and account troubleshooting

Interfaces inspected September 3, 2026. Recheck installed help before changing versions. Account login, model availability, billing entitlement, and a successful adapter call are separate checks. Use an isolated workspace and a tiny prompt such as `Reply with exactly ACCESS_OK. Do not use tools or read files.` Save the resulting run ID, exact requested model, CLI version, permissions, and observed/configured model evidence.

Keep credentials out of prompts, runner JSON, terminal output, and setup notes. Prefer official browser login. When explicitly authorized to create an API key, save it directly to the provider's local credential location with owner-only permissions; never ask for it in chat. Do not reuse authentication tokens with unrelated APIs. Preserve the selected browser account and confirm account identity before purchases. Read the final billing cycle and amount; a successful click is not proof of purchase.

## Codex

Prefer the current desktop-bundled executable over stale global installations. Check `codex login status`, then call the explicitly requested model. ChatGPT/Codex login does not imply OpenAI API-project access. Special preview identifiers must come from the user for the current task; never store them in this skill. Keep the original `scripts/codex.mjs` for structured schema validation.

## Cursor

Executable `agent`, commonly `~/.local/bin/agent`. Use official CLI login and its model catalog. A Free account can authenticate while model calls remain blocked; ensure the CLI uses the intended paid account. Reasoning variants can be encoded in the exact model slug. The initial model display label is configuration evidence, not independent proof of the served model. Installed/tested: 2026.09.02-c22c1a3; Grok 4.6 high variant passed.

## Antigravity

Executable `agy`. Complete its browser login and CLI onboarding; optional interaction-data sharing can be disabled independently of required terms. Select an exact catalog model. The adapter uses plan mode plus sandbox. Installed/tested: 1.1.25; Gemini 3.8 Flash high variant passed. Native conversation databases may be unreadable while in use; do not use SQLite immutable mode to bypass live WAL state.

## Meta Muse Code

Executable `muse`. Meta account login, developer registration, CLI authorization, and billing are separate steps. Developer registration includes Model API/Muse Code agreements. A working login with HTTP 402 means billing is still needed, not that the model slug should be changed. Once the user's payment method was added, Muse Spark 1.3 passed using Muse 1.0.2. Stop rather than repeatedly retrying billing errors. The adapter disables shell/write/web tools and foreign personal context; local session persistence is separately opt-in.

## DeepSeek / Deep Code

DeepSeek recommends the third-party `@vegamo/deepcode-cli` package maintained by lessweb. Install with `npm install -g @vegamo/deepcode-cli` (tested 0.3.1). Browser login alone does not configure CLI credentials. Create a dedicated key in the DeepSeek Platform API Keys screen; its full value is shown only once. Use `~/.deepcode/settings.json` with an `env.API_KEY` value or the `DEEPCODE_API_KEY` environment variable. `DEEPCODE_*` environment variables take precedence over project and user settings.

The adapter pins `DEEPCODE_MODEL` and the official `DEEPCODE_BASE_URL=https://api.deepseek.com`, and disables optional CLI telemetry. Existing platform balance may already be sufficient; inspect it before topping up. Both `deepseek-v4-flash` and `deepseek-v4-pro` passed after key setup.

Default tool permissions are permissive. For this runner, user/project settings must have no allow rules, effective `permissions.defaultMode="askAll"`, and no MCP server definitions. Permission requests fail in noninteractive `--exec` mode. This is not an OS sandbox. Stdout contains the final answer, not token usage or a served-model identifier. Native session collection is not yet validated.

## Z.ai / ZCode

The official desktop download includes a working first-party headless CLI:

```sh
node /Applications/ZCode.app/Contents/Resources/glm/zcode.cjs --version
node /Applications/ZCode.app/Contents/Resources/glm/zcode.cjs login
```

Tested desktop 3.10.2 / bundled CLI 0.16.5. Its help advertises some rejected flags: `--settings` and `--max-turns` failed parser validation. Use verified options: `--prompt`, `--mode plan`, `--output-format stream-json`, `--no-color`. Headless defaults can be permissive; always set plan explicitly.

CLI settings live in `~/.zcode/cli/config.json`; desktop settings are separate at `~/.zcode/v2/config.json`. Shared login does not imply shared provider configuration. The adapter requires `model.main` and `model.lite` to match the exact requested provider/model identifier. The tested paid path was `zai/glm-5.3` through `https://api.z.ai/api/anthropic`.

The desktop Start Plan can show free GLM quota while this CLI provider returns error 1113. Merely changing its endpoint to the desktop trial URL is insufficient: a distinct account connection is required. Do not extract desktop credentials to force it. The paid GLM Coding Lite plan resolved access, and GLM-5.3 passed with provider-reported usage. The tested monthly checkout was $18 with 10,000 credits/week; pricing is historical, not a standing purchasing instruction.

Checkout pitfalls: selecting the offscreen Monthly text via accessibility did not change the default Yearly selection. Use the visible control, then verify $18/month on the actual payment page. Switching to card payment dynamically reveals card/address fields; wait and inspect before Confirm, or the site reports card-binding failure. In-app Continue to payment did not advance; the official browser subscription page worked. Verify My Plan shows Valid before retrying the CLI. Error 1113 may arrive as HTTP 429 with `retryable=false`; classify by the billing message, not HTTP status alone.

## Cognition Devin

Install from the official `https://cli.devin.ai/install.sh` after reviewing the installer. Tested 3000.6.14. Use `devin auth login`; an existing disabled Windsurf-team credential can block access despite installation. After user-authorized account switching, login succeeded. `devin models list --format json` provides exact identifiers; filter rather than dumping unrelated preview models.

`swe-1-7` selected SWE-1.7 Max in the tested catalog. The `swe` alias selected another variant, so pin the exact slug. Print mode plus `--export` produces ATIF trajectory metadata. `auto` plus sandbox was reported as Autonomous in the native export; do not call it read-only. An explicitly trusted isolated directory avoids a noninteractive trust prompt. The runner normalizes native usage/model evidence and removes its temporary full-content export on normal completion.

## Mistral Vibe Code

Mistral's first-party coding CLI is Vibe Code (`vibe`), distinct from older Mistral Code IDE branding. Install with `uv tool install mistral-vibe` outside the consuming project; tested 2.24.5. Run `vibe --setup`, choose a theme, Launch browser, then Mistral AI. Google browser sign-in completed and the official CLI persisted credentials; manual key copying was unnecessary. The documented credential fallback is `MISTRAL_API_KEY` or `~/.vibe/.env`; general settings belong in `~/.vibe/config.toml`.

The setup wizard's welcome animation waits for Enter; subsequent screens also require explicit selection. A stream of terminal redraws does not mean authentication is running yet. Verify the browser says signed in and the CLI says setup complete.

The shared adapter uses `cli="vibe"`, an explicit hosted model name, plan mode, all tools disabled, bounded turns, and `--output streaming`. It defines an exact model entry with `VIBE_MODELS` and selects it with `VIBE_ACTIVE_MODEL`; unknown aliases otherwise silently fall back. `mistral-vibe-cli-latest` is a moving hosted identifier, displayed as Mistral Medium 3.5 in the inspected defaults; it is not an immutable model revision. Reasoning is the native `thinking` setting and defaults to off in the adapter.

Streaming output emits completed history entries, not token deltas. Match `sessionId` to `~/.vibe/logs/session/session_*_<first-eight-id-characters>/meta.json`, then verify the full session ID. Read only numeric stats and selected model metadata; never dump full config, prompts, or history by default. Local `stats.session_cost` is computed from configurable prices, sometimes zero by default; preserve it as a configuration estimate, not a billed cost. The adapter verifies the native session's configured model, leaving independently observed model null when absent. Session logging is required for this check.

## Sources

- [DeepSeek integration](https://api-docs.deepseek.com/quick_start/agent_integrations/deepcode/)
- [ZCode configuration and account routes](https://zcode.z.ai/en/docs/configuration)
- [Devin CLI reference](https://docs.devin.ai/cli/reference/commands)
- [Mistral installation](https://docs.mistral.ai/getting-started/quickstarts/vibe-code/install-cli)
- [Mistral CLI usage](https://docs.mistral.ai/vibe/code/cli/work-with-cli)
- [Mistral authentication](https://docs.mistral.ai/vibe/code/cli/api-keys-profiles)
