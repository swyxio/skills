/**
 * Reference: functions/_lib/aiebot.ts (aiewf2026-internal-schedule)
 *
 * Single orchestration path: plan → validate → dry-run cumulatively → persist
 * draft proposal set. Apply is a separate human-triggered path.
 */

// --- runAiebotQuery (core flow) ---

async function runDataChatbotQuery(env: Env, user: User, input: QueryInput): Promise<QueryResult> {
  const snapshot = await getCanonicalSnapshot(env);

  const planner = await runPlanner(env, {
    message: input.message,
    snapshot,
    contextNote: input.contextNote ?? (await loadSessionContextNote(env, input.sessionKey))
  });

  // Cumulative dry-run: advance in-memory snapshot so proposal 2 sees proposal 1
  const { kept, dropped: dryRunDropped } = dryRunProposals(snapshot, planner.proposals, user);
  const validationDropped = planner.metadata.droppedProposals ?? [];
  const dropped = [...validationDropped, ...dryRunDropped];
  const answer = dropped.length ? appendDroppedNote(planner.answer, dropped) : planner.answer;

  const proposalSet = await createProposalSet(env, user, {
    message: input.message,
    answer,
    proposals: kept,
    metadata: { ...planner.metadata, ...(dropped.length ? { droppedProposals: dropped } : {}) }
  });

  if (input.sessionKey) {
    await recordSessionTurn(env, input.sessionKey, {
      userText: input.message,
      assistantText: answer,
      proposalSetId: proposalSet.id
    });
  }

  return { proposalSetId: proposalSet.id, answer, proposals: proposalSet.proposals, dropped };
}

// --- dryRunProposals: sequential simulation ---

function dryRunProposals(
  snapshot: Snapshot,
  proposals: DraftProposal[],
  user: User
): { kept: DraftProposal[]; dropped: Array<{ summary: string; reason: string }> } {
  const kept: DraftProposal[] = [];
  const dropped: Array<{ summary: string; reason: string }> = [];
  let working = snapshot;

  for (const proposal of proposals) {
    try {
      const body = proposalToOperationBody(proposal.targetType, proposal.targetId, proposal.patch, working);
      const operation = normalizeOperation({ ...body, expectedVersion: working.version }, user);
      const result = applyOperationInMemory(working, operation);
      if (!result.ok) {
        dropped.push({ summary: proposal.summary, reason: result.conflict.message });
        continue;
      }
      working = result.snapshot; // next proposal sees prior drafts in this batch
      kept.push(proposal);
    } catch (error) {
      dropped.push({ summary: proposal.summary, reason: String(error) });
    }
  }
  return { kept, dropped };
}

function appendDroppedNote(answer: string, dropped: Array<{ summary: string; reason: string }>): string {
  const lines = dropped.map((d) => `• ${d.summary} — ${d.reason}`).join('\n');
  return `${answer}\n\n_⚠️ I could NOT draft ${dropped.length} change(s):_\n${lines}`;
}

// --- applyProposalById: same pipeline as manual UI edits ---

async function applyProposalById(env: Env, user: User, id: string, options: ApplyOptions) {
  const proposal = await getProposal(env, id);
  if (proposal.status !== 'draft') throw conflict('proposal_not_draft');

  const snapshot = await getCanonicalSnapshot(env);
  const patch = options.patch ?? proposal.patch;
  const operation = normalizeOperation({
    ...proposalToOperationBody(proposal.targetType, proposal.targetId, patch, snapshot),
    expectedVersion: options.expectedVersion ?? snapshot.version,
    reason: `Apply AI proposal ${proposal.id}`
  }, user);

  const result = await applyOperationToStore(env, user, operation);
  await updateProposalStatus(env, proposal.id, 'applied', result.operationId);

  const sessionKey = options.sessionKey ?? await findSessionKeyForProposalSet(env, proposal.proposalSetId);
  if (sessionKey) await recordSessionProposalResolution(env, sessionKey, 'applied', proposal);

  return { proposal: { ...proposal, status: 'applied' }, result };
}

// --- types abbreviated ---
type Env = unknown;
type User = unknown;
type Snapshot = { version: number };
type DraftProposal = { targetType: string; targetId: string; summary: string; patch: Record<string, unknown> };
type QueryInput = { message: string; sessionKey?: string; contextNote?: string };
type QueryResult = { proposalSetId: string; answer: string; proposals: unknown[]; dropped: unknown[] };
type ApplyOptions = { patch?: Record<string, unknown>; expectedVersion?: number; sessionKey?: string };

declare function getCanonicalSnapshot(env: Env): Promise<Snapshot>;
declare function runPlanner(env: Env, input: unknown): Promise<{ proposals: DraftProposal[]; answer: string; metadata: { droppedProposals?: unknown[] } }>;
declare function loadSessionContextNote(env: Env, key?: string): Promise<string | undefined>;
declare function createProposalSet(env: Env, user: User, input: unknown): Promise<{ id: string; proposals: unknown[] }>;
declare function recordSessionTurn(env: Env, key: string, turn: unknown): Promise<void>;
declare function proposalToOperationBody(t: string, id: string, patch: Record<string, unknown>, s: Snapshot): Record<string, unknown>;
declare function normalizeOperation(body: Record<string, unknown>, user: User): unknown;
declare function applyOperationInMemory(s: Snapshot, op: unknown): { ok: true; snapshot: Snapshot } | { ok: false; conflict: { message: string } };
declare function getProposal(env: Env, id: string): Promise<{ id: string; status: string; proposalSetId: string; targetType: string; targetId: string; patch: Record<string, unknown> }>;
declare function applyOperationToStore(env: Env, user: User, op: unknown): Promise<{ operationId: string }>;
declare function updateProposalStatus(env: Env, id: string, status: string, operationId?: string): Promise<void>;
declare function findSessionKeyForProposalSet(env: Env, proposalSetId: string): Promise<string | null>;
declare function recordSessionProposalResolution(env: Env, key: string, action: string, proposal: unknown): Promise<void>;
declare function conflict(code: string): never;
