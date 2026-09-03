# Reusable CLI adapters and telemetry

Use `scripts/agents.mjs` for Codex, Cursor, Antigravity, and Muse comparisons. The original `codex.mjs` remains available for its schema validation and Codex-specific interface. This adapter returns ordinary assistant text; JSON transport is not schema validation. Validate task-specific structured results in the consuming project. Do not retry malformed responses silently.

The shared runner belongs to this skill; datasets, category prompts, ranking, extraction schemas, and analysis belong to the consuming project. Import `run(config, prompt)` or use two files:

```sh
node /Users/swyx/Work/skills/programmatic-agents/scripts/agents.mjs run.json prompt.txt
```

Example `run.json`:

```json
{
  "cli": "cursor",
  "model": "cursor-grok-4.6-high",
  "cwd": "/tmp/aeo-cli-access-check",
  "trustWorkspace": true,
  "timeoutSeconds": 180,
  "logDir": "./agent-runs",
  "logicalItemId": "category-01-prompt-03",
  "attempt": 1,
  "tags": {"experiment": "pilot", "promptVersion": "v1", "replicate": 1},
  "captureContent": false
}
```

`trustWorkspace` is Cursor-only and explicit; use only for an authorized workspace. All backends retain their approval mechanisms. Cursor uses ask mode and an enabled sandbox; Antigravity uses plan mode and its sandbox. These are not identical guarantees or tool sets. Muse disables write, shell, web tools, foreign personal context, and its own session logging. Codex uses ephemeral read-only execution. Never claim all tools are disabled on every backend.

Other configurations use `cli: "codex"`, `"antigravity"`, or `"muse"`; set the exact model and optionally `reasoning`. Cursor reasoning must be encoded in the model ID, not a separate reasoning field. Observed working identifiers: `gemini-3.8-flash-high`, `cursor-grok-4.6-high`. Muse accepts `muse-spark-1.3`, but live generation was billing-blocked during setup. Verify current model availability and installed CLI help before a new study. Model identifiers are not substituted.

## Deeper telemetry and local stores

Cursor and Antigravity now use streaming output. Per-step state/usage, tool call IDs, configured model labels, permissions, and available tool names are retained when emitted. Read [telemetry-research.md](telemetry-research.md) for verified sources, native exports, local-store findings, and limits. Optional `localEvidence: true` collects a session-matched metadata snapshot after execution; optional `retainLocalSession: true` enables local persistence for Codex/Muse. Neither is enabled implicitly.

## Artifact contract (schemaVersion 1)

Each invocation creates a UUID directory with a streaming `trace.jsonl` and atomically finalized `result.json`. Directories/files are created with owner-only permissions. If a process is forcibly killed or the machine crashes, its start/partial trace remains, but result.json may be absent. That is an incomplete attempt, not success. No resume, caching, concurrency scheduler, or external telemetry upload is implicit.

- Identity/provenance: run/trace ID, optional parent and logical item IDs, attempt, tags, model request, independently emitted model if available, Muse startup model separately, CLI version (null if unavailable), binary, OS, Node version, working directory, config hash, prompt hash/byte length, output hash, timestamps, execution settings.
- Latency: monotonic total wall time (includes version probe), child process duration, first stdout chunk, first supported answer event, CLI-reported total/API duration where supplied. `ttftMs` remains null: a buffered result or stdout event does not establish first-token latency. No fabricated tokens/sec or raw API latency.
- Usage: input, output, cache read/write, reasoning and total tokens when reported; raw provider usage preserved. Unknown fields remain null. Cache/reasoning inclusion varies across providers; do not blindly add these fields. Current adapters retain the latest reported aggregate usage, not a sum of per-event values. Muse usage stays unknown unless a supported aggregate field is emitted.
- Cost: separately records CLI `total_cost_usd` if emitted and an optional rate-based estimate. Neither is assumed to equal a subscription invoice. No built-in prices that silently become stale.
- Failures: category, HTTP status where observed, redacted error on returned result, exit code/signal, malformed-line count, output byte count, provider attempts observed. Billing 402 stops Muse's retry loop. Wrapper never retries. Rate limits, timeouts, and execution failures are recorded for caller-controlled decisions; no blanket retry-safe claim.
- Trace: timestamps, event types/counts, session/request IDs, observed retry counts/statuses, supported usage and tool-event summaries. Provider-internal prompts, hidden reasoning, unreported tools, and token timing are not inferred.

Use tags for dataset/version, category, prompt variant, repetition, git commit, scenario, and pricing experiment. Do not place credentials in tags. An attempt number groups caller-managed reruns; it is not a provider billing idempotency key.

## Cost estimates

Supply only non-overlapping normalized token fields with per-million rates, plus provenance:

```json
{
  "pricing": {
    "currency": "USD",
    "source": "URL or identifier of the verified pricing snapshot",
    "asOf": "YYYY-MM-DD",
    "tokenFields": {"inputTokens": 1.0, "outputTokens": 2.0}
  }
}
```

The numbers above are illustrative, not provider prices. Do not use this simple estimate where input includes differently priced cached tokens, where reasoning overlaps output, or where tiered pricing applies; leave estimated cost unknown and price the raw usage in analysis. A required missing count produces null, never zero. Cost on failed attempts can be unknown even if a provider charged for work.

## Content and secrets

By default persisted artifacts contain metadata/hashes, not prompt/answer bodies; the result returned to the caller/stdout includes the answer and redacted diagnostic error. Explicit `captureContent: true` adds the prompt, answer, and parsed CLI events to artifacts for trajectory analysis. Treat that directory as potentially sensitive: best-effort credential redaction is not a guarantee of anonymization. No environment variable values or authentication files are collected. CLI-owned persistence is separate from this wrapper; Cursor/Antigravity may maintain their own logs. Prompts passed as CLI arguments may be visible to local process inspection.

## Validation

```sh
node --test /Users/swyx/Work/skills/programmatic-agents/scripts/agents.test.mjs
```

Tests run local fake executables: no credentials, paid inference, or network. They exercise all parsers, persistent error records, timeout cleanup, model mismatch, billing-stop behavior, content opt-in/redaction, and unknown-cost semantics. Muse's event shape was additionally checked with its real local echo provider. These tests do not certify live entitlement or every future provider event schema. Recheck one minimal live request per model before a paid batch.


## Deep Code, ZCode, and Devin

Added adapters (installed interfaces inspected 2026-09-03):

| cli | Model example | Execution | Evidence |
| --- | --- | --- | --- |
| deepcode | deepseek-v4-flash or deepseek-v4-pro | Deep Code 0.3.1 --exec | Plain final answer; usage/model observation unavailable through stdout |
| zcode | zai/glm-5.3 | ZCode desktop 3.10.2 bundled CLI 0.16.5, stream-json, plan | Session/trace IDs, events, terminal usage and context projection |
| devin | swe-1-7 | Devin 3000.6.14 print, auto + sandbox, ATIF export | Session, generation model(s), per-step metrics and aggregate tokens |

Use the same JSON config contract. For example:

```json
{"cli":"devin","model":"swe-1-7","cwd":"/absolute/path/to/isolated-workspace","trustWorkspace":true,"logDir":"/absolute/path/to/runs"}
```

Devin's `swe` alias can select a different model; use the exact catalog identifier. `trustWorkspace:true` explicitly opts out of its interactive workspace trust gate. Auto + sandbox was reported as Autonomous in a real export; it is not a read-only filesystem guarantee. Use an isolated workspace. Native export is temporarily written in the private run directory, normalized, and deleted on normal completion. With captureContent enabled, its redacted contents are embedded in trace.jsonl. A hard process crash can leave the temporary export. Plain-output adapters leave firstAnswerEventMs and TTFT null; firstStdoutMs is still measured.

ZCode has a first-party headless CLI inside the desktop application despite desktop-focused public documentation. Default entry is `/Applications/ZCode.app/Contents/Resources/glm/zcode.cjs`; override `zcodeEntry` if necessary. The installed CLI advertises `--settings` but rejects it; configure `~/.zcode/cli/config.json` directly. Both model.main and model.lite must equal the requested provider/model ID; the adapter validates without printing credentials. Configure these before running; the runner does not mutate account settings. The bundled headless default is YOLO, so the adapter always passes plan. GLM-5.3 passed a live adapter call after the account activated GLM Coding Lite. Before activation Z.ai returned insufficient balance/resource package (1113, HTTP 429). Classify this as billing, not a transient rate limit. JSON shape was inspected in bundled source.

Deep Code is third-party open source recommended in DeepSeek's integration docs. Configure the API key using its documented local settings or DEEPCODE_API_KEY environment variable; never place credentials in runner config, logs, or prompts. The adapter pins DEEPCODE_MODEL and DEEPCODE_BASE_URL=https://api.deepseek.com and disables Deep Code telemetry. Optional reasoning maps to DEEPCODE_REASONING_EFFORT. A browser login alone does not grant API access. Both DeepSeek V4 Flash and Pro passed live adapter smoke tests on 2026-09-03 after local API-key setup.

Deep Code merges user and workspace permission lists. The adapter requires effective defaultMode askAll and no allow rules in either file, and rejects configured MCP servers. Set this in the isolated workspace's `.deepcode/settings.json`:

```json
{"permissions":{"defaultMode":"askAll","allow":[],"deny":[],"ask":[]}}
```

Permission requests fail noninteractively. This is not an OS sandbox. Inspect user/project settings and hooks before running against sensitive content. Deep Code session stores and ZCode dotfiles do not yet have validated collectors; localEvidence currently applies only to the original four CLIs. For the added CLIs, use only verified evidence: Devin native exports, ZCode terminal usage, and Vibe session metadata. Vibe collection runs automatically as described below. Native CLI persistence remains provider-specific; retainLocalSession only controls Codex/Muse flags.

References: [DeepSeek integration](https://api-docs.deepseek.com/quick_start/agent_integrations/deepcode/), [Deep Code source](https://github.com/lessweb/deepcode-cli), [ZCode configuration](https://zcode.z.ai/en/docs/configuration), [Devin CLI flags](https://docs.devin.ai/cli/reference/commands).


## Mistral Vibe Code

Use `cli: "vibe"` and an explicit hosted model name (tested `mistral-vibe-cli-latest`). See [setup notes](setup.md#mistral-vibe-code) for authentication and the moving-alias limitation. The adapter uses plan mode, disables all tools, caps turns with `maxTurns` (default 4), and captures completed-history JSON lines. `reasoning` maps to native thinking (default off). Native metadata is matched by full session ID and used to check configured model identity and normalize token stats. This does not establish an independently observed served-model revision. `cliConfiguredCost` preserves Vibe's local estimate separately from reported billing and user-supplied pricing. Logging must remain enabled for metadata verification. Reading session metadata is automatic for Vibe, as native exports are for Devin; it does not require `localEvidence:true`.
