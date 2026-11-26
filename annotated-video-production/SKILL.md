---
name: annotated-video-production
description: Plan, produce, resume, or audit editorial annotations for recorded conversations, including source screenshots, demos, pull quotes, lower thirds, and Latent Space house overlays. Routes the surrounding production cycle from cut selection to release; owns overlay decisions and review. Use for an annotated episode or its cue/asset review, not standalone download, transcription, thumbnail, upload, or motion-graphics tasks.
---

# Annotated video production

Show what the conversation is about. This skill owns editorial annotation and its review cycle; neighboring skills own acquisition, transcription, rendering mechanics, packaging, and publication. Overlay guidance is developed here. Other stages are deliberately thin routes, to expand only when actual production work establishes new requirements.

## Enter or resume at any stage

Start with the user's requested outcome and existing artifacts. Do not force an episode through completed or irrelevant stages. Recover the current cut/timebase, selections, assets, approved treatment, latest output, and outstanding feedback. Ask only for missing information needed for the next action.

Keep a short stage record in the existing project notes or manifest, not a new workflow framework:

- Current stage and requested stopping point.
- Paths to source cut, transcript, cue board, asset manifest, preview/final render, and release record, where they exist.
- Decisions/approvals and unresolved items; next concrete action.

At a handoff, pass these artifacts and scope to the receiving skill, then record its result. If inputs change, revisit only affected work: a new cut invalidates cue timing; an asset replacement affects its layout/render/QA. Preserve original footage and review versions.

## Routing and ownership

Load only the skill needed for the current action. Resolve named skills from the installed catalog; inspect their current instructions rather than copying their mechanics here.

| Stage / entry request | Owner and handoff |
| --- | --- |
| Acquire or compare cuts | `download-video` or source-specific downloader acquires media. Here, compare duration, opening, audio, continuity, and representative footage; record chosen cut and timebase. |
| Transcript / editorial context | `transcribe-anything` for ASR; `podcast-publishing-assistant` for chapters and publishing copy. Use transcript to locate topics, then verify speaker and timing against footage. |
| Research / select / capture overlays | This skill; produce selected cues and verified assets. |
| Design / preview / full render | This skill owns treatment and acceptance. Retain the existing renderer; use `design-apps-with-imagegen` for requested exploration. Route custom HyperFrames composition work through `hyperframes`/`general-video` when that engine is appropriate. |
| Audit existing annotated output | Enter directly at encoded-result review below; return findings without assuming a rerender. |
| Titles / descriptions / thumbnails | `podcast-publishing-assistant` for copy; `latent-space-thumbnail-director` for LS artwork. Pass episode facts, series identity, chosen hooks, real-face references, and official brand assets. |
| Upload / metadata / release | Relevant YouTube upload/API skill owns execution and account/channel verification. Pass exact output, metadata, channel, and authorized visibility. Record returned video ID and verified state. |

`media-transform` owns platform-transfer and generic media pipelines. For an annotation-led episode, use this skill as the coordinator and call atomic skills directly; do not nest two orchestrators or repeat their checkpoints. Standalone adjacent requests go directly to their owner. Do not edit neighboring skills merely to route this one.

Stop at the requested deliverable. Planning does not start a render; preview approval does not imply publication. “Don't rerender” permits inspection but stops render work. Existing approval remains valid within its scope.

## Start with the requested deliverable

- **Fix one shot.** Open the affected cue with enough dialogue to hear the lead-in
  and see the exit. Adjust the treatment and check the encoded passage, including
  any camera cut that changes placement. If a shared treatment caused the defect,
  check its other uses within the requested scope.
- **Plan or revise a board.** Follow the [cue and review guide](references/capture-and-cues.md).
  Deliver captured proposals and visible, researched alternatives. For a returned
  board, reconcile the choices with the version the reviewer saw and apply their
  notes to comparable cues where appropriate.
- **Preview a treatment.** Render the requested interval, or select the shortest
  passage that lets the reviewer judge the decision. Show a transition from before
  it starts until the new shot settles. Include the surrounding dialogue and
  identify the range on the current cut.
- **Render the episode.** Match selected cues to the actual renderer inputs,
  including both beats of any selected sequence. Carry the requested treatments
  through the whole cut. Use the [encoded review checklist](references/render-review.md)
  before handing over the versioned output and any omissions or unchecked portions.
  An authorized full render can proceed directly.
- **Audit an existing edit.** Inspect the requested passages or full output using
  the same checklist. Return timestamped findings tied to the cut you watched.

Publication is a separate action. For a local edit, hand off the requested
board, preview, findings or rendered file.

## Research and select

Build a broad chronological board across the whole episode, with reasonably even coverage of new points and substantial monologues. Avoid filler quotas. Search the speaker's own posts, demos, and articles first; then exact primary sources; then useful external explanations. Use intentional pull quotes where the argument itself merits emphasis.

For this user's research, use X `filter:follows`, selected high-signal lists, and [Latent Space AINews](https://www.latent.space/s/ainews). Later references are acceptable: retain dates without repetitive chronology warnings.

Each candidate needs time, speaker/topic, source link, exact proposed visual, why it helps, and approximate hold. Let the user cut the broad board; import selection exports and preserve their edits. A URL alone is not a resolved visual.

## Choose what viewers need to see

Listen to the claim and its response. What would a viewer understand better by
seeing the work? Keep the camera when the speaker's delivery or the listener's
reaction carries the point. For a full episode, look for useful cues throughout,
including later monologues. Let the material determine their number.

Find the exact artifact or action. For a recollection, look for the guest's
contemporary posts. For a number, find the reporting or table behind it. For a
demo, inspect the relevant part of the recording, including attachments to the
original post. Show a referenced episode on the spoken mention using its
published artwork or a short excerpt. Keep the episode title and guest
identifiable. For a launch sequence, establish the original announcement, then
play the launch footage and selected demos. Choose footage that shows the
action. If a clip is unavailable, flag any still used in its place. See the
[editorial examples](examples/editorial-pairs.md).

Use a real capture for a claim about actual behavior. An illustration can explain
a mechanism or analogy. Label a reconstruction when it could pass for evidence.
When the claim is about a range of results, gather enough documented examples to
show the range. If the chosen source is unavailable, record the gap and continue
with the usable material.

Choose the reveal order by the viewer's task. Lead with a finished result when
it gives viewers a reason to follow the demo. When the guest poses a puzzle,
show the choices and give viewers a beat to look before revealing the answer.
For a mechanism, establish the starting condition, then play the action as the
guest describes it. Use the [animation guide](references/animated-annotations.md)
when motion carries the explanation.

## Capture the selected thing

Read [capture-and-cues.md](references/capture-and-cues.md) when resolving assets or reconciling a cue manifest.

Prefer original attached images and playable source media. Inspect the saved asset. A successful download, plausible filename, or attribution does not establish that the requested image/chart/demo is present. A photo-only post failing a video downloader still has a photo to recover. Check existing local originals before repeating research.

Choose demo segments showing action/results, not intros, branding, or teasers. Scroll articles with pauses on useful passages. A still-image pan does not substitute for a functioning demo.

After reasonable recovery attempts, omit unavailable inserts and report them; continue the rest. Escalate only an explicitly indispensable visual or a gap that prevents the requested outcome. Never silently replace a requested visual with prose.

## Cut and compose around the dialogue

Settle any requested speech edits before timing overlays. Preserve the speaker's
meaning and qualifications, audition the joins, and map source times to the
edited cut. Remove a cough or hesitation where the cadence and visible mouth
movement permit it. Flag substantial cuts for review unless already delegated.

Establish enough context to recognize a source, then direct attention to the
detail named. On a paper, that can mean starting on the title and figure, then
pushing in on a component as the guest names it. Keep highlights attached to
their targets through pans or zooms. Credit the source briefly on screen and
keep the full link in the cue record.

Give the viewer one main thing to read or watch. Protect the active speaker's
face, meaningful reactions and the part of the demonstration that matters.
Use existing camera or screen tracks when they help. Change the shot once its
contribution is clear. Let an image take the full frame when it needs the space.

For a pull quote, verify the words and speaker against the footage. Give a
complete thought readable line breaks, an accurate attribution and time to land.
A paraphrased explanation belongs in editorial text. Keep captions distinct
from both. Use licensed music or sound effects for requested intros and
meaningful transitions, keeping the dialogue clear.

## Frame for watchability

Sample representative camera setups and use placement heuristics; avoid exhaustive tracking for mostly static footage.

- Protect the active speaker's eyes/mouth. Listener faces, hands, and table space may be covered. Reposition or end an insert when camera cuts invalidate placement.
- Make useful detail large enough to read, including square/tall assets. Use available side, lower, and upper space, or a cutaway/split view. Fit the card to the asset; crop irrelevant margins instead of white letterboxing or stretching.
- Focus on the reason the asset was chosen. Highlights encompass complete words/lines with padding and track scrolling. A focused crop or subtle emphasis often beats a heavy rectangle.
- Use concise source/author attribution and a readable URL/domain. Keep full links in the source record/description. Use LS branding without redundant oversized logos.
- Use selective, accurate, naturally attributed pull quotes. Do not turn available photos, charts, or interfaces into generic title/body cards.
- Keep research caveats internal. Avoid repeated “DISCUSSION SUMMARY,” “PRODUCT PAGE EXCERPT,” or “not a benchmark/private workspace” labels. If context matters, use a brief natural attribution/date or a better asset.
- Use perceptible, restrained entrances/exits and requested sound cues. Listen under dialogue at normal volume; lack of clipping alone does not prove the sound works.

## Latent Space house style

Apply these defaults on Latent Space episodes. For other productions, follow
their own visual identity.

- **Logo.** Keep the show mark visible across camera shots and takeovers in a
  clear right-hand corner. Count a mark already present in the footage once.
- **Picture-in-picture.** When a takeover benefits from the guest's presence,
  ease the live interview into a framed lower-right PiP and keep the dialogue
  in sync. Let it settle across related inserts, then return on a spoken beat.
  Move it or omit it when that corner contains evidence the viewer needs.
- **Screen shares.** In remote interviews, let the active share take over the
  frame. Overlay the topic lower third and keep both speakers in small
  hexagonal insets. Preserve the share's aspect ratio. Reframe the source or
  move or hide an overlay if it covers labels, controls or cursor activity.
- **Host intro overlays.** In recording notes, specify which side of the
  finished frame to leave open. Frame the host slightly off-center with room
  beside them for a chart, clip, episode artwork or URL. During the edit,
  use the open left or right side and bring each visual in on the spoken cue.
  Keep intro graphics out of the lower-third area. Protect the host's face
  and gestures, and cut away briefly when a source needs the full frame.
- **Show opener.** When a standalone host intro leads into the main interview,
  place the existing Latent Space opener and its original theme at the handoff.
  Use the clean show asset for the current episode.
- **Chapter rail.** Span the usable width with previous, current and upcoming
  topics. Use quiet, silent progress bars. Completed segments stay filled, the
  current one fills smoothly, and upcoming ones stay empty. Omit percentages
  and countdowns. Hide the rail for a clean full-screen moment and resume at
  its true position on the final edited timeline.
- **Quotes and terms.** Use the space above the rail selectively. Set an
  editorial pull quote or short explanation over a feathered dark gradient
  with enough contrast to read on a phone. Emphasize a meaningful phrase as
  it is spoken and let the rest of the line stay still. Caption cold opens and
  social clips. Full-episode subtitles follow the brief.

For implementation starting points, see the [board, render and frame-extraction examples](references/code-examples.md).

## Preview quickly, then extend

Default: render the first ten minutes (or requested interval) and provide a lightweight board of the remaining exact assets/compositions. Use stills or short low-resolution previews for later treatments when useful or requested; do not require another comprehensive motion-preview round.

Inspect the preview at playback and small-screen size; play its motion and audio. Apply feedback about framing, margins, emphasis, and timing throughout. Full-render approval extends the approved quality and variety, not permission to fill later sections with text fallbacks. Reconcile selected visuals with actual renderer inputs before rendering.

## Review the encoded result

For audits or completed renders, read [render-review.md](references/render-review.md). Inspect every insertion in the final encoded file; play moving inserts, transitions, and their audio. Sample untouched conversation rather than requiring continuous whole-episode playback.

Compare selected visual → captured source → rendered output. Repair systematic defects across affected cues when fixes are authorized. An audit-only request ends with findings. A production request ends when its requested output is verified, with omitted inserts reported. Additional creative alternatives are optional, not completion gates.

Deliver versioned output, updated cue/stage record, and concise findings. Packaging preserves series identity first (for example `High Taste Testers: [hook]`); publication proceeds only within the user's authorized scope. A revised asset or local render is not a changed live upload.
