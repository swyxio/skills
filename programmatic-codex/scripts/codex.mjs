#!/usr/bin/env node

import { spawn } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const BUNDLED_CODEX = "/Applications/ChatGPT.app/Contents/Resources/codex";
const CODEX_BIN = process.env.CODEX_BIN || (existsSync(BUNDLED_CODEX) ? BUNDLED_CODEX : "codex");

function help() {
  return [
    "Usage: node codex.mjs --prompt TEXT [options]",
    "",
    "  --prompt TEXT        Task instructions",
    "  --model MODEL        Exact Codex model identifier; omit to use the configured default",
    "  --input FILE         Read untrusted source data from FILE instead of stdin",
    "  --schema FILE        Require a final response matching this JSON Schema",
    "  --json               Print final response, token usage, timing, and tool events as JSON",
    "  --reasoning LEVEL    low, medium, high, xhigh, max, or ultra; default low",
    "  --sandbox MODE       read-only or workspace-write; default read-only",
    "  --cwd DIRECTORY      Codex project working directory; default current directory",
    "  --timeout SECONDS    Stop the Codex run after this many seconds; default 180",
    "  --help               Show this help without contacting a model",
    "",
    "Set CODEX_BIN to override the preferred desktop-bundled Codex binary.",
  ].join("\n");
}

function parse(argv) {
  const options = { reasoning: "low", sandbox: "read-only", cwd: process.cwd(), timeout: 180, json: false };
  const providedOptions = new Set();

  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];

    if (flag === "--help" || flag === "-h") {
      console.log(help());
      process.exit(0);
    }

    if (providedOptions.has(flag)) throw new Error(`Duplicate option is not allowed: ${flag}`);
    providedOptions.add(flag);

    if (flag === "--json") {
      options.json = true;
      continue;
    }

    if (!["--prompt", "--model", "--input", "--schema", "--reasoning", "--sandbox", "--cwd", "--timeout"].includes(flag)) {
      throw new Error(`Unknown option: ${flag}`);
    }

    const value = argv[++index];
    if (!value || value.startsWith("--")) throw new Error(`${flag} requires a value.`);

    if (flag === "--prompt") options.prompt = value;
    if (flag === "--model") options.model = value;
    if (flag === "--input") options.input = resolve(value);
    if (flag === "--schema") options.schema = resolve(value);
    if (flag === "--reasoning") options.reasoning = value;
    if (flag === "--sandbox") options.sandbox = value;
    if (flag === "--cwd") options.cwd = resolve(value);
    if (flag === "--timeout") options.timeout = Number(value);
  }

  if (!options.prompt) throw new Error("--prompt is required.");
  if (!["low", "medium", "high", "xhigh", "max", "ultra"].includes(options.reasoning)) {
    throw new Error("--reasoning must be low, medium, high, xhigh, max, or ultra.");
  }
  if (!["read-only", "workspace-write"].includes(options.sandbox)) {
    throw new Error("--sandbox must be read-only or workspace-write; unrestricted access is unsupported.");
  }
  if (!Number.isFinite(options.timeout) || options.timeout <= 0) {
    throw new Error("--timeout must be a positive number of seconds.");
  }
  if (!existsSync(options.cwd) || !statSync(options.cwd).isDirectory()) {
    throw new Error(`--cwd must be an existing directory: ${options.cwd}`);
  }
  if (options.input && (!existsSync(options.input) || !statSync(options.input).isFile())) {
    throw new Error(`--input must be an existing file: ${options.input}`);
  }
  if (options.schema) {
    if (!existsSync(options.schema) || !statSync(options.schema).isFile()) {
      throw new Error(`--schema must be an existing JSON file: ${options.schema}`);
    }

    let schema;
    try {
      schema = JSON.parse(readFileSync(options.schema, "utf8"));
    } catch (error) {
      throw new Error(`--schema must contain valid JSON: ${error.message}`);
    }

    if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
      throw new Error("--schema must contain a JSON Schema object.");
    }
    if (schema.type !== "object") {
      throw new Error("--schema root must describe an object.");
    }
    if (schema.additionalProperties !== false) {
      throw new Error("--schema root must set additionalProperties to false.");
    }

    options.schemaDocument = schema;
  }

  return options;
}

function inspectEvents(stdout) {
  const result = { text: null, usage: null, threadId: null, observedModel: null, toolEvents: [], errors: [] };

  for (const line of stdout.split(/\r?\n/)) {
    if (!line.trim()) continue;

    let event;
    try {
      event = JSON.parse(line);
    } catch {
      continue;
    }

    result.threadId ??= event.thread_id ?? event.thread?.id ?? null;
    result.observedModel ??= event.model ?? event.response?.model ?? event.item?.model ?? null;
    result.usage = event.usage ?? event.response?.usage ?? result.usage;

    if (event.type === "item.completed" && event.item?.type === "agent_message") {
      result.text = event.item.text ?? event.item.content?.map((part) => part.text ?? "").join("\n") ?? null;
    }

    if (["command_execution", "mcp_tool_call", "web_search", "file_change"].includes(event.item?.type)) {
      result.toolEvents.push({ type: event.item.type, status: event.item.status ?? event.type });
    }

    if (event.type === "error" || event.type === "turn.failed") {
      result.errors.push(event.error?.message ?? event.message ?? "Codex execution failed.");
    }
  }

  return result;
}

function readableFailure(message) {
  if (/attempt to write a readonly database|failed to initialize in-process app-server client.*operation not permitted/i.test(message)) {
    return "Codex cannot initialize its local state inside this restricted process sandbox. Run from an authorized terminal where ~/.codex is writable; do not bypass approvals or extract credentials.";
  }

  let readable = message;
  try {
    const parsed = JSON.parse(message);
    readable = parsed.error?.message ?? parsed.message ?? message;
  } catch {}

  return String(readable)
    .replace(/\bBearer\s+[^\s,"']+/gi, "Bearer [REDACTED]")
    .replace(/\bsk-[A-Za-z0-9_-]{8,}/g, "[REDACTED_API_KEY]")
    .replace(/\b(?:gh[pousr]_|hf_|xox[baprs]-)[A-Za-z0-9_-]{8,}/g, "[REDACTED_CREDENTIAL]")
    .replace(/((?:api[_-]?key|access[_-]?token|refresh[_-]?token)\s*[:=]\s*)[^\s,"'}]+/gi, "$1[REDACTED]");
}

function validateOutput(value, schema, path = "$", root = schema) {
  if (schema.$ref) {
    if (!schema.$ref.startsWith("#/")) {
      throw new Error(`${path}: external schema references are unsupported`);
    }
    const target = schema.$ref.slice(2).split("/").reduce((node, key) => node?.[key.replace(/~1/g, "/").replace(/~0/g, "~")], root);
    if (!target) throw new Error(`${path}: unresolved schema reference ${schema.$ref}`);
    validateOutput(value, target, path, root);
    return;
  }

  if (schema.anyOf) {
    if (schema.anyOf.some((candidate) => {
      try { validateOutput(value, candidate, path, root); return true; } catch { return false; }
    })) return;
    throw new Error(`${path}: value does not match any allowed schema`);
  }

  if (schema.oneOf) {
    const matching = schema.oneOf.filter((candidate) => {
      try { validateOutput(value, candidate, path, root); return true; } catch { return false; }
    }).length;
    if (matching !== 1) throw new Error(`${path}: value must match exactly one allowed schema`);
    return;
  }

  const actual = value === null ? "null" : Array.isArray(value) ? "array" : typeof value;
  const expected = schema.type === undefined ? [] : Array.isArray(schema.type) ? schema.type : [schema.type];
  if (expected.length && !expected.some((type) => type === actual || (type === "integer" && Number.isInteger(value)))) {
    throw new Error(`${path}: expected ${expected.join(" or ")}, got ${actual}`);
  }
  if (schema.enum && !schema.enum.some((candidate) => Object.is(candidate, value))) {
    throw new Error(`${path}: value is not one of the allowed enum values`);
  }
  if (Object.hasOwn(schema, "const") && !Object.is(schema.const, value)) {
    throw new Error(`${path}: value does not match its required constant`);
  }

  if (actual === "object") {
    for (const field of schema.required ?? []) {
      if (!Object.hasOwn(value, field)) throw new Error(`${path}: required property ${field} is missing`);
    }
    for (const [field, fieldValue] of Object.entries(value)) {
      if (schema.properties && Object.hasOwn(schema.properties, field)) {
        validateOutput(fieldValue, schema.properties[field], `${path}.${field}`, root);
      } else if (schema.additionalProperties === false) {
        throw new Error(`${path}: unexpected property ${field}`);
      } else if (schema.additionalProperties && typeof schema.additionalProperties === "object") {
        validateOutput(fieldValue, schema.additionalProperties, `${path}.${field}`, root);
      }
    }
  }

  if (actual === "array") {
    if (schema.minItems !== undefined && value.length < schema.minItems) throw new Error(`${path}: expected at least ${schema.minItems} items`);
    if (schema.maxItems !== undefined && value.length > schema.maxItems) throw new Error(`${path}: expected at most ${schema.maxItems} items`);
    if (schema.items) value.forEach((item, index) => validateOutput(item, schema.items, `${path}[${index}]`, root));
  }

  if (actual === "string") {
    if (schema.minLength !== undefined && value.length < schema.minLength) throw new Error(`${path}: string is shorter than ${schema.minLength}`);
    if (schema.maxLength !== undefined && value.length > schema.maxLength) throw new Error(`${path}: string is longer than ${schema.maxLength}`);
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) throw new Error(`${path}: string does not match its required pattern`);
  }

  if (actual === "number") {
    if (schema.minimum !== undefined && value < schema.minimum) throw new Error(`${path}: number is below ${schema.minimum}`);
    if (schema.maximum !== undefined && value > schema.maximum) throw new Error(`${path}: number exceeds ${schema.maximum}`);
  }
}

async function run(options) {
  const args = [
    "exec", "--ephemeral", "--sandbox", options.sandbox,
    "--json", "--color", "never", "--skip-git-repo-check",
    "-C", options.cwd, "-c", `model_reasoning_effort=\"${options.reasoning}\"`,
  ];

  if (options.model) args.push("--model", options.model);
  if (options.schema) args.push("--output-schema", options.schema);
  args.push(options.prompt);

  const input = options.input
    ? readFileSync(options.input, "utf8")
    : process.stdin.isTTY ? "" : readFileSync(0, "utf8");
  const startedAt = Date.now();

  return await new Promise((resolveRun, rejectRun) => {
    const child = spawn(CODEX_BIN, args, { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let settled = false;
    let killTimer = null;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      killTimer = setTimeout(() => child.kill("SIGKILL"), 5_000);
      killTimer.unref();
    }, options.timeout * 1000);

    child.stdout.setEncoding("utf8").on("data", (chunk) => { stdout += chunk; });
    child.stderr.setEncoding("utf8").on("data", (chunk) => { stderr += chunk; });
    child.stdin.on("error", () => {});
    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (killTimer) clearTimeout(killTimer);
      rejectRun(new Error(`Unable to start Codex binary ${CODEX_BIN}: ${error.message}`));
    });
    child.on("close", (status) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (killTimer) clearTimeout(killTimer);
      const events = inspectEvents(stdout);

      if (timedOut) return rejectRun(new Error(`Timed out after ${options.timeout}s.`));
      if (events.errors.length) return rejectRun(new Error(readableFailure(events.errors.at(-1))));
      if (status !== 0) return rejectRun(new Error(readableFailure(stderr.trim().slice(-1500) || `Codex exited with status ${status}.`)));
      if (!events.text?.trim()) return rejectRun(new Error("Codex returned no assistant response."));
      if (options.model && events.observedModel && events.observedModel !== options.model) {
        return rejectRun(new Error(`Requested ${options.model} but observed ${events.observedModel}; refusing an unexpected model.`));
      }

      let output = events.text.trim();
      if (options.schema) {
        try {
          output = JSON.parse(output);
        } catch (error) {
          return rejectRun(new Error(`Codex returned invalid JSON for the requested output schema: ${error.message}`));
        }
        try {
          validateOutput(output, options.schemaDocument);
        } catch (error) {
          return rejectRun(new Error(`Structured output schema validation failed at ${error.message}`));
        }
      }

      resolveRun({
        requestedModel: options.model ?? null,
        observedModel: events.observedModel,
        reasoningEffort: options.reasoning,
        sandbox: options.sandbox,
        durationMs: Date.now() - startedAt,
        threadId: events.threadId,
        usage: events.usage,
        toolEvents: events.toolEvents,
        output,
      });
    });

    child.stdin.end(input);
  });
}

try {
  const options = parse(process.argv.slice(2));
  const result = await run(options);
  console.log(options.json || options.schema ? JSON.stringify(result, null, 2) : result.output);
} catch (error) {
  console.error(`Codex run failed: ${error.message}`);
  process.exitCode = 1;
}
