#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const directory = new URL("../references/", import.meta.url);
const registry = JSON.parse(await readFile(new URL("reserved-handles.json", directory), "utf8"));
const csv = await readFile(new URL("reserved-handles.csv", directory), "utf8");
const syntax = /^[a-z0-9][a-z0-9_-]{1,31}$/;
const exact = new Map();
const counts = {};

for (const [cohort, definition] of Object.entries(registry.cohorts)) {
  if (!["hard_reserved", "manual_claim_required"].includes(definition.policy)) {
    throw new Error(`${cohort}: invalid policy ${definition.policy}`);
  }
  const seen = new Set();
  for (const entry of definition.entries) {
    if (!syntax.test(entry.handle)) throw new Error(`${cohort}: invalid handle ${entry.handle}`);
    if (seen.has(entry.handle)) throw new Error(`${cohort}: duplicate handle ${entry.handle}`);
    seen.add(entry.handle);
    const current = exact.get(entry.handle) ?? new Set();
    current.add(definition.policy);
    exact.set(entry.handle, current);
  }
  counts[cohort] = seen.size;
}

const expectedUnique = registry.summary.unique_exact_handles;
if (exact.size !== expectedUnique) throw new Error(`expected ${expectedUnique} unique handles, found ${exact.size}`);
const csvRows = csv.trimEnd().split("\n").length - 1;
if (csvRows !== expectedUnique) throw new Error(`expected ${expectedUnique} CSV rows, found ${csvRows}`);

console.log(JSON.stringify({ policy_version: registry.policy_version, unique_exact_handles: exact.size, cohorts: counts }, null, 2));
