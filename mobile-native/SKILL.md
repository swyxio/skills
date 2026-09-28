---
name: mobile-native
description: "Apply swyx's native mobile UX preferences when designing or critiquing iPhone/iPad flows, adapting tablet layouts, or choosing communication-app notification behavior. Also use for iOS/iPadOS generated build configuration, signing/install/launch problems, and device playtesting. Keep existing native or cross-platform stacks; excludes browser-only responsive work and backend-only changes without native UX or delivery implications."
---

# Mobile Native

Native UX, implementation pitfalls, delivery, and playtesting belong together.
Platform operations here cover iOS/iPadOS; Android procedures are not established.

## Selective references

- UI/product choices: [preferences](references/preferences.md) and
  [native UX](references/native-ux.md). General aesthetics live in
  [design-preferences](../design-preferences/SKILL.md).
- Generated configuration, signing, install, launch:
  [iOS/iPadOS delivery](references/ios-ipados-delivery.md).
- Device QA, XCTest, accessibility findings, screenshots:
  [verification](references/verification.md).
- Importance, batching, AI recaps, notification text/actions:
  [attention](references/attention-notifications.md).
- Material unresolved choices: [clarifications](references/clarifications.md).
  These notes are not an interview required before routine work.

Use `mobile-webapp-ux` for browser-only work. Image-led design exploration belongs
with `design-apps-with-imagegen` when selected; ordinary fixes need no mockup cycle.

## Personal defaults

Design for a technical, busy mobile user: readable information density, important
information and actions upfront, secondary capabilities progressively disclosed.
Learn from relevant Superhuman, Slack, Linear, and platform patterns; verify
current specifics before claiming how another app behaves.

Choose frameworks per product; retain the established stack in existing apps.
Adapt iPad composition to window width, with sidebar/list-detail where useful.
Recommend cached reading and durable offline actions only where the main task
needs them; cached display alone does not establish offline mutation support.

For communication apps, combine explicit importance rules, model assistance,
and user corrections. Respect existing preview settings. Batching cadence has
**no personal default**: present rolling, scheduled, and in-app-only options
when the product needs that decision.

## Proportional completion

Stop once the requested outcome, higher-level invariants, and risks introduced
by the change are verified or explicitly reported as blocked/unavailable. Do not
make adjacent improvements prerequisites or run a full mobile audit for a small fix.
Use focused checks; physical devices matter for affected hardware/OS behavior
or an explicit device-playtest request.

For delivery work, check the effective generated target and built artifact, then
verify the requested installation/launch/distribution outcome. Build success,
installation, ordinary launch, automation, and live delivery are separate claims.
For touched interactions, inaccessible required content or controls prevent a
claim that the flow is usable. Report unresolved audit findings without inventing
a false-positive explanation; an audit does not become a universal release gate.

Record task evidence in the project's QA record. Update this skill only when
asked; keep confirmed defaults separate from open choices. Do not accumulate
private captures, credentials, device IDs, or signing-profile UUIDs here.
