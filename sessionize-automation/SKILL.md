---
name: sessionize-automation
description: |
  Use when inspecting or automating authenticated Sessionize organizer workflows, especially bulk session status changes, proposal accept/decline staging, speaker/session invite flows, hidden form submit paths, anti-forgery tokens, nested NewSpeakers fields, and verification after private organizer UI writes.
---

# Sessionize Automation

Use this skill for Sessionize organizer tasks where there is no supported public
API and the useful write surface is the authenticated web app.

## When To Use

- Bulk accept, decline, waitlist, queue, or nomination status changes.
- Tracing Sessionize organizer pages to discover private form or XHR endpoints.
- Automating speaker/session invite flows that only exist in the logged-in UI.
- Reconciling local review decisions against Sessionize session IDs.
- Verifying that Sessionize-side counters and row states changed correctly.

Do not claim Sessionize has an official organizer API unless you have verified a
current official API surface for the exact operation.

## Prerequisites

- Use Chrome control when the task depends on the user's logged-in Sessionize
  organizer state.
- Claim an existing Sessionize tab when available instead of reloading it.
- Use Browser only as a fallback for non-authenticated inspection or screenshots.
- Identify the event ID and the authoritative local source of truth before any
  write.
- Map local records to Sessionize IDs. For
  `/Users/swyx/Work/aiewf2026speakerenrichment`, use `External Session ID`.

## Browser Automation Constraints

Chrome/Browser Playwright `evaluate(...)` in Codex can read DOM state, but in
prior Sessionize runs it could not access:

- page globals such as `vm`, `$`, or `jQuery`
- `fetch`
- `XMLHttpRequest`
- `javascript:` URL execution

Do not spend time trying to route around those limits. If fast same-origin POSTs
are needed, generate a dry-run-first page-console runner for the user to paste
into the actual Sessionize page console, or use visible page controls through
Chrome automation.

## Discovery Workflow

1. Capture the current URL, title, and visible Sessionize counters.
2. Inspect DOM structure for stable IDs and controls. Hidden controls are usually
   more stable than visual dropdown text.
3. Inspect inline page scripts for endpoints, payload names, status enums, and
   modal/bulk action handlers.
4. Prefer no-op probes or read-only extraction before writes.
5. If writes are needed, start with a tiny batch and verify before scaling.
6. Immediately before the first status change or form submission, obtain the
   browser action confirmation required for the exact Sessionize account,
   operation, target count, and status. One confirmation can cover the bounded
   batch; expanding the target set or changing finality requires a new one.

Useful DOM reads for session status pages:

```js
[...document.querySelectorAll('a[href^="#s="]')]
  .map(a => (a.innerText || '').replace(/\s+/g, ' ').trim())

[...document.querySelectorAll('select[data-id]')]
  .filter(s => s.value && s.getAttribute('data-id'))
  .map(s => ({ id: s.getAttribute('data-id'), value: s.value }))
```

## Known Session Status Contract

On the organizer sessions page, status controls were observed as hidden
`select[data-id="<Sessionize session id>"]` elements wrapped by Selectize UI.

For event `24196`, individual row status changes posted:

```text
POST /app/organizer/session/setStatus
id=<Sessionize session id>&status=<status code>
```

Observed status codes:

| Code | Meaning |
|------|---------|
| `0` | Accepted |
| `2` | Waitlisted |
| `5` | Accept Queue |
| `10` | Nominated |
| `15` | Decline Queue |
| `20` | Declined |

For rejection staging, prefer `15` (`Decline Queue`) unless the user explicitly
asks for final `20` (`Declined`).

## Bulk Status Workflow

1. Identify the local target set and status code.
2. Confirm target IDs are unique and nonblank.
3. Generate per-run artifacts outside commits unless the user asks otherwise.
4. Capture Sessionize baseline counters.
5. Run a small batch first, usually 3 to 21 items.
6. Verify row controls and counters moved by exactly the batch size.
7. Continue with explicit offsets and batch sizes.
8. Keep a short run log: start offset, limit, successes, failures, before/after
   counters.

In `/Users/swyx/Work/aiewf2026speakerenrichment`, generate Sessionize denial
targets from `overrides.json` plus source decisions:

```bash
python3 scripts/sessionize_rejection_targets.py
```

This writes ignored artifacts:

- `sessionize-deny-targets.json`
- `sessionize-bulk-status-runner.js`

The generated runner defaults to `15` (`Decline Queue`).

## Visible UI Control Path

Use this for tiny batches or when page-console execution is unavailable.

For each target row, click:

```text
select[data-id="<id>"] + .selectize-control .selectize-input
```

then click:

```text
select[data-id="<id>"] + .selectize-control .selectize-dropdown .option[data-value="15"]
```

After each click, verify:

```js
document.querySelector('select[data-id="<id>"]')?.value === '15'
```

For sparse target rows, use Sessionize's own URL hash search with the exact
session title, then update one matching ID:

```text
https://sessionize.com/app/organizer/sessions/<event-id>#q=<encoded title>&o=DateDesc
```

## Page-Console Runner Path

Use this for larger batches when the user can paste JavaScript into the actual
Sessionize page console.

The runner should:

- refuse to run unless it is on `sessionize.com`
- refuse to run unless the organizer path includes the expected event ID
- print a dry-run table immediately
- expose an explicit function such as `window.sessionizeBulkStatusRun()`
- accept `{ limit, startAt, delayMs }` options
- stop on first failed response
- preserve partial results on `window`
- log progress every 25 items

Example execution:

```js
await window.sessionizeBulkStatusRun({ limit: 3 })
await window.sessionizeBulkStatusRun({ startAt: 3, limit: 18 })
await window.sessionizeBulkStatusRun()
```

## Form Automation Notes

For Sessionize session edit/invite forms, prior organizer inspection found that
the useful write surface may be a normal authenticated form with:

- anti-forgery token fields such as `__RequestVerificationToken`
- nested speaker fields such as `NewSpeakers[...]`
- invite-related fields such as `InviteEmail` and `HasNoInvite`
- speaker link arrays such as `SpeakerLinks[n].Type` and `SpeakerLinks[n].Url`

When automating forms:

1. Load the edit form through the authenticated browser.
2. Extract hidden inputs and all named fields before designing the payload.
3. Preserve anti-forgery tokens and unrelated existing fields.
4. Submit one dry-run or harmless test record first where possible.
5. Re-open the affected Sessionize page and verify the rendered result.

## Verification Checklist

- Confirm local target count from the source of truth, not a stale export.
- Confirm status code and staging/final intent.
- Capture before/after Sessionize counters.
- Confirm no visible toasts or console errors after the first write.
- For UI-driven batches, verify every changed hidden select has the intended
  value.
- For page-console runners, inspect returned results and failed response text.
- Keep the Chrome tab as `handoff` if the user will continue from the live page.

## Process Lessons

- DOM plus page script snippets beat screenshots for discovering automation
  contracts.
- Hidden `select[data-id]` controls were stable for status changes.
- Top counters may lag after one row, but should update after a real batch.
- Current filters can hide most target rows; switch to exact title searches when
  the visible list is exhausted.
- Curated/generated CSVs can lag live review state; recompute effective decisions
  from source export plus overrides before acting.
