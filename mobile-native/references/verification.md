# Native verification

Use focused checks selected by the change. Physical-device checks matter for
relevant OS/hardware behavior or explicit requests; a small UI edit does not
require the full matrix below.

## Evidence boundaries

- Simulator interactions establish the exercised simulator/OS flow, not device
  signing, biometrics, hardware behavior, or APNs receipt.
- Install, ordinary launch, and UI automation are separate results; see
  [delivery](ios-ipados-delivery.md).
- Fixtures establish controlled logic/display/navigation, not live classification,
  AI generation, account mutation, or remote delivery.
- Transport acceptance is not observed device presentation; provider readback
  establishes only the operation represented by that receipt.
- Report functional passes, unresolved findings, and unavailable states separately.

Select affected conditions: relevant widths/rotation, long or empty content,
large text, keyboard/pinned bars, search/back/exit, and recovery or persistence
when touched. Do not populate fake approvals/accounts just to complete a matrix.

## Entry-point loading and recovery

For touched notifications, deep links, widgets, or shortcuts, select focused
cases from the following:

- Open before sync, with no cached record: available preview or loading appears
  immediately, exit works, and raw storage errors are not exposed.
- Open a cached conversation missing the notified message: old history remains
  readable, the new message is visibly pending, and its actions wait for exact
  account/record readiness.
- Cold launch or denied/missed background execution: opening still initiates
  loading independently of prefetch.
- Offline, slow response, failed fetch, Retry, and connectivity recovery: context
  survives, retries are bounded/coalesced, and later arrival updates an open
  reader without reopening it or requiring another tap.
- Rapid taps, dismissal, a different destination, and account/workspace switch:
  delayed results cannot show the wrong record or overwrite newer navigation.
- Receipt and tap overlap: alert presentation is not held for download, existing
  sync ownership is respected, and prefetch performs no read-state/mail mutation.

Use isolated fixtures to prove loading, identity, cancellation, and recovery.
Verify relevant platform notification/background behavior on a physical device
when making those claims; unit/simulator passes do not establish APNs arrival or
an OS-granted background execution window. Record whether prefetch was observed,
tap loading worked without it, and authoritative content became usable.

## XCTest pitfalls

Inspect the current hierarchy: tablet tabs may be nested buttons outside
`app.tabBars`; idle search may expose a button rather than a text field.
Use app-owned accessibility identifiers and record IDs for repeated labels.
Ground native-chrome queries in the observed hierarchy. `firstMatch` is justified
only when duplicate matches are understood.

After a pop, native chrome can hide a title; a unique body marker may better
assert the destination. Do not replace it with an element shared by wrong screens.
Phone/tablet dismissal differences can justify conditional interaction followed
by the same meaningful assertion, never silently skipping a required feature.

Use isolated fixture/cache identities. For persistence changes, edit/Undo and
terminate/relaunch against that same cache. Do not clear real app data or report
a simulator substitute as a completed physical run.

## Accessibility findings

Capture audit description, screen/state, and hierarchy. An associated
[audit element](https://developer.apple.com/documentation/xcuiautomation/xcuiaccessibilityauditissue)
may fail to resolve. Equal warning and tab counts do not prove system-tab false
positives. Keep the finding unresolved until identified.

Manual large-text/hit-region checks establish those controls' behavior; they do
not clear unrelated automated warnings. A narrow tool exclusion needs identified
elements, an explanation/evidence, and a meaningful alternative check. Do not
disable the audit to make output green. Inaccessible required content, controls,
or recovery in the touched flow prevent calling it usable; an unresolved audit
is reported rather than automatically becoming an app-wide release gate.

## Results and screenshots

Read completed test status before exporting evidence. An in-progress `.xcresult`
may lack final `Info.plist`. Use unique run paths and match attachment manifests
to test/device/time. Installed tool help determines supported commands:

```sh
xcrun xcresulttool get test-results summary --path /absolute/path/Run.xcresult
xcrun xcresulttool export attachments --path /absolute/path/Run.xcresult --output-path /absolute/path/captures
```

Before/after claims need comparable dimensions, OS, appearance, text size,
content, scroll, and expanded state. Native screenshots can carry orientation
metadata; renderers may rotate/pad differently. Check dimensions, metadata, and
actual screen state before diagnosing black padding. Label transformed review
images and retain originals; mockups are not acceptance captures.

Keep private captures/account data out of committed assets unless authorized.
Record the tested device/OS/artifact, fixture versus live conditions, completed
flows, remaining findings, and actual delivery state in the project's QA record.
Stop when the requested outcome and change-created risks have sufficient evidence;
broaden checks only for new failures, changes, or unresolved relevant concerns.
