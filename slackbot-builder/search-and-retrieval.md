# Slack search and retrieval

Read this for Slack message/file search, PDF or attachment discovery, citations,
search-query construction, retrieval follow-ups, and claims about what the bot
searched. Do not load L4/L5 or durable-ingress guidance unless the change also
alters those systems.

## Keep retrieval in the shared core

Keep the Slack event handler thin. Pass verified requester identity, signed
search authority, current text, causal thread context, and channel/thread
coordinates into a bounded retrieval function in the channel-neutral core.
Return normalized evidence for the renderer and planner.

Treat source ACLs as authoritative. Search with the requester's delegated scope;
do not interpret connector readability as broader visibility. Keep raw private
results transient and avoid logging document bodies or provider payloads.

## Preserve intent across follow-ups

Build the retrieval request from the current message plus the smallest causal
antecedent that supplies missing intent. A terse correction such as "it's a PDF"
must refine the prior request, not replace it.

Separate:

- the user's semantic intent and nouns;
- requested file/type constraints;
- explicit channel, sender, and date constraints;
- inferred query expansions.

Do not add current-channel or narrow date filters unless the user requested them
or the surrounding workflow clearly requires them. Words such as "past" usually
mean broad historical lookup, not a one-day window.

## Construct bounded, search-native queries

Use Slack's explicit filters when relevant: `type:pdf`, `has:file`, `from:`,
`in:`, `before:`, and `after:`. Preserve the strongest domain terms from the
thread. Avoid pseudo-filenames unless the user supplied one.

Slack keyword search is conjunctive. Do not pack several synonyms into one query
and expect semantic expansion. Issue a small, deterministic set of alternatives
instead. For example, "find past sales brochures" followed by "it's a PDF" can
produce `sales brochure type:pdf` and `sponsor prospectus type:pdf`.

Bound query count and result count. Prefer two or three high-signal queries over
an unbounded model-generated list. Deduplicate normalized results by stable file
or message ID.

Start topic discovery with one broad, high-recall query, then narrow only when
the refinement can retrieve materially different evidence. Do not spend the
entire budget on near-duplicate exact-phrase permutations. Apostrophes, naming
variants, and over-constrained conjunctions can turn a well-intended query into
a false zero-result answer.

Treat Slack's result count as retrieval metadata, not an analytical count.
Search may stem or fuzz terms, results can include bots and quoted history, and
several hits may belong to one thread. Inspect the returned messages before
classifying them as decisions, commitments, blockers, or current state.

## Reconcile Slack intent with current state

For a mixed-source request, Slack usually supplies intent, decisions, and
institutional memory; a deterministic application or provider lookup should
supply current state. Keep those evidence classes separate in the answer.

When the user explicitly requests multiple authorized sources or capabilities:

- reserve lookup budget for every named source and prefer one combined lookup
  turn;
- do not finalize merely because one source returned zero results;
- execute each required lookup, or mark that source unavailable with the exact
  failure;
- prevent the model from silently omitting an explicit deterministic lookup;
- compare only Slack claims backed by returned permalinks against current data;
- say when no Slack claim can be matched rather than inventing a comparison.

For decisions, blockers, commitments, and launch status, follow the result into
its thread and look for later causal replies that supersede or resolve the first
hit. Prefer the newest supported state while retaining the earlier message only
as history. Prospecting, hypotheticals, and requests are not commitments.

## Ground-truth retrieval behavior

When changing an existing Slack retrieval path, test the deployed behavior in
the authenticated Slack instance after deterministic unit coverage. Use a
clearly labeled, non-mutating prompt, inspect the exact queries and visible
answer, and independently perform a bounded search through the same requester's
real Slack UI when connector behavior is in doubt. This ground-truth comparison
can reveal over-constrained queries, hidden stemming, stale-thread errors, or a
tool path the model skipped. Do not copy private result bodies into fixtures,
durable artifacts, ordinary logs, or public bug reports.

## Normalize and ground results

Request file content types when files are in scope. Preserve the stable ID,
title, file type, permalink, channel/thread reference, timestamp, and visibility
metadata actually returned. Do not infer missing owner or permission fields.

Maintain an in-memory evidence ledger containing each exact executed query,
provider outcome, result count, and normalized result IDs. Render citations from
that ledger. If no authorized result was returned, say which bounded queries ran
and describe coverage as limited; never claim Slack was exhaustively searched.

For mixed-source answers, extend the ledger across capability families. Record
which lookup produced each factual field and render a compact distinction such
as “Slack-stated target” versus “observed provider value.” Never collapse a
message assertion and current provider state into one unlabeled fact.

Never let the model claim it searched Slack when no Slack call executed. Enforce
this in code, not only in the prompt. Likewise, do not let it list six attempted
queries when the execution budget allowed only three.

## Deterministic trigger, model-assisted ranking

Trigger retrieval deterministically for explicit lookup language, attachment or
file-format terms, and causal corrections such as PDF/deck/brochure/prospectus.
Use the model to rank or summarize retrieved evidence, not to decide whether an
obvious file search happens at all.

## Regression tests

Cover at least:

- file results are requested and normalized with working permalinks;
- an initial brochure/prospectus request emits file-aware queries;
- a terse PDF follow-up retains the root intent;
- broad historical lookup does not gain a current-channel or one-day scope;
- query and result budgets are enforced and duplicates collapse;
- answers cite returned files;
- zero-result answers report exact executed coverage;
- no-search paths cannot claim that Slack was searched;
- requester-scoped/private results do not leak into public delivery or logs.
- a mixed-source request still runs its explicit deterministic lookup when
  Slack returns zero results;
- near-duplicate Slack variants cannot consume the budget reserved for another
  explicitly requested capability;
- later thread replies can supersede an earlier decision or blocker;
- ground-truth UI searches and bot-executed queries use the same requester and
  disclose their different coverage honestly.
