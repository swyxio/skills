# Unresolved choices

These are notes for relevant decisions, not gates or a questionnaire to run on
every task. Approved defaults are in [preferences](preferences.md); do not ask
for them again unless a product constraint creates a conflict.

## Batching cadence: user explicitly has no strong preference

Present the alternatives and let the user choose when cadence matters:

| Option | Tradeoff |
| --- | --- |
| Configurable rolling batches | Routine updates remain timely with fewer interruptions; interval and exceptions need a product choice. |
| Scheduled digests | Predictable quiet periods; routine information waits until the next digest. |
| In-app summary, no routine pushes | Least interruption; requires opening the app to catch up. |

No option is the personal default. Preserve an existing cadence during unrelated
fixes. Explain server scheduling versus best-effort device delivery before making
a timing promise.

## Ask only where the answer changes current work

- **Interactions:** swipe action versus reveal; Undo semantics; preserve or clear
  search on exit; resume destination versus home on launch.
- **Platform scope:** phone landscape, older OS/device support, Android plans,
  and supported tablet multitasking states.
- **Presentation:** system/custom theme, haptics/motion, navigation labels,
  and customization of secondary actions.
- **Data and delivery:** which private data/providers are allowed for AI;
  unread versus actionable badges; queued-action conflicts; USB/ad hoc/TestFlight/
  store delivery; release-specific accessibility acceptance.

Use the existing product contract where a new answer is unnecessary. Answers to
an app task do not automatically authorize unrelated skill edits.
