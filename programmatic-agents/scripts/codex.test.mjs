import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const runner = fileURLToPath(new URL("./codex.mjs", import.meta.url));
let temporaryDirectory;
let fakeCodex;
let schemaPath;
let inputPath;

before(() => {
  temporaryDirectory = mkdtempSync(join(tmpdir(), "programmatic-agents-test-"));
  fakeCodex = join(temporaryDirectory, "fake-codex.mjs");
  schemaPath = join(temporaryDirectory, "schema.json");
  inputPath = join(temporaryDirectory, "source.txt");

  writeFileSync(schemaPath, JSON.stringify({
    type: "object",
    properties: { answer: { type: "string" } },
    required: ["answer"],
    additionalProperties: false,
  }));
  writeFileSync(inputPath, "Synthetic source text; no real document or credential.");
  writeFileSync(fakeCodex, `#!/usr/bin/env node
const mode = process.env.CODEX_RUNNER_FAKE_MODE || "success";
if (mode === "sandbox-blocked") {
  console.error("failed to open state db: attempt to write a readonly database");
  process.exit(1);
}
if (mode === "event-error") {
  console.log(JSON.stringify({ type: "turn.failed", error: { message: JSON.stringify({ error: { message: "Requested model unavailable" } }) } }));
  process.exit(1);
}
if (mode === "secret-error") {
  console.error("provider denied Authorization: Bearer sk-proj-very_secret_test_credential_123456789");
  process.exit(1);
}
if (mode === "timeout") setTimeout(() => {}, 10_000);
else {
  const input = (await import("node:fs")).readFileSync(0, "utf8");
  const structured = process.argv.includes("--output-schema");
  const structuredOutput = process.env.CODEX_RUNNER_FAKE_OUTPUT ? JSON.parse(process.env.CODEX_RUNNER_FAKE_OUTPUT)
    : mode === "wrong-type" ? { answer: 42 }
    : mode === "extra-field" ? { answer: "READY", unexpected: "secret" }
    : mode === "missing-field" ? {}
    : { answer: "READY" };
  const text = mode === "invalid-output" ? "not JSON" : structured ? JSON.stringify(structuredOutput) : "READY";
  console.log(JSON.stringify({ type: "thread.started", thread_id: "thread_test" }));
  if (mode === "tool") console.log(JSON.stringify({ type: "item.completed", item: { type: "mcp_tool_call", status: "completed", arguments: { apiKey: "sk-proj-never_leak_this_test_secret_123456" } } }));
  console.log(JSON.stringify({ type: "item.completed", item: { type: "agent_message", text } }));
  const modelIndex = process.argv.indexOf("--model");
  const requestedModel = modelIndex >= 0 ? process.argv[modelIndex + 1] : null;
  console.log(JSON.stringify({ type: "turn.completed", model: mode === "wrong-model" ? "unexpected-model" : requestedModel ?? "configured-default", usage: { input_tokens: input.length, output_tokens: 7 } }));
}
`);
  chmodSync(fakeCodex, 0o755);
});

after(() => {
  rmSync(temporaryDirectory, { recursive: true, force: true });
});

function invoke(arguments_, mode = "success", options = {}) {
  return spawnSync(process.execPath, [runner, ...arguments_], {
    cwd: options.cwd ?? temporaryDirectory,
    input: options.input ?? "",
    encoding: "utf8",
    env: { ...process.env, CODEX_BIN: fakeCodex, CODEX_RUNNER_FAKE_MODE: mode, ...options.env },
    timeout: 10_000,
  });
}

describe("programmatic Codex runner", () => {
  it("returns plain summaries using an explicit model", () => {
    const result = invoke(["--prompt", "Summarize", "--model", "model-a", "--input", inputPath]);
    assert.equal(result.status, 0);
    assert.equal(result.stdout.trim(), "READY");
  });

  it("uses the configured default when no model is requested", () => {
    const result = invoke(["--prompt", "Summarize", "--json"]);
    assert.equal(result.status, 0);
    const payload = JSON.parse(result.stdout);
    assert.equal(payload.requestedModel, null);
    assert.equal(payload.observedModel, "configured-default");
  });

  it("returns parsed structured data, observed model, token usage, and thread identity", () => {
    const result = invoke(["--prompt", "Extract", "--model", "model-b", "--input", inputPath, "--schema", schemaPath, "--json"]);
    assert.equal(result.status, 0);
    const payload = JSON.parse(result.stdout);
    assert.equal(payload.requestedModel, "model-b");
    assert.equal(payload.observedModel, "model-b");
    assert.equal(payload.reasoningEffort, "low");
    assert.equal(payload.sandbox, "read-only");
    assert.equal(payload.threadId, "thread_test");
    assert.equal(payload.usage.output_tokens, 7);
    assert.deepEqual(payload.output, { answer: "READY" });
  });

  it("rejects structured output whose property type violates the requested schema", () => {
    const result = invoke(["--prompt", "Extract", "--schema", schemaPath], "wrong-type");
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /schema validation failed.*answer.*string/i);
  });

  it("rejects unexpected structured-output properties", () => {
    const result = invoke(["--prompt", "Extract", "--schema", schemaPath], "extra-field");
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /schema validation failed.*unexpected/i);
  });

  it("rejects missing required structured-output properties", () => {
    const result = invoke(["--prompt", "Extract", "--schema", schemaPath], "missing-field");
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /schema validation failed.*answer/i);
  });

  it("validates nested arrays, nullable fields, enums, bounds, and local schema references", () => {
    const complexPath = join(temporaryDirectory, "complex-schema.json");
    writeFileSync(complexPath, JSON.stringify({
      type: "object",
      additionalProperties: false,
      properties: {
        speaker: { type: ["string", "null"] },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        label: { type: "string", enum: ["talk", "panel"] },
        points: { type: "array", minItems: 1, items: { $ref: "#/$defs/point" } },
      },
      required: ["speaker", "confidence", "label", "points"],
      $defs: {
        point: {
          type: "object",
          additionalProperties: false,
          properties: { text: { type: "string", minLength: 1 } },
          required: ["text"],
        },
      },
    }));
    const output = { speaker: null, confidence: 0.8, label: "talk", points: [{ text: "Grounded fact" }] };
    const result = invoke(["--prompt", "Extract", "--schema", complexPath], "success", {
      env: { CODEX_RUNNER_FAKE_OUTPUT: JSON.stringify(output) },
    });
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout).output, output);
  });

  it("rejects invalid nested reference values", () => {
    const complexPath = join(temporaryDirectory, "complex-schema.json");
    const output = { speaker: null, confidence: 0.8, label: "talk", points: [{ text: 42 }] };
    const result = invoke(["--prompt", "Extract", "--schema", complexPath], "success", {
      env: { CODEX_RUNNER_FAKE_OUTPUT: JSON.stringify(output) },
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /points\[0\]\.text.*string/i);
  });

  it("rejects structured numeric values outside declared bounds", () => {
    const complexPath = join(temporaryDirectory, "complex-schema.json");
    const output = { speaker: null, confidence: 3, label: "talk", points: [{ text: "Grounded fact" }] };
    const result = invoke(["--prompt", "Extract", "--schema", complexPath], "success", {
      env: { CODEX_RUNNER_FAKE_OUTPUT: JSON.stringify(output) },
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /confidence.*exceeds 1/i);
  });

  it("refuses a server-observed model that differs from an explicit request", () => {
    const result = invoke(["--prompt", "Summarize", "--model", "model-a", "--json"], "wrong-model");
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /requested model-a.*observed unexpected-model/i);
  });

  it("captures configured tool events without exposing arguments", () => {
    const result = invoke(["--prompt", "Use the approved tool", "--json"], "tool");
    assert.equal(result.status, 0);
    assert.deepEqual(JSON.parse(result.stdout).toolEvents, [{ type: "mcp_tool_call", status: "completed" }]);
    assert.doesNotMatch(result.stdout, /never_leak_this_test_secret/);
  });

  it("accepts piped input and configurable equal reasoning effort", () => {
    const result = invoke(["--prompt", "Summarize", "--reasoning", "high", "--json"], "success", { input: "Piped synthetic text" });
    assert.equal(result.status, 0);
    const payload = JSON.parse(result.stdout);
    assert.equal(payload.reasoningEffort, "high");
    assert.equal(payload.usage.input_tokens, "Piped synthetic text".length);
  });

  it("rejects missing schema files before launching Codex", () => {
    const result = invoke(["--prompt", "Extract", "--schema", join(temporaryDirectory, "missing.json")]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /--schema must be an existing JSON file/);
  });

  it("rejects missing input files before launching Codex", () => {
    const result = invoke(["--prompt", "Summarize", "--input", join(temporaryDirectory, "missing.txt")]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /--input must be an existing file/);
  });

  it("rejects malformed schema documents before launching Codex", () => {
    const broken = join(temporaryDirectory, "broken.json");
    writeFileSync(broken, "{invalid");
    const result = invoke(["--prompt", "Extract", "--schema", broken]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /--schema must contain valid JSON/);
  });

  it("rejects unrestricted sandbox modes", () => {
    const result = invoke(["--prompt", "Execute", "--sandbox", "danger-full-access"]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /unrestricted access is unsupported/);
  });

  it("rejects duplicate options instead of silently overriding safety settings", () => {
    const result = invoke(["--prompt", "Execute", "--sandbox", "read-only", "--sandbox", "workspace-write"]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /duplicate option.*--sandbox/i);
  });

  it("rejects output schemas that do not describe a strict root object", () => {
    const arraySchema = join(temporaryDirectory, "array-schema.json");
    writeFileSync(arraySchema, JSON.stringify({ type: "array", items: { type: "string" } }));
    const result = invoke(["--prompt", "Extract", "--schema", arraySchema]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /root.*object/i);
  });

  it("rejects object schemas that permit undeclared properties", () => {
    const openSchema = join(temporaryDirectory, "open-schema.json");
    writeFileSync(openSchema, JSON.stringify({ type: "object", properties: { answer: { type: "string" } } }));
    const result = invoke(["--prompt", "Extract", "--schema", openSchema]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /additionalProperties to false/i);
  });

  it("reports invalid structured model output without crashing", () => {
    const result = invoke(["--prompt", "Extract", "--schema", schemaPath], "invalid-output");
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /invalid JSON for the requested output schema/);
    assert.doesNotMatch(result.stderr, /at ChildProcess/);
  });

  it("extracts actionable messages from nested Codex errors", () => {
    const result = invoke(["--prompt", "Summarize"], "event-error");
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /^Codex run failed: Requested model unavailable/m);
  });

  it("redacts bearer tokens and API keys from provider failures", () => {
    const result = invoke(["--prompt", "Summarize"], "secret-error");
    assert.notEqual(result.status, 0);
    assert.doesNotMatch(result.stderr, /very_secret_test_credential/);
    assert.match(result.stderr, /REDACTED/);
  });

  it("explains restricted Codex state without recommending sandbox bypass", () => {
    const result = invoke(["--prompt", "Summarize"], "sandbox-blocked");
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /current sandbox|restricted process sandbox/);
    assert.match(result.stderr, /do not bypass approvals/);
  });

  it("terminates timed-out child processes", () => {
    const result = invoke(["--prompt", "Summarize", "--timeout", "0.05"], "timeout");
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Timed out after 0\.05s/);
  });
});
