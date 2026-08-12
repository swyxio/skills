/**
 * Reference: functions/_lib/aiebot-store.ts
 *
 * Session memory must expose proposal outcomes — not just assistant prose —
 * so follow-ups do not treat unapplied drafts as real changes.
 */

const SESSION_CONTEXT_PREAMBLE = [
  '--- Conversation so far (for follow-ups) ---',
  'Schedule truth: only changes marked APPLIED below are on the schedule.',
  'DRAFT = proposed but not applied yet — do NOT assume it happened.',
  'IGNORED = the human rejected it — do NOT assume it happened.',
  'FAILED = Apply was attempted but rejected — canonical state did NOT change.',
  'If earlier prose claims a change but outcomes show DRAFT, IGNORED, or FAILED, the change did NOT happen.',
  ''
].join('\n');

export function formatProposalStatusLines(
  proposals: Array<{ summary: string; status: 'draft' | 'applied' | 'ignored' | 'failed'; failureReason?: string }>
): string {
  if (!proposals.length) return '';
  const lines = proposals.map((p) => {
    const label =
      p.status === 'applied' ? 'APPLIED — on schedule'
        : p.status === 'ignored' ? 'IGNORED — not on schedule'
          : p.status === 'failed' ? `FAILED — write rejected; not on schedule${p.failureReason ? ` (${p.failureReason})` : ''}`
          : 'DRAFT — pending human review, not on schedule yet';
    return `  • "${p.summary}" → ${label}`;
  });
  return `\n[Proposal outcomes (authoritative):]\n${lines.join('\n')}`;
}

export async function loadSessionContextNote(
  db: Db,
  sessionKey: string,
  limit = 8
): Promise<string | undefined> {
  const rows = await db.query(
    'SELECT role, text, proposal_set_id FROM messages WHERE session_key = ? ORDER BY created_at DESC LIMIT ?',
    sessionKey,
    limit
  );
  const messages = rows.reverse();
  if (!messages.length) return undefined;

  const lines: string[] = [];
  for (const message of messages) {
    const who = message.role === 'assistant' ? 'bot' : 'user';
    let line = `${who}: ${truncate(message.text, 500)}`;
    if (message.role === 'assistant' && message.proposal_set_id) {
      const proposals = await loadProposalsForSet(db, message.proposal_set_id);
      line += formatProposalStatusLines(proposals);
    }
    lines.push(line);
  }
  return `${SESSION_CONTEXT_PREAMBLE}${lines.join('\n')}\n--- end conversation ---`;
}

/** Called from Apply / Ignore / failure handlers — not from the planner. */
export async function recordSessionProposalResolution(
  db: Db,
  sessionKey: string,
  action: 'applied' | 'ignored' | 'failed',
  proposal: { summary: string },
  detail?: string
): Promise<void> {
  const text =
    action === 'applied'
      ? `[Human applied draft "${proposal.summary}"] — now on the canonical store${detail ? ` (${detail})` : ''}.`
      : action === 'ignored'
        ? `[Human ignored draft "${proposal.summary}"] — NOT applied; do not assume this change happened.`
        : `[Apply FAILED for "${proposal.summary}"] — write REJECTED${detail ? ` (${detail})` : ''}; canonical data NOT changed; diagnose before re-drafting.`;
  await db.insert('messages', { session_key: sessionKey, role: 'user', text, proposal_set_id: null });
}

/** Record failure before the handler returns or rethrows the write error. */
export async function applyWithFailureMemory(
  db: Db,
  sessionKey: string,
  proposal: { summary: string },
  apply: () => Promise<{ operationId: string }>
): Promise<void> {
  try {
    const result = await apply();
    await recordSessionProposalResolution(db, sessionKey, 'applied', proposal, result.operationId);
  } catch (error) {
    const reason = describeApplyFailure(error); // Bounded, user-safe; do not expose raw DB/provider errors.
    await recordSessionProposalResolution(db, sessionKey, 'failed', proposal, truncate(reason, 240));
    throw error;
  }
}

type Db = {
  query(sql: string, ...args: unknown[]): Promise<Array<{ role: string; text: string; proposal_set_id: string | null }>>;
  insert(table: string, row: unknown): Promise<void>;
};
declare function truncate(s: string, n: number): string;
declare function describeApplyFailure(error: unknown): string;
declare function loadProposalsForSet(db: Db, id: string): Promise<Array<{
  summary: string;
  status: 'draft' | 'applied' | 'ignored' | 'failed';
  failureReason?: string;
}>>;
