---
name: cli-ux
description: Design, implement, or review predictable human- and agent-friendly command-line interfaces, including state-aware no-op behavior, credential precedence and sandbox-compatible storage, argument parsing, interactive prompts, typed request schemas, JSON or NDJSON output, pagination, dry runs, mutation safety, exit behavior, help text, and terminal or automation tests.
---

# CLI UX

Design one CLI with two deliberate modes:

- optimize interactive use for discoverability, concise defaults, and safe recovery;
- optimize automated use for predictability, bounded context, explicit contracts, and defense in depth.

Keep the CLI self-contained. Do not require an MCP server or companion agent skill. Make the installed CLI capable of describing and safely exercising its own exact-version contract.

## Define one typed command contract

Model each command once in a checked-in, versioned registry. Derive these surfaces from it where practical:

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

## Scan for UX improvements before implementation

For every CLI change, look for opportunities to reduce surprise, repeated work, and unsafe recovery. At minimum, check:

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

Prefer small state-aware improvements that make the next invocation safer and clearer. Add the behavior to the typed command contract and test it at the process boundary when it changes prompts, stdout/stderr, exit codes, or credential resolution.

## Keep mutations behind complete preflight

Before a network mutation, validate all locally knowable facts:

- syntax, types, conflicts, and required inputs;
- local files and configuration;
- authentication identity and required scope;
- confirmation and non-interactive safety options;
- expected resource version or state;
- whether the requested operation is already complete.

Provide `--dry-run` for mutations. Make it execute the same parsing, normalization, local validation, request construction, authorization planning, and output-shaping paths without performing the mutation. Clearly distinguish locally proven checks from server-dependent checks that were skipped.

Use idempotency keys for retryable creates and expected-state or version fencing for destructive or concurrency-sensitive operations. Make retry safety explicit. Do not use universal interactive confirmations as a substitute for idempotency and preconditions.

## Defend against agent-shaped input mistakes

Treat generated input as untrusted even when it is syntactically plausible. Validate identifiers and path-like values before transport. Test at least:

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

Add unit, transcript or PTY, schema, and end-to-end tests as appropriate.

Cover interaction behavior:

1. supplied identity -> password is the first interactive prompt;
2. missing identity in a TTY -> identity precedes password;
3. missing identity without a TTY -> fail without prompting or reading a password;
4. conflicting or malformed identity -> fail before prompting for a password;
5. authentication failure -> never echo the secret;
6. piped or explicitly structured output -> never prompt and always emit valid structured output.

Cover machine contracts:

1. flags and raw JSON produce the same typed request;
2. mixing raw JSON with request flags is rejected;
3. help, parser behavior, and `schema` or `describe` agree;
4. JSON and NDJSON validate against their published schemas;
5. pagination, projections, truncation notices, and cancellation behave deterministically;
6. dry runs perform no mutations and label server-dependent checks accurately;
7. interrupted retries remain idempotent or fail on an explicit state fence;
8. hostile identifiers and control characters fail closed;
9. remote text cannot emit active terminal escapes or masquerade as CLI instructions;
10. TTY and non-TTY detection is exercised using real process boundaries, not only mocked handlers.

## Review checklist

- Does one typed registry drive parsing, help, validation, and introspection?
- Can the installed CLI describe its exact contract offline?
- Are common flags ergonomic and complex requests representable as full-fidelity JSON?
- Are ambiguous input combinations rejected?
- Are non-secret prerequisites validated before secrets?
- Can automated execution complete without prompts, browsers, or shared human sessions?
- Are stdout, stderr, output schemas, and exit codes stable?
- Are large results bounded, projectable, pageable, and never silently truncated?
- Does every mutation support meaningful preflight and dry-run behavior?
- Are retries idempotent or protected by expected-state fencing?
- Are identifiers encoded once at the transport boundary and tested adversarially?
- Is remote text rendered as untrusted data?
- Do transcript and end-to-end tests exercise actual process behavior?
- Does `--help` match the parser and machine-readable schema?
