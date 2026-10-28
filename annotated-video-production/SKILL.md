---
name: annotated-video-production
description: Plan, edit, render, or audit annotated interviews and host commentary, including source captures, demos, pull quotes, and narration-timed animation. Use for episode edits or cue-board review; not standalone transcription, thumbnails, uploads, or unrelated motion graphics.
---

# Annotated video production

Make the conversation easier to follow with visuals that earn their place.
Resume from the current cut, timebase, cue selections, saved assets and feedback.
Use the existing project record; preserve source footage and review versions.
Revisit only work affected by a changed cut or asset.

This skill owns editorial treatment and review. Use `transcribe-anything` for
missing ASR, `podcast-publishing-assistant` for copy/chapters/release handoff, and
`latent-space-thumbnail-director` for LS thumbnails. Use source-specific download
skills for acquisition and upload/API skills for publication. Retain the existing
renderer; use `hyperframes`/`general-video` only when that engine fits the work.
Pass the exact media version, edit map, decisions and authorized scope at handoff.

## Edit the conversation

When episode editing is requested, choose intelligible cold-open moments that
connect to the subject, followed by the requested intro/title/music. Default to
light polish; propose larger tangent or repetition cuts with timestamps unless
that editorial discretion was delegated. Preserve meaning, qualifications and
disclosures. Review joins with surrounding dialogue and maintain a source-to-output
edit map for captions, chapters and overlays.

Settle requested commentary cleanup before final overlay timing. Cut isolated
coughs at natural joins; remove an “um” only when cadence survives. Muting or room
tone can work in a pause but must not leave an unnatural hole or visibly silent
mouth movement. Do not strip every breath or hesitation.

Caption cold opens and social clips; full-episode subtitles are optional. Use
selective branded lower thirds for key terms, especially ideas the host picks up
on. Verify guest identity against the shot; attribute name and company, not the
event as their affiliation. Keep source captions distinct from dialogue captions.

For people-led title cards, use faithful real-face references, flattering open-eye
frames and authentic logos. Respect requested logo positions. Select clips only
when clip production is in scope.

## Research and capture

Cover the episode's substantial new points and monologues without an insert quota.
For a candidate, identify the listener's question and how the visual answers it.
Search the guest's own posts, demos, articles and named talks first, then primary
sources and useful explanations. Use X follows/lists and Latent Space AINews when
helpful. Later sources are acceptable with their dates; avoid repeated warnings.

Offer distinct treatments where useful: actual product/source footage, an
explanation, a strong spoken quote, or a fitting cultural reference. Find the
specific scene or original work rather than a generic substitute. A sequence or
callback can serve the argument better than another unrelated card.

Deliver a board of exact captured assets beside episode cues, with genuinely
useful alternatives and unresolved gaps. A URL or prose suggestion is not a
captured visual. Read [capture-and-cues.md](references/capture-and-cues.md) when
building the board or reconciling review JSON: it owns cue fields, full source
URLs, revision/timebase tracking and review-round semantics. Use free-text
comments; on a returned review, blank means keep the proposed cue, not permission
to render or publish. Keep old feedback separate from new comments.

Inspect saved media, including post attachments. Reuse local originals before
recapturing. Start demos with the result; land articles on the relevant passage
before scrolling and allow reading time. Prefer actual playback/recordings when
they explain more than a still. A pan over a screenshot is not a recorded demo.
After reasonable recovery, omit unavailable inserts and report them; continue
unless the missing visual is indispensable. Never silently replace it with prose.

## Compose for comprehension

Sample representative camera angles instead of exhaustively tracking static
shots. Choose camera, screenshare, cutaway or split view at meaningful spoken
beats. Separate camera/screen tracks help reframing when available; a usable
composite does not require raw exports.

- Protect the active speaker's eyes and mouth; listeners may be covered. Reposition or end inserts when a camera cut invalidates placement.
- Enlarge useful detail and fit the asset's aspect ratio. Crop empty margins; avoid stretching, letterboxing and nested borders. Keep page titles, chart axes or interface context needed to understand the crop.
- Emphasize complete passages with padding and contrast, tracking highlights through scrolling. Prefer focused crops or light emphasis to heavy boxes crossing text.
- Use concise author/source attribution and readable domains on video; keep exact URLs in the board and show notes. Avoid redundant logos and internal labels such as “DISCUSSION SUMMARY” or “not a benchmark.” Include context naturally when it matters.
- Verify pull-quote words and timing against footage. Do not replace available photos, interfaces or charts with generic title/body cards.

Build animated explanations with the narration: reveal meaningful entities and
relationships, preserve continuity through cuts, and let the payoff land. Read
[animated-annotations.md](references/animated-annotations.md) for progressive
diagrams, generated layers, scroll motion and retiming.

Use music for requested intros/outros and selected major transitions. Match SFX
to meaningful actions rather than every cut; vary them and make them noticeable
without masking dialogue. Use appropriately licensed sound. Listen to the encoded
mix at normal volume and check true peak: no clipping does not prove good balance.
If only audio needs repair, remux without re-encoding the picture. Reduce noise
conservatively. Optional SFX inspiration: [editing examples](https://www.youtube.com/watch?v=B6z4PaXImDs).

## Preview, review, finish

Planning ends with the captured-reference board. Include short playable interview
context with audio for representative or timing-sensitive cues; distinguish source
clips from proposed compositions. For an initial preview, use the requested
interval or first ten minutes, stating whether it includes the intro. A one-minute
reel across beginning/middle/end is an optional fast check. Full-render authorization
means continue through the full output; previews add no approval gate.

Apply clear framing, margin and timing feedback across comparable cues, while
keeping tentative or cue-specific choices scoped. Preserve approved quality and
variety throughout; later sections do not get text fallbacks for convenience.

Before rendering, reconcile selections with actual renderer inputs. Review the
encoded result using [render-review.md](references/render-review.md): inspect every
insert, play moving inserts and their sound, and sample untouched conversation.
Check readability at small viewing size. If playback is unavailable, provide
playable previews and report the unchecked portions; do not claim stills verified
motion or sound. Repair shared defects across affected cues when authorized.

Stop at the requested outcome: findings for an audit, board for planning, verified
interval for a preview, or full output for a full-render request. Report omissions
and playback limits with the versioned output and updated cue/edit record.
A local render is not an updated upload; release is a separate authorized action.
Optional [code examples](references/code-examples.md) support boards, overlays and
frame extraction without replacing the established renderer.
