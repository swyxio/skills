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
  'If your earlier reply said "I moved/placed" but outcomes show DRAFT or IGNORED, the schedule was NOT changed.',
  ''
].join('\n');

export function formatProposalStatusLines(
  proposals: Array<{ summary: string; status: 'draft' | 'applied' | 'ignored' }>
): string {
  if (!proposals.length) return '';
  const lines = proposals.map((p) => {
    const label =
      p.status === 'applied' ? 'APPLIED — on schedule'
        : p.status === 'ignored' ? 'IGNORED — not on schedule'
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

/** Called from Apply / Ignore handlers — not from the planner. */
export async function recordSessionProposalResolution(
  db: Db,
  sessionKey: string,
  action: 'applied' | 'ignored',
  proposal: { summary: string },
  operationId?: string
): Promise<void> {
  const text =
    action === 'applied'
      ? `[Human applied draft "${proposal.summary}"] — now on the canonical store${operationId ? ` (${operationId})` : ''}.`
      : `[Human ignored draft "${proposal.summary}"] — NOT applied; do not assume this change happened.`;
  await db.insert('messages', { session_key: sessionKey, role: 'user', text, proposal_set_id: null });
}

type Db = {
  query(sql: string, ...args: unknown[]): Promise<Array<{ role: string; text: string; proposal_set_id: string | null }>>;
  insert(table: string, row: unknown): Promise<void>;
};
declare function truncate(s: string, n: number): string;
declare function loadProposalsForSet(db: Db, id: string): Promise<Array<{ summary: string; status: 'draft' | 'applied' | 'ignored' }>>;
