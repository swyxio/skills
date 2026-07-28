#!/usr/bin/env node

import { readFile } from 'node:fs/promises';

const [path] = process.argv.slice(2);
if (!path || path === '--help' || path === '-h') {
  process.stdout.write('Usage: validate-report.mjs <deep-trajectory-report.json>\n');
  process.exit(path ? 0 : 2);
}

const report = JSON.parse(await readFile(path, 'utf8'));
const failures = [];

required(report, 'schemaVersion', failures);
requiredString(report, 'analysisId', failures);
requiredObject(report, 'hypothesis', failures);
requiredObject(report, 'provenance', failures);
requiredObject(report, 'integrity', failures);
requiredObject(report, 'population', failures);
requiredArray(report, 'cases', failures);

if (report.schemaVersion !== 1) failures.push('schemaVersion must equal 1.');
if (report.hypothesis) {
  requiredString(report.hypothesis, 'policy', failures, 'hypothesis.');
  requiredArray(report.hypothesis, 'intendedEffects', failures, 'hypothesis.');
}
if (report.provenance) {
  for (const key of [
    'baseline',
    'candidate',
    'engineFingerprint',
    'scheduleFingerprint',
  ]) requiredString(report.provenance, key, failures, 'provenance.');
}
if (report.integrity) {
  for (const key of ['exactPairs', 'replayVerified', 'failures', 'caps']) {
    requiredCount(report.integrity, key, failures, 'integrity.');
  }
  if (
    Number.isInteger(report.integrity.exactPairs)
    && Number.isInteger(report.integrity.replayVerified)
    && report.integrity.replayVerified > report.integrity.exactPairs
  ) failures.push('integrity.replayVerified cannot exceed exactPairs.');
}
if (report.population) validatePopulation(report.population, failures);
if (Array.isArray(report.cases)) validateCases(report.cases, failures);

if (failures.length) {
  process.stderr.write(`Deep trajectory report rejected:\n- ${failures.join('\n- ')}\n`);
  process.exit(1);
}
process.stdout.write(
  `Deep trajectory report accepted: ${report.analysisId} `
  + `(${report.integrity.exactPairs} exact pairs, ${report.cases.length} cases)\n`,
);

function validatePopulation(population, failures) {
  const keys = [
    'opportunities',
    'exposures',
    'actionDivergences',
    'immediateEffects',
    'replyEligible',
    'physicalSurvivals',
    'positiveResponseCycles',
    'mediumConversions',
    'finalConversions',
  ];
  for (const key of keys) requiredCount(population, key, failures, 'population.');
  const boundedPairs = [
    ['actionDivergences', 'exposures'],
    ['immediateEffects', 'actionDivergences'],
    ['physicalSurvivals', 'replyEligible'],
    ['positiveResponseCycles', 'replyEligible'],
  ];
  for (const [part, total] of boundedPairs) {
    if (Number.isInteger(population[part])
      && Number.isInteger(population[total])
      && population[part] > population[total]) {
      failures.push(`population.${part} cannot exceed ${total}.`);
    }
  }
}

function validateCases(cases, failures) {
  const pairKeys = new Set();
  for (const [index, item] of cases.entries()) {
    const prefix = `cases[${index}].`;
    requiredString(item, 'kind', failures, prefix);
    requiredString(item, 'pairKey', failures, prefix);
    requiredObject(item, 'firstDivergence', failures, prefix);
    requiredObject(item, 'trajectory', failures, prefix);
    if (item.replayVerified !== true) failures.push(`${prefix}replayVerified must be true.`);
    if (item.firstDivergence) {
      requiredCount(item.firstDivergence, 'step', failures, `${prefix}firstDivergence.`);
      requiredString(
        item.firstDivergence,
        'sharedPreStateFingerprint',
        failures,
        `${prefix}firstDivergence.`,
      );
    }
    if (pairKeys.has(item.pairKey)) failures.push(`${prefix}pairKey is duplicated.`);
    pairKeys.add(item.pairKey);
  }
}

function required(object, key, failures, prefix = '') {
  if (!(key in object)) failures.push(`${prefix}${key} is required.`);
}

function requiredString(object, key, failures, prefix = '') {
  required(object, key, failures, prefix);
  if (key in object && (typeof object[key] !== 'string' || !object[key].trim())) {
    failures.push(`${prefix}${key} must be a non-empty string.`);
  }
}

function requiredObject(object, key, failures, prefix = '') {
  required(object, key, failures, prefix);
  if (
    key in object
    && (!object[key] || typeof object[key] !== 'object' || Array.isArray(object[key]))
  ) failures.push(`${prefix}${key} must be an object.`);
}

function requiredArray(object, key, failures, prefix = '') {
  required(object, key, failures, prefix);
  if (key in object && !Array.isArray(object[key])) {
    failures.push(`${prefix}${key} must be an array.`);
  }
}

function requiredCount(object, key, failures, prefix = '') {
  required(object, key, failures, prefix);
  if (key in object && (!Number.isInteger(object[key]) || object[key] < 0)) {
    failures.push(`${prefix}${key} must be a non-negative integer.`);
  }
}
