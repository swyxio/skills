# Slack adapter: inline controls and parity

Read this reference only when Slack is a requested copilot surface. Inline
flags are an adapter pattern for controls that Slack cannot conveniently render
as persistent web UI; they are not mandatory for web-only, email-only, or API
copilots.

The Slack adapter must call the same planner, validator, draft store, apply
path, authorization checks, and outcome recorder as every other surface.
Flags select capabilities; they do not create a second orchestration system.

## Inline controls

Choose the subset the product actually supports and document it in `!help`:

| Flag | Behavior | Why explicit |
|---|---|---|
| `!help` | Return a static capabilities guide without a planner call | Onboarding should be immediate and deterministic |
| `!model <slug>` | Select an allowed model/configuration for this run | Slack has no persistent model dropdown |
| `!advanced` | Enable the advanced operation schema and prompt | Keeps long-tail primitives out of the default planner vocabulary |
| `!audit [window]` | Enable scoped, read-only history access and prefetch | History is sensitive and token-heavy |
| `!mine` | Restrict audit results to the authenticated requester's actions | Requires adapter-side actor resolution |
| `!verbose` | Include expanded before/after detail in audit output | Prevents verbose history from consuming context by default |

Natural language such as “not by me” may become an adapter-owned audit filter
when the requester's verified identity is available. Never let the model invent
or override the authenticated actor filter.

## Parsing order

1. Preserve the raw text for help/empty-mention detection and security logging
   with appropriate redaction.
2. Parse only allowlisted flags and their bounded arguments.
3. Resolve model slugs through one registry shared by server and help output.
   Invalid values fall back safely; do not pass arbitrary model names through.
4. Resolve the mode and permissions. A flag cannot grant a capability the
   authenticated user lacks.
5. Strip recognized controls before persistence and planning so they do not
   become natural-language instructions.
6. If help was requested, return static blocks immediately and skip the model.
7. For audit mode, build history filters server-side and prefetch bounded data
   before the planner's first turn.
8. Call the shared orchestration core with clean text plus explicit structured
   options such as `{ mode, modelSlug, historyFilter }`.

The copyable parser shape is in
[samples/slack-inline-flags.ts](samples/slack-inline-flags.ts).

## Precedence and combinations

- An explicit valid `!model` may override the product's audit default; it must
  not override authorization or provider policy.
- `!audit` and `!advanced` should normally be mutually exclusive because one is
  read-only and one unlocks more writes. Reject or define deterministic
  precedence rather than silently combining contradictory schemas.
- `!mine` and `!verbose` have meaning only in audit mode. Either ignore them
  with a visible note or return usage guidance.
- Parse flags once. Every entry path—mention, DM, slash command, button
  callback, or retry—must reach the same normalized request contract.

Example:

```text
@copilot !audit 2d !mine summarize my schedule edits
```

After adapter parsing, the planner should receive clean user text such as
`summarize my schedule edits` plus a server-owned two-day actor filter. It
should not receive raw control tokens and decide what they mean itself.

## Web parity

| Slack control | Equivalent web control |
|---|---|
| `!model <slug>` | Model selector |
| `!advanced` | Advanced-mode checkbox or explicit workflow |
| `!audit` | History-access control |
| `!help` | Capabilities/examples panel |
| Selected-message or channel context | Explicit structured context shown near the composer |

Parity means identical capability and proposal semantics, not identical visual
controls. Slack approval buttons must resolve the same stored proposal IDs and
same authoritative outcomes as web cards.

## Help content

Build help output from registries where practical so it cannot drift from the
allowed modes and models. Include:

- what the copilot can read and propose;
- that proposed changes do not apply until approval;
- supported flags and short examples;
- available model labels without exposing provider secrets;
- how to approve, ignore, or inspect a proposal; and
- how audit access is scoped and authorized.

## Checks

Use §7 in [test-cases.md](test-cases.md) as the canonical acceptance scenarios.
In particular, prove that:

- `!help` and an empty mention bypass the planner;
- valid and invalid model slugs resolve predictably;
- audit data is prefetched and server-scoped;
- an explicit valid model has documented precedence over the audit default;
- flags are absent from persisted/planner text; and
- Slack approval and web approval converge on the same proposal and outcome.

Read [audit-log.md](audit-log.md) for long-running audit mechanics and the
repository's Slack bot skill for general signature verification, acknowledgments,
retries, and interactive-message handling.
