# Native UX decisions and pitfalls

Use for touched flows, not an app-wide audit.

## Information and disclosure

Prefer compact aligned rows over nested cards and repeated headings. A useful
communication row exposes source/title, relevant status or preview, and the next
action. Urgency, counts, due dates, and approvals need actual records or a supported
inference contract; generated mockups cannot establish them.

Show relevant reader content early. Newest-first can help conversational mail;
retain chronological reading where the task needs it. Summaries and truncation
need a direct route to originals, attachments, and source context.

Recommendations: filters in a sheet/menu with active scope visible; occasional
operations in labeled overflow; history/context on a named detail route;
provider diagnostics in settings details. Gesture shortcuts supplement a
discoverable essential action. Preserve account/workspace/navigation context
through loading, failure, permission, and recovery states.

## Search changes with native presentation

Search may collapse to a button, move, or change tab visibility by OS, device,
and window width. Exercise activation → typing → result → back → exit search →
switch destination when search/navigation changes. Phone and tablet may restore
activation differently after a reader or modal.

If native dismissal leaves navigation ambiguous, use an explicit exit tied to
the existing search state. Query retention follows the product contract.
SwiftUI's [presentation binding](https://developer.apple.com/documentation/swiftui/view/searchable%28text%3Aispresented%3Aplacement%3Aprompt%3A%29)
can make activation explicit; keep state owned by the searchable surface.

## Tablet composition

Adapt to actual width and input, including compact tablet windows. Use the
existing platform shell; sidebar/list-detail is useful when simultaneous context
helps the main loop, not mandatory for every screen. Limit prose measure and use
extra width for meaningful context rather than enlarged padding or every field.
Preserve selection, drafts, scroll, and routes across supported rotation/resizing.
Phone orientation remains a separate product choice.

Native tab/search chrome changes across releases; Apple's
[SwiftUI platform update](https://developer.apple.com/videos/play/wwdc2025/256/)
illustrates phone/tablet differences. Inspect the target OS rather than assuming
a remembered hierarchy or screenshot still applies.

## Density without inaccessible controls

Use semantic text styles; custom fonts should scale with their style
([Dynamic Type guidance](https://developer.apple.com/documentation/swiftui/applying-custom-fonts-to-text)).
At large text, horizontal action groups may need vertical composition. A small
icon can retain a larger hit region; roughly 44 × 44 iOS points is a useful
baseline, not a CSS-pixel conversion or screenshot measurement.

Check keyboard, home indicator, pinned bars, and the last content row: overlays
can obscure focused fields and Undo. Verify spoken labels and hit regions on
touched controls. Tablet keyboard/pointer shortcuts supplement touch access.

## Offline behavior

Cached reading is the default recommendation. Where the core task needs durable
local actions, distinguish saved/queued/confirmed/rejected state and verify
restart persistence plus rejection recovery. Reading a cache does not prove
writes synchronize. Scope caches to account/workspace and isolate fixtures.
