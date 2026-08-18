---
name: visual-playtest
description: Visually inspect a local or deployed site/app in a real browser and report concrete layout, responsive, or design regressions. Use when asked to visually check UI changes, reproduce a screenshot issue, compare a page with a reference, or playtest representative visual states. Do not use for code-only review or open-ended design ideation.
---

# Visual Playtest

Use the applicable browser-control skill. Match the effort to the request: a
static page review is not a full product certification.

## Choose the scope

Identify the few states that can materially change the result: named pages,
viewport ranges, theme, scroll position, navigation state, and persistent or
fixed UI. Reproduce the user's reported combination before exploring adjacent
states.

Load additional guidance only when it is in scope:

- Read [references/app-interactions.md](references/app-interactions.md) for
  functional QA of controls, dialogs, panels, keyboard flows, or app workspaces.
- Read [references/media-workflows.md](references/media-workflows.md) for audio,
  video, image-generation, asset-management, download, or media trust-state QA.
- Read neither reference for an ordinary static or content-site visual review.

Do not load both references automatically.

## Core pass

1. Open the target at one representative desktop width and one narrow mobile
   width. Add tablet or unusual wide states only when the design or report makes
   them material.
2. Capture the reported state before changing anything. When verifying a fix,
   compare the same URL, viewport, theme, scroll position, and persistent UI.
3. Inspect the top, middle, and bottom of the page for overlap, clipping,
   overflow, broken wrapping, weak hierarchy, unreadable contrast, awkward
   empty space, and fixed UI covering content.
4. Exercise only controls that create a visually distinct state or belong to
   the requested flow. A visual review does not require auditing every control.
5. Use a fresh reload for final screenshots and console checks so stale state
   is not mistaken for a current defect.
6. Stop when the named issue and its closest responsive variants are resolved.
   Do not expand into unrelated product QA without evidence or a user request.

## Report

Lead with the visual outcome. List observed defects by severity with the
viewport/state, evidence, and smallest useful fix. Separate observed facts from
inference and unavailable states. Use a table only when several defects benefit
from comparison; otherwise keep the report short.
