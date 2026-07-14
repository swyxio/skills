#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const registryPath = fileURLToPath(new URL("../references/reserved-handles.json", import.meta.url));
const registry = JSON.parse(await readFile(registryPath, "utf8"));
const cohorts = Object.entries(registry.cohorts);
const hard = new Map();
const manual = new Map();

for (const [cohort, definition] of cohorts) {
  const target = definition.policy === "hard_reserved" ? hard : manual;
  for (const entry of definition.entries) {
    for (const key of [entry.handle, skeleton(entry.handle)]) {
      const reasons = target.get(key) ?? [];
      if (!reasons.includes(cohort)) reasons.push(cohort);
      target.set(key, reasons);
    }
  }
}

const handles = process.argv.slice(2);
if (handles.length === 0) {
  console.error("Usage: node check-handle.mjs <handle> [handle ...]");
  process.exitCode = 2;
} else {
  for (const input of handles) console.log(JSON.stringify(classify(input)));
}

function classify(input) {
  const normalized = input.trim().toLowerCase();
  const confusable = skeleton(normalized);
  if (!/^[a-z0-9][a-z0-9_-]{1,31}$/.test(normalized)) {
    return { input, normalized, skeleton: confusable, restriction: "invalid", cohorts: [] };
  }
  const hardReasons = unique([...(hard.get(normalized) ?? []), ...(hard.get(confusable) ?? [])]);
  if (hardReasons.length > 0) {
    return { input, normalized, skeleton: confusable, restriction: "hard_reserved", cohorts: hardReasons };
  }
  if (confusable.length <= registry.rules.manual_claim_max_skeleton_length) {
    return { input, normalized, skeleton: confusable, restriction: "manual_claim_required", cohorts: ["short_handle_rule"] };
  }
  const manualReasons = unique([...(manual.get(normalized) ?? []), ...(manual.get(confusable) ?? [])]);
  return {
    input,
    normalized,
    skeleton: confusable,
    restriction: manualReasons.length > 0 ? "manual_claim_required" : "available",
    cohorts: manualReasons,
  };
}

function skeleton(value) {
  return value.replaceAll("-", "").replaceAll("_", "");
}

function unique(values) {
  return [...new Set(values)];
}
