---
name: design-preferences
description: "Apply swyx's design preferences when building or changing app screens, or designing, restyling, or reviewing websites: reuse shared app layouts, preserve information density, use readable typography, avoid decorative card accent strips, and give brand color a clear purpose. Use alongside task-specific design workflows."
---

# Design preferences

These are the user's defaults, not universal design rules. Follow an explicit visual reference or request when it overrides them. Apply them to the requested surface; do not expand a small task into a site redesign.

- **No decorative thin accent strips on cards.** Avoid colored or gradient top borders, ribbons, and `::before` lines added just to make repeated panels look designed. Functional table rules, chart marks, focus rings, and active-navigation indicators are fine.
- **Choose the layout for the information.** Use aligned rows or tables for repeated comparisons, and place a finding beside its evidence. Use cards when items genuinely form independent units, not as the automatic wrapper for every paragraph or statistic. Avoid nested cards.
- **Density comes from composition, not tiny text.** Start around 17–18px for reading text on desktop and 16–17px on mobile. Keep secondary labels legible. Shorten repetitive copy, align related facts, and reduce container padding before shrinking type. Recompose mobile comparisons rather than scaling down a desktop table.
- **Make whitespace earn its place.** Use space to distinguish sections and establish hierarchy. Avoid oversized introductory regions, tall rows around two numbers, and equal-height panels full of emptiness. Put repeated caveats once at the relevant section level while retaining essential denominators beside the data.
- **Use brand color confidently and purposefully.** Prefer meaningful series colors, selected states, or a substantial focal region over ornamental gradients repeated everywhere. Preserve strong text contrast on colored surfaces. Follow the actual brand assets and palette; do not invent a substitute logo. A dark masthead and a broad gradient can work when appropriate, but are not mandatory.

## Shared application layout

- **Signed-in pages inherit the shared app shell.** Reuse the existing navigation, account controls, and workspace switcher where the app has one. Include workspace selection, settings, creation/editing, and detail pages; do not build detached page-specific chrome. The shell must also work before a workspace is selected.
- **Keep context through every state.** Loading, empty, error, expired-session, and permission states retain applicable navigation and account or sign-in controls, with useful recovery actions. A missing workspace must not strand the user without a way to switch accounts or sign out.
- **Recompose navigation on mobile.** Preserve access to the same destinations and account controls through the app's existing drawer or equivalent; hiding the desktop sidebar alone is insufficient.
- **Make exceptions deliberate.** Fullscreen/focus views have an explicit, reachable exit in success and failure states. Public sharing, signing, and review pages use a consistent public header with Sign in or Open app as appropriate; they remain usable without an account and do not expose private navigation.
- **Check route coverage, not just the screenshot.** For a new or changed screen, verify direct URL entry and adjacent navigation inherit the intended layout. For an app-wide audit or redesign, inventory active screen routes, identify shell exceptions, and distinguish intentional public/focus views from accidental omissions. Report unrelated gaps without expanding a bounded task.

Before finishing, inspect the rendered result at desktop and phone sizes: verify shared navigation and account access, remove decorative card strips, identify wasted space, check the smallest meaningful text, and confirm that evidence and existing actions remain reachable. Do not claim visual quality from a successful build alone. Do not add a design approval gate unless the user's request or another applicable workflow requires one.
