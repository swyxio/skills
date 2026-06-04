/**
 * Reference: functions/_lib/ai.ts (validate + sanitize pipeline)
 *
 * 1) Normalize user/model aliases before allowlist check
 * 2) Coerce assignment_create on placeholder → assignment update
 * 3) Reject unsupported patch keys (silent strip = production bug)
 */

const ASSIGNMENT_CONTENT_KEYS = [
  'title', 'abstract', 'speakers', 'track', 'sponsor', 'status', 'notes', 'color',
  'cfpProposalId', 'cfpExternalSessionId', 'cfpSourceImportId', 'cfpSourceRowId', 'cfpSourceRowHash'
] as const;

const CFP_PATCH_ALIASES: Record<string, string> = {
  proposal_id: 'cfpProposalId',
  external_session_id: 'cfpExternalSessionId',
  source_import_id: 'cfpSourceImportId',
  source_row_id: 'cfpSourceRowId',
  source_row_hash: 'cfpSourceRowHash'
};

function normalizeCfpLinkPatch(patch: Record<string, unknown>): Record<string, unknown> {
  const next = { ...patch };
  for (const [alias, canonical] of Object.entries(CFP_PATCH_ALIASES)) {
    if (!(alias in next)) continue;
    if (!(canonical in next) && (typeof next[alias] === 'string' || typeof next[alias] === 'number')) {
      next[canonical] = String(next[alias]).trim();
    }
    delete next[alias];
  }
  return next;
}

/** Model puts slotId in patchJson; belongs in targetId for assignment_create. */
function sanitizeProposalPatch(
  targetType: string,
  targetId: string,
  patch: Record<string, unknown>
): { targetId: string; patch: Record<string, unknown> } {
  if (targetType !== 'assignment_create') return { targetId, patch };
  const next = { ...patch };
  const slotFromPatch = typeof next.slotId === 'string' ? next.slotId.trim() : '';
  delete next.slotId;
  if (slotFromPatch && (targetId === 'unscheduled' || !slotExists(targetId))) {
    return { targetId: slotFromPatch, patch: next };
  }
  return { targetId, patch: next };
}

/**
 * Seed schedules often have placeholder rows (generic title, no speaker).
 * assignment_create on occupied slot fails — rewrite to assignment update.
 */
function coercePlaceholderCreate(
  targetType: string,
  targetId: string,
  snapshot: Snapshot
): { targetType: 'assignment'; targetId: string } | null {
  if (targetType !== 'assignment_create' || targetId === 'unscheduled') return null;
  const occupant = snapshot.assignments.find((a) => a.slotId === targetId && a.status !== 'cancelled');
  if (!occupant || !isEmptyPlaceholder(occupant)) return null;
  return { targetType: 'assignment', targetId: occupant.id };
}

function validateProposalPatch(targetType: string, targetId: string, patch: Record<string, unknown>): string | null {
  if (targetType === 'assignment_create') {
    const invalid = Object.keys(patch).filter((k) => !ASSIGNMENT_CONTENT_KEYS.includes(k as typeof ASSIGNMENT_CONTENT_KEYS[number]));
    if (invalid.length) return `unsupported fields: ${invalid.join(', ')}`;
    if (!('title' in patch) && !('speakers' in patch)) return 'needs title or speakers';
    return null;
  }
  // ... assignment update, swap, speaker_create, etc.
  return null;
}

/** Parse model JSON proposals through the pipeline. */
function parseProposals(rawList: unknown[], snapshot: Snapshot): { kept: Proposal[]; dropped: string[] } {
  const kept: Proposal[] = [];
  const dropped: string[] = [];
  for (const raw of rawList) {
    let patch = normalizeCfpLinkPatch(raw.patch);
    let targetType = raw.targetType;
    let targetId = raw.targetId;
    const sanitized = sanitizeProposalPatch(targetType, targetId, patch);
    patch = sanitized.patch;
    targetId = sanitized.targetId;
    const coerced = coercePlaceholderCreate(targetType, targetId, snapshot);
    if (coerced) { targetType = coerced.targetType; targetId = coerced.targetId; }
    const err = validateProposalPatch(targetType, targetId, patch);
    if (err) { dropped.push(`${raw.summary}: ${err}`); continue; }
    kept.push({ targetType, targetId, summary: raw.summary, patch });
  }
  return { kept, dropped };
}

type Snapshot = { assignments: Array<{ id: string; slotId: string; status: string; speakerNames: string[] }> };
type Proposal = { targetType: string; targetId: string; summary: string; patch: Record<string, unknown> };
declare function slotExists(id: string): boolean;
declare function isEmptyPlaceholder(a: { speakerNames: string[] }): boolean;
