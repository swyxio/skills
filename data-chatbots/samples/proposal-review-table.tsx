/** @jsxImportSource preact */
/**
 * Illustrative proposal-review state and bulk-apply table.
 *
 * Important properties:
 * - cards stay attached to their originating assistant turn;
 * - a global catalog merges by proposal id instead of replacing prior drafts;
 * - unchecked means skipped, not ignored;
 * - sequential bulk apply chains returned versions and records row errors;
 * - destructive drafts are not selected by default.
 *
 * Companion prose: ../proposal-review-ux.md
 */

import { useMemo, useState } from 'preact/hooks';

type Outcome = 'DRAFT' | 'APPLIED' | 'IGNORED' | 'FAILED';

type Proposal = {
  id: string;
  summary: string;
  targetType: string;
  targetId: string;
  patch: Record<string, unknown>;
  destructive: boolean;
  outcome: Outcome;
  error?: string;
};

type AssistantTurn = {
  id: string;
  text: string;
  proposalIds: string[];
};

export function mergeProposalCatalog(
  current: Record<string, Proposal>,
  incoming: Proposal[]
): Record<string, Proposal> {
  const next = { ...current };
  for (const proposal of incoming) {
    // A newly streamed copy must not resurrect an outcome already observed from
    // another tab or surface.
    const prior = next[proposal.id];
    next[proposal.id] = prior && prior.outcome !== 'DRAFT'
      ? { ...proposal, outcome: prior.outcome, error: prior.error }
      : { ...prior, ...proposal };
  }
  return next;
}

type ApplyResult = { outcome: 'APPLIED'; version: number };
type ApplyFailure = { outcome: 'FAILED'; error: string; currentVersion?: number };

export async function applySelectedSequentially(input: {
  proposals: Proposal[];
  selectedIds: Set<string>;
  startingVersion: number;
  applyOne: (proposal: Proposal, expectedVersion: number) => Promise<ApplyResult>;
  record: (proposalId: string, result: ApplyResult | ApplyFailure) => void;
  refreshVersion: () => Promise<number>;
}): Promise<{ applied: number; failed: number; finalVersion: number }> {
  let version = input.startingVersion;
  let applied = 0;
  let failed = 0;

  for (const proposal of input.proposals) {
    if (proposal.outcome !== 'DRAFT' || !input.selectedIds.has(proposal.id)) continue;

    try {
      const result = await input.applyOne(proposal, version);
      version = result.version; // Chain, never reuse the starting version.
      input.record(proposal.id, result);
      applied += 1;
    } catch (error) {
      const failure: ApplyFailure = {
        outcome: 'FAILED',
        error: error instanceof Error ? error.message : String(error)
      };
      input.record(proposal.id, failure); // Also persist FAILED in session state server-side.
      failed += 1;

      // Resynchronize before continuing. Continue only because this sample's
      // contract is explicitly partial/sequential, not atomic.
      version = await input.refreshVersion();
    }
  }

  return { applied, failed, finalVersion: version };
}

export function ProposalReviewTable(props: {
  turn: AssistantTurn;
  catalog: Record<string, Proposal>;
  currentVersion: number;
  applyOne: (proposal: Proposal, version: number) => Promise<ApplyResult>;
  ignoreOne: (proposalId: string) => Promise<void>;
  updateOutcome: (proposalId: string, outcome: Outcome, error?: string) => void;
  refreshVersion: () => Promise<number>;
  refreshCanonicalState: () => Promise<void>;
}) {
  const proposals = props.turn.proposalIds
    .map((id) => props.catalog[id])
    .filter((proposal): proposal is Proposal => Boolean(proposal));

  const defaultSelection = useMemo(
    () => new Set(proposals.filter((p) => p.outcome === 'DRAFT' && !p.destructive).map((p) => p.id)),
    [props.turn.id]
  );
  const [selected, setSelected] = useState(defaultSelection);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editedPatches, setEditedPatches] = useState<Record<string, string>>({});
  const [applying, setApplying] = useState(false);
  const [summary, setSummary] = useState('');

  const pending = proposals.filter((p) => p.outcome === 'DRAFT');
  const selectedPending = pending.filter((p) => selected.has(p.id));

  const toggleSelected = (id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const proposalForApply = (proposal: Proposal): Proposal => {
    const edited = editedPatches[proposal.id];
    if (!edited) return proposal;
    // Production UI should show schema errors before enabling Apply. The server
    // still normalizes, authorizes, validates, risk-checks, and dry-runs again.
    return { ...proposal, patch: JSON.parse(edited) as Record<string, unknown> };
  };

  const applySelected = async () => {
    setApplying(true);
    setSummary('');
    try {
      const result = await applySelectedSequentially({
        proposals: proposals.map(proposalForApply),
        selectedIds: selected,
        startingVersion: props.currentVersion,
        applyOne: props.applyOne,
        record: (id, outcome) => props.updateOutcome(id, outcome.outcome, 'error' in outcome ? outcome.error : undefined),
        refreshVersion: props.refreshVersion
      });
      await props.refreshCanonicalState(); // One full refresh after the loop.
      setSummary(`Applied ${result.applied} of ${result.applied + result.failed}; ${result.failed} need attention.`);
    } finally {
      setApplying(false);
    }
  };

  const ignoreProposal = async (proposalId: string) => {
    await props.ignoreOne(proposalId);
    props.updateOutcome(proposalId, 'IGNORED');
  };

  const applyOnly = async (proposal: Proposal) => {
    setApplying(true);
    try {
      const result = await props.applyOne(proposalForApply(proposal), props.currentVersion);
      props.updateOutcome(proposal.id, result.outcome);
      await props.refreshCanonicalState();
    } catch (error) {
      props.updateOutcome(
        proposal.id,
        'FAILED',
        error instanceof Error ? error.message : String(error)
      );
    } finally {
      setApplying(false);
    }
  };

  return (
    <section aria-label="Proposed changes">
      <p>{pending.length} pending changes — nothing updates until you click Apply.</p>
      <table>
        <thead>
          <tr><th>Select</th><th>Change</th><th>Status</th><th>Details</th></tr>
        </thead>
        <tbody>
          {proposals.map((proposal) => (
            <tr key={proposal.id}>
              <td>
                {proposal.outcome === 'DRAFT' && (
                  <input
                    type="checkbox"
                    aria-label={`Select ${proposal.summary}`}
                    checked={selected.has(proposal.id)}
                    onChange={() => toggleSelected(proposal.id)}
                  />
                )}
              </td>
              <td>
                {proposal.summary}
                {proposal.destructive && <strong> Destructive</strong>}
                {proposal.error && <p role="alert">{proposal.error}</p>}
              </td>
              <td>{proposal.outcome}</td>
              <td>
                <button
                  type="button"
                  aria-expanded={expanded.has(proposal.id)}
                  onClick={() => setExpanded((current) => {
                    const next = new Set(current);
                    if (next.has(proposal.id)) next.delete(proposal.id); else next.add(proposal.id);
                    return next;
                  })}
                >
                  Review
                </button>
                {expanded.has(proposal.id) && (
                  <div>
                    <code>{proposal.targetType}:{proposal.targetId}</code>
                    <textarea
                      aria-label={`Patch for ${proposal.summary}`}
                      value={editedPatches[proposal.id] ?? JSON.stringify(proposal.patch, null, 2)}
                      onInput={(event) => setEditedPatches((current) => ({
                        ...current,
                        [proposal.id]: event.currentTarget.value
                      }))}
                    />
                    {proposal.outcome === 'DRAFT' && (
                      <p>
                        <button type="button" disabled={applying} onClick={() => void applyOnly(proposal)}>
                          Apply just this
                        </button>
                        <button type="button" disabled={applying} onClick={() => void ignoreProposal(proposal.id)}>
                          Ignore
                        </button>
                      </p>
                    )}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" disabled={applying || selectedPending.length === 0} onClick={() => void applySelected()}>
        {applying ? 'Applying…' : `Apply ${selectedPending.length} selected`}
      </button>
      {summary && <p aria-live="polite">{summary}</p>}
    </section>
  );
}
