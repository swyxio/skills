---
name: cli-ux
description: Design, implement, or review a command-line interface when its user-facing command contract, interaction behavior, automation output, credentials, or mutation safety is the primary concern. For a bounded CLI mismatch or bug, apply only the relevant contract guidance; do not expand it into a full CLI or authentication redesign.
---

# CLI UX

Design one CLI with two deliberate modes:

- optimize interactive use for discoverability, concise defaults, and safe recovery;
- optimize automated use for predictability, bounded context, explicit contracts, and defense in depth.

Keep the CLI self-contained. Do not require an MCP server or companion agent skill. Make the installed CLI capable of describing and safely exercising its own exact-version contract.

Apply this skill proportionally. The requested CLI outcome and concrete risks
created by the changed command define the blocking criteria. The remaining
sections are design options and review lenses, not a demand to redesign every
CLI surface. Stop when the named contract is corrected and focused process or
contract tests prove it; report adjacent improvements as follow-ups.

## Define one typed command contract

For a new CLI or a command family whose contract is duplicated across surfaces,
prefer modeling each command once in a checked-in, versioned registry. Derive
these surfaces from it where practical:

- parsing and validation;
- human-readable help and examples;
- machine-readable `schema` or `describe` output;
- request construction;
- structured success and error output;
- tests.

Keep schema introspection deterministic and available offline. Include command names, inputs, types, constraints, defaults, conflicts, environment variables, output schemas, exit codes, side effects, and stability status. Do not let help text, validation, and machine schemas become independent sources of truth.

## Design the input graph before prompts

Classify inputs in dependency order:

1. execution mode: interactive TTY or non-interactive;
2. non-secret selectors and identity fields;
3. mutually exclusive or conditionally required fields;
4. local files, configuration, and expected-state constraints;
5. authorization and confirmation inputs;
6. secrets;
7. remote reads and external side effects.

Resolve and validate each layer before moving to the next. Never collect a secret only to report an earlier non-secret error.

For a login command accepting exactly one of `--username` or `--email`:

```text
parse flags
-> reject both username and email
-> if neither is present:
   interactive: ask for username or email
   non-interactive: fail with usage and remediation
-> normalize and validate the identity
-> only now prompt for the password
-> authenticate
```

Hard invariant:

> Never display `Password:` before the command knows which account is being authenticated.

Good:

```text
$ sf auth login
Username or email: user@example.com
Password: ********
```

Do not infer an identity from unrelated machine state unless documented as an explicit precedence rule.

## Support human flags and full-fidelity JSON

Offer ergonomic flags for common operations. For complex requests, also accept one raw JSON value or file that maps to the typed request model without losing nested or newly added API fields.

Use a shape such as:

```text
tool resource create --name demo --region iad
tool resource create --json request.json
```

Reject ambiguous combinations of raw JSON and request-building flags. Do not deep-merge them or invent hidden precedence. Validate both paths with the same schema and construct the same internal request type.

Do not accept passwords, tokens, or other secrets as ordinary command-line arguments when a safer prompt, stdin, environment, credential file, or credential-store path exists.

## Separate interactive and automated contracts

Use deterministic input precedence, normally:

```text
explicit flag > documented environment variable > stored non-secret preference > interactive prompt
```

Never prompt when stdout or stdin is non-interactive, when a machine-readable mode is selected, or when a no-input option is active. Fail before reading secret input if required non-secret inputs are missing.

Use human-readable output on an interactive TTY and stable JSON or NDJSON when output is piped. Provide explicit overrides such as `--output human|json|ndjson`; preserve compatibility before changing an existing command's default.

For machine-readable output:

- emit data only on stdout;
- emit diagnostics on stderr;
- never include terminal decoration or progress spinners;
- return documented nonzero exit codes;
- keep success and error envelopes schema-stable;
- include actionable remediation without exposing secrets.

## Bound output without hiding data

Protect both terminals and agent context windows:

- use bounded default page sizes;
- expose opaque continuation cursors;
- support field selection or projections for large resources;
- stream multi-page results as NDJSON where appropriate;
- report truncation and the continuation mechanism explicitly;
- never silently discard results.

Avoid fetching every page before emitting the first result. Ensure cancellation stops further requests and leaves stdout syntactically valid for the documented format.

## Separate human and agent authentication

Share authorization semantics while supporting distinct credential-acquisition paths:

- allow browser, password, device, or keychain flows for interactive humans as appropriate;
- allow narrowly scoped tokens, service identities, injected environment variables, credential files, or stdin for automation;
- never unexpectedly open a browser or prompt during automated execution;
- report credential source and effective scope without printing the credential;
- fail closed on expired, revoked, malformed, or insufficiently scoped credentials.

Request the least authority required for the selected command. Do not make a broad human session the implicit automation credential.

## Make authentication state obvious and portable

Treat authentication as a stateful workflow, not only a credential-acquisition prompt.

Before asking for an identity or password, perform a read-only current-session check when a stored credential is available. If the session is valid:

- say who is already authenticated, such as `Already logged in as alice.`;
- avoid prompts, network mutations, and needless credential replacement;
- exit successfully and expose `authenticated` plus `already_authenticated` in structured output;
- provide an explicit escape hatch such as `--force` or `--relogin` for intentional replacement;
- if an explicit identity was supplied and it differs from the current identity, continue through the normal login flow rather than silently switching accounts.

When a host keychain is invisible to a sandbox but the user and sandbox share a filesystem, make shared per-user storage the default for the sandbox-compatible path. Protect the directory and file (`0700`/`0600`), never print the bearer, record expiry metadata when available, and ignore expired or malformed entries. Keep host-only keychain storage as an explicit opt-in when it is appropriate.

Document and test a deterministic credential-read waterfall. A useful default is:

```text
process-scoped environment token
-> shared user credential file
-> host OS keychain
-> unauthenticated
```

Resolve the selected base URL before looking up origin-scoped credentials. Report the active source and server-confirmed identity without revealing the secret. Make logout clear every local store in the documented scope, while clearly stating that local deletion does not revoke a remote credential.

## Optional opportunity scan

For a CLI design or broad review, select the questions that can materially
affect the requested outcome. A one-line help mismatch, parser bug, or focused
output fix does not require this scan or adjacent auth, pagination, recovery,
portability, and accessibility work.

- **Already complete:** Can the command detect that the requested state already exists and say so instead of duplicating work?
- **Intent and defaults:** Are common safe actions concise, and are risky or scope-expanding choices explicit?
- **Preflight:** Can local validation, auth checks, target resolution, and confirmations happen before secrets or network mutations?
- **Recovery:** Does failure name the phase, explain whether retry is safe, and give one exact next command?
- **Idempotency:** Can interrupted or repeated commands resume or safely no-op using an idempotency key or expected-state fence?
- **State visibility:** Can users inspect current config, credential source, selected target, effective defaults, and progress without leaking secrets?
- **Output fit:** Does a human get a concise explanation while an agent gets stable JSON/NDJSON, documented fields, and useful exit codes?
- **Environment portability:** Does the command behave predictably across TTYs, CI, containers, sandboxes, operating systems, and missing optional integrations?
- **Discoverability:** Do help, examples, aliases, shell completion, and typo suggestions expose the canonical safe path?
- **Destructive actions:** Are previews, confirmations, dry runs, backups, and undo/revoke paths available in proportion to the risk?
- **Performance:** Is progress visible for slow work, are results bounded, and are cancellation and resume semantics clear?
- **Accessibility:** Does output remain legible without color, terminal control sequences, mouse interaction, or a particular shell?

Treat findings outside the requested contract as follow-up opportunities.
Implement one only when necessary for correctness or to mitigate a concrete
risk created by the current change. Test at the process boundary when the
change affects prompts, stdout/stderr, exit codes, or credential resolution.

## Use risk-triggered mutation controls

Before a destructive, costly, privilege-changing, or externally consequential
mutation, validate the locally knowable facts that can prevent the named harm:

- syntax, types, conflicts, and required inputs;
- local files and configuration;
- authentication identity and required scope;
- confirmation and non-interactive safety options;
- expected resource version or state;
- whether the requested operation is already complete.

Provide `--dry-run` when previewing the resolved target and effect materially
reduces mutation risk. Make it share parsing, normalization, local validation,
request construction, authorization planning, and output-shaping paths without
performing the mutation. Clearly distinguish locally proven checks from
server-dependent checks that were skipped. A harmless idempotent update does
not need a ceremonial dry run merely because it uses the network.

Use idempotency keys for retryable creates and expected-state or version fencing for destructive or concurrency-sensitive operations. Make retry safety explicit. Do not use universal interactive confirmations as a substitute for idempotency and preconditions.

## Defend against agent-shaped input mistakes

When a changed command accepts generated or otherwise untrusted identifiers and
path-like values, validate them before transport. Select adversarial cases that
match the accepted grammar and sink, such as:

- `..`, absolute paths, and separator confusion;
- control characters, newlines, NULs, and terminal escapes;
- leading hyphens and option injection;
- embedded `?`, `#`, `/`, and backslashes in identifiers;
- raw `%`, invalid escapes, and double encoding;
- Unicode normalization and confusable characters;
- oversized strings, arrays, and request bodies.

Reject invalid input locally with the field name, constraint, and safe retry shape. Do not silently strip or reinterpret suspicious characters. Encode individual path segments exactly once at the HTTP boundary; never interpolate unchecked identifiers into URLs or filesystem paths.

## Treat remote text as untrusted data

Assume resource names, descriptions, logs, errors, and fetched documents may contain prompt-injection text or terminal control sequences.

- keep data structurally separate from CLI guidance;
- escape or remove unsafe terminal control characters in human output;
- preserve raw values only in a documented structured field when required;
- offer bounded fields rather than dumping entire remote documents by default;
- support pluggable content scanning for high-risk applications without making an external sanitizer mandatory.

Never convert remote content into instructions or suggested commands without clearly labeling and validating it.

## Make errors local and actionable

Validate each input immediately after collection. State:

- what is wrong;
- which values or shapes are accepted;
- whether inputs conflict;
- the exact safe retry form.

Prefer:

```text
Error: choose one identity: --username NAME or --email ADDRESS.
Retry: sf auth login --email you@example.com
```

Avoid exposing secret values, dumping parser internals, or blaming the user for a prompt sequence chosen by the CLI.

## Test contracts, not only handlers

Choose the smallest boundary that proves the changed contract. Add unit,
transcript or PTY, schema, or end-to-end tests only as appropriate to that
change.

For interaction changes, exercise the relevant TTY and non-TTY process paths,
prompt order, secret redaction, and structured-output behavior. For machine
contract changes, prove agreement among the touched parser, help, schema,
request, output, and exit-code surfaces. Add pagination, dry-run, retry,
adversarial-input, or terminal-safety cases only when the changed command uses
those features or exposes those sinks.

## Selective review lens

Use only the items relevant to the requested command or review. An item becomes
blocking only when the current change would otherwise be incorrect, unsafe, or
unusable; unexplored items are not failed gates.

- Are the touched parsing, help, validation, introspection, and output surfaces consistent?
- Do interactive and automated paths preserve their documented prompt, stdout/stderr, and exit contracts?
- Are secret handling, target resolution, preflight, retry, and dry-run controls proportional to the changed command's risk?
- Are large or untrusted inputs bounded and rendered safely where the command accepts them?
- Does the focused test exercise the real process boundary when in-process tests cannot prove the behavior?
