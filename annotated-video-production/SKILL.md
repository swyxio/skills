---
name: annotated-video-production
description: Plan, produce, resume, or audit editorial annotations for recorded conversations, including source screenshots, demos, and pull quotes. Routes the surrounding production cycle from cut selection to release; owns overlay decisions and review. Use for an annotated episode or its cue/asset review, not standalone download, transcription, thumbnail, upload, or motion-graphics tasks.
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
| Design / preview / full render | This skill owns treatment and acceptance. Use `animated-annotations` for explanatory motion inserts and their visual review. Retain the existing renderer; use `design-apps-with-imagegen` for requested exploration. Route custom HyperFrames composition work through `hyperframes`/`general-video` when that engine is appropriate. |
| Audit existing annotated output | Enter directly at encoded-result review below; return findings without assuming a rerender. |
| Titles / descriptions / thumbnails | `podcast-publishing-assistant` for copy; `latent-space-thumbnail-director` for LS artwork. Pass episode facts, series identity, chosen hooks, real-face references, and official brand assets. |
| Upload / metadata / release | Relevant YouTube upload/API skill owns execution and account/channel verification. Pass exact output, metadata, channel, and authorized visibility. Record returned video ID and verified state. |

`media-transform` owns platform-transfer and generic media pipelines. For an annotation-led episode, use this skill as the coordinator and call atomic skills directly; do not nest two orchestrators or repeat their checkpoints. Standalone adjacent requests go directly to their owner. Do not edit neighboring skills merely to route this one.

Stop at the requested deliverable. Planning does not start a render; preview approval does not imply publication. “Don't rerender” permits inspection but stops render work. Existing approval remains valid within its scope.

## Shape the episode

When asked to edit an interview, use strong, intelligible moments as a cold open before the intro music and title; connect them to the episode's actual subject. Default to light polish: remove obvious dead air, errors, and awkward joins while preserving the conversation and meaning. End the handoff with timestamped suggestions for tangents or repetition that could be cut, without silently making those larger editorial cuts. Review joins in motion and with audio. Record the resulting source-to-output time mapping so transcript and overlay cues remain synchronized.

For recorded host commentary, settle requested cough/filler cleanup and pacing before final overlay timing. Remove isolated coughs at natural joins. Cut an “um” only when cadence and meaning survive; mute or replace with room tone only where it sounds natural and does not leave an obvious silent mouth movement. Preserve breaths, emphasis, qualifications and disclosures rather than stripping every hesitation. Review the joins with the surrounding sentence, then update the edit map.

Caption cold opens and social clips; offer optional subtitles for the full episode. Use occasional branded lower thirds for important phrases, including key terms the host picks up on, keeping them distinct from dialogue captions. When identifying a guest, use their name and company when relevant; do not substitute the event name for their affiliation. Verify the name against the actual person in the shot, not just an ASR label or approximate cue time. At major topic shifts, consider concise chapter titles with thoughtfully designed typography and animated entrances and exits; avoid interrupting every change of subject. For clips, shortlist timestamped candidates and render the strongest few for review when clip production is in scope.

Use music for the intro, outro, and occasional major transitions. Sound effects such as whooshes for movement, light clicks or pops for graphic arrivals, and restrained risers or impacts for major reveals can reinforce edits; vary and synchronize them to the visual rather than accenting every cut. Match sound character to the action or idea, with variety instead of repetitive generic bleeps. They should be noticeable without masking speech. Use appropriately licensed audio and check the mix by listening. Check true peak after encoding; when only audio needs correction, remux it without re-encoding the picture. Balance voices and reduce obvious noise conservatively; flag problems needing heavier processing.

SFX references: [The Sound Effects Every Editor Needs to Know](https://www.youtube.com/watch?v=B6z4PaXImDs) (YouTube tutorial) and [Adobe sound effects for video](https://www.adobe.com/creativecloud/video/discover/sfx-for-video.html) (sound-design overview).

For a requested title card, make the people and event recognizable: use real reference frames or portraits of the host and guest, with faithful likenesses, rather than an unrelated generic background. Select flattering frames with open eyes and eye contact when available; respect feedback about likeness and avoid distorting face or body. Use authentic, current brand assets for the event and publisher, compositing official logos cleanly rather than relying on generated lettering or marks. Reserve legible space for a concise, compelling title; respect the user's requested logo positions and keep them clear of faces. Treat these as editorial preferences for people-led interviews, not a requirement to invent portraits for other formats.

## Research and select

Build a broad chronological board across the whole episode, with reasonably even coverage of new points and substantial monologues. Avoid filler quotas. Search the speaker's own posts, demos, and articles first; then exact primary sources; then useful external explanations. Use intentional pull quotes where the argument itself merits emphasis.

For overlay research and planning, prefer a **captured-reference previz board**, not a prose list of things that could be shown. Resolve useful candidates across the speaker’s own X posts, web/blog sources, and playable videos; choose the medium that answers the point rather than filling platform quotas. Show the exact saved image, relevant article passage, diagram, or short source-video excerpt beside its proposed episode cue. Capture broadly enough for the user to cut the choices, while keeping gaps explicit. Resolve spoken references to the original work: a guest’s named talk or memorable phrase may call for their actual conference slides and footage, not a newly invented illustration or generic quote card.

For each important point, consider distinct treatments: the speaker's own footage or post, the actual product or source, a visual explanation, and a strong spoken quote. Select for relevance and clarity, not merely availability; research further when the best candidate is tangential or generic. Offer genuinely different alternatives with the exact visual and reason for each. When two sources illuminate successive parts of the point, propose a short sequence, timed to the speech.

Consider movies, TV, games, memes, and other cultural references that clarify a point or add humor. Prioritize references the speakers mention, and propose fitting analogies they did not name when they earn their place. Find the exact recognizable scene or moment, source it, and time it to the conversation. Prefer a short moving excerpt when it adds more than a still; keep the interview audible. Offer these as optional board choices, not a quota.

For each important moment, write the likely viewer question and a one-sentence visual answer before researching. “What is it?” suggests the actual thing; “how does it work?” a progressive explanation; “what happened?” the result and evidence; “why does it matter?” a concrete consequence or comparison; “how does this connect?” a visual callback. These are prompts for judgment, not a required overlay at every question. Reject an insert if it does not answer its question clearly.

For concepts that benefit from motion, route to `animated-annotations`: build the explanation in step with the speaker, show the payoff, and reuse visual callbacks where useful. Choose authentic source media or a clearly illustrative treatment according to the point being made.

For this user's research, use X `filter:follows`, selected high-signal lists, and [Latent Space AINews](https://www.latent.space/s/ainews). Later references are acceptable: retain dates without repetitive chronology warnings.

Each candidate needs time, speaker/topic, viewer question and visual answer, source link, exact proposed visual, and approximate hold. Prefer a concrete result or useful visual over a weak marketing line or a tangential image; omit filler. Let the user review through free-text comments rather than decision or alternative dropdowns. On a returned review, a blank comment means keep/accept the current proposed cue; interpret written requests such as “cut,” “maybe,” or “use the other clip” in context. Preserve explicit uncertainty and unresolved captures. Show the full exact source URL as visible, clickable text beside each reference, including alternatives. Separate review rounds: prior feedback belongs in clearly labeled read-only history with its resolution; leave the new-round comment field blank and namespace saved state by project and round. Export current comments separately from history, with the cue/proposal revision and timebase so stale feedback cannot masquerade as a new instruction. Label alternatives as captured or proposed, and include what was actually rendered when reviewing an existing cut. A URL alone is not a resolved visual.

## Capture the selected thing

Read [capture-and-cues.md](references/capture-and-cues.md) when resolving assets or reconciling a cue manifest.

Prefer original attached images and playable source media. Inspect the saved asset. A successful download, plausible filename, or attribution does not establish that the requested image/chart/demo is present. A photo-only post failing a video downloader still has a photo to recover. Check existing local originals before repeating research.

Lead demos with the useful result, then briefly show how it happened. Land an article capture on its relevant passage before scrolling; pause long enough to read it. Prefer capturing real scrolling or video playback when it better shows a product, video, or article. Label planned recordings separately from captured media. A reconstructed pan over a page capture is a pan, not a screen recording. A still-image pan does not substitute for a functioning demo.

After reasonable recovery attempts, omit unavailable inserts and report them; continue the rest. Escalate only an explicitly indispensable visual or a gap that prevents the requested outcome. Never silently replace a requested visual with prose.

## Frame for watchability

Sample representative camera setups and use placement heuristics; avoid exhaustive tracking for mostly static footage. For host commentary, choose camera, screenshare, source cutaway or split view according to what the viewer needs to see; switch at meaningful spoken beats rather than on a fixed timer. Use separate camera/screen tracks when available and useful for reframing, but do not require raw exports when the supplied composite already works.

- First use open space between speakers, including the center, when it fits the visual and remains readable. Protect faces where practical, especially the active speaker's eyes/mouth; listener faces, hands, and table space may be covered when needed. Reposition or end an insert when camera cuts invalidate placement.
- Make useful detail large enough to read, including square/tall assets. Use available side, lower, and upper space, or a cutaway/split view. Fit the card to the asset; crop irrelevant margins instead of white letterboxing or stretching.
- Focus on the reason the asset was chosen. For text-heavy sources, emphasize the relevant complete passage using the requested brand palette, with generous padding and contrast; ensure highlights follow scrolling. A focused crop or subtle emphasis often beats a heavy rectangle. Preserve enough source context—such as the page title, chart axes or recognizable interface—to orient the viewer before focusing tightly; do not crop away meaning just to fill the frame.
- Make explanatory diagrams earn their space: show the actual entities and relationships in the speaker's analogy or argument, with readable hierarchy and a clear progression. A generic chart or a larger version of an unclear diagram does not explain the point. Identify simulations as illustrations in the source record.
- Use concise source/author attribution and a readable URL/domain. Keep full links in the source record/description. Use LS branding without redundant oversized logos.
- Keep spoken captions readable and distinct from source captions; when requested, style both for the relevant brand and preserve their timing through edits.
- Use selective, accurate, naturally attributed pull quotes. Verify the words and timing against the footage, not just an approximate board timestamp. Give a major idea a larger, readable lower-third treatment when it deserves emphasis, without covering the speaker's face. Do not turn available photos, charts, or interfaces into generic title/body cards.
- Keep research caveats internal. Avoid repeated “DISCUSSION SUMMARY,” “PRODUCT PAGE EXCERPT,” or “not a benchmark/private workspace” labels. If context matters, use a brief natural attribution/date or a better asset.
- Use perceptible, restrained entrances/exits and requested sound cues. Listen under dialogue at normal volume; lack of clipping alone does not prove the sound works.

## Preview quickly, then extend

For research/planning requests, deliver the captured-reference board first; do not start a full episode render. Include short playable previews with the actual interview dialogue and proposed visual for representative or timing-sensitive cues, plus source-video players with exact source in/out. Distinguish proposed treatment from verified timing and final render readiness. Each card should explain what the viewer learns, the intended crop/sequence and hold, useful alternatives, and whether to add, retain, reframe, replace or omit an existing insert. Use blank-by-default free-text comment fields, with blank meaning keep on a returned review; export this round’s comments and proposal identities separately from prior feedback/history. Do not require decision dropdowns. Keep previews lightweight. When production scope is an initial preview, use the first ten minutes (or requested interval) with a board of the remaining exact assets/compositions; state whether that interval includes the intro. When the full episode is authorized, a preview is an intermediate check, not the stopping point. A roughly one-minute reel sampling the beginning, middle, and end can check pacing, variety, sound, and mobile readability before a full render. Do not make another approval gate when a full render is already authorized.

Inspect the preview at playback and small-screen size; play its motion and audio. If motion or sound playback is unavailable, flag that before a full render and provide playable previews; continue authorized work without claiming those checks passed. Apply clear feedback about framing, margins, emphasis, and timing to comparable cues throughout; keep cue-specific choices and tentative comments scoped rather than turning one selection into a universal preference. Full-render approval extends the approved quality and variety, not permission to fill later sections with text fallbacks. Reconcile selected visuals with actual renderer inputs before rendering.

For adaptable code examples for a cue board, one overlay, and encoded-frame extraction, see [code-examples.md](references/code-examples.md); retain the project's established renderer when appropriate.

## Review the encoded result

For audits or completed renders, read [render-review.md](references/render-review.md). Inspect every insertion in the final encoded file; play moving inserts, transitions, and their audio. Sample untouched conversation rather than requiring continuous whole-episode playback.

Compare selected visual → captured source → rendered output. Repair systematic defects across affected cues when fixes are authorized. An audit-only request ends with findings. A production request ends when its requested output is verified, with omitted inserts reported. Additional creative alternatives are optional, not completion gates.

Deliver versioned output, updated cue/stage record, and concise findings. Packaging preserves series identity first (for example `High Taste Testers: [hook]`); publication proceeds only within the user's authorized scope. A revised asset or local render is not a changed live upload.
