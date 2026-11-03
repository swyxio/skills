# Assets and cue records

Use the existing JSON/table and review board. Each cue needs:

- Stable ID, source cut/timebase, start/end, topic and verified speaker where known; the viewer's likely question and the intended visual answer.
- Source URL, author/product/date, and exact requested visual.
- Local asset path/type, clip in/out or crop/scroll stops; capture/inspection status.
- Intended treatment, caption/link, camera placement, user selection.
- Render version/evidence, disposition, and internal source relationship or uncertainty.

Keep “found,” “captured,” “visually verified,” and “rendered” distinct. Preserve omitted cues with their reason.

For posts, inspect attachments and relevant images, not just text. For charts, retain axes, legend, and comparison. For articles, retain enough source context while enlarging the useful passage. Reject blank media, spinners, cookie banners, unrelated replies, and paused player tiles presented as demos.

Before rendering, reconcile each selected image/chart/demo with the actual media input. Text substitutions need an editorial reason; download failure or rendering convenience is insufficient. Check every selected item in multi-product comparisons, rather than representing the whole comparison with one slogan.

## Captured-reference previz board

- Resolve the original post, talk, article or demo; retain both the episode cue and the source clip’s own in/out. A quotation repeated by somebody else is an alternative, not the guest’s original post.
- Put the actual captured asset on the card. Give moving sources playable excerpts; for representative or timing-sensitive choices, add a short composition with the real interview audio. Keep source audio separate from the proposed dialogue mix. Label sampled/ASR-located timing as provisional.
- Inspect existing inserts on the current cut before adding a new one. Show whether the proposal retains, reframes, replaces or sequences that footage, and use recurring source visuals as deliberate callbacks.
- Visually inspect saved captures and encoded preview frames. Full-page captures can fail around sticky/animated heroes; clipped screenshots can disagree with DOM coordinates. Recover with a verified viewport capture and checked crop. Preserve chart axes and legends, complete highlighted text and attribution; wait for source animations to settle before selecting a still.
- Record unresolved captures with no usable asset path; never fill their card or manifest with an unrelated image. Offer genuinely different captured alternatives separately from ideas still needing production. Keep the current round’s comments distinct from historical feedback in the export.

- Display alternatives openly, with actual media, a reason to use each and a tradeoff. A sourced chart versus a spatial analogy is a useful choice; three recolors rarely are. Label uncaptured alternatives honestly.
- For timing-sensitive cues, show original and proposed compositions of the same excerpt with dialogue and matching in/out context. Keep one audio player active at a time. Show the user's comment and what changed alongside playback; source footage alone is not the proposed composition.

## Review rounds and comment semantics

- Keep cue IDs stable, but identify the board’s review round, source cut/timebase and each proposal revision. Use project + round in browser-storage keys. Do not restore the preceding round’s textarea values into a revised board.
- Start current-round comment fields empty. Display prior comments separately as read-only history, labeled with their round and whether they were addressed, superseded or remain unresolved. State what changed in the current proposal. Unresolved earlier requests remain visibly unresolved; never present them as fresh user comments or silently call them fixed.
- Use free text for feedback and alternative selection; no decision dropdown or mandatory keep/cut controls. When the user returns the review, blank means keep the current proposed cue. Interpret comments in context, including tentative language, and preserve the raw text alongside any agent interpretation. Blank does not supply a missing asset, establish an unperformed check, or authorize a separate render/publication action.
- Export current comments, round ID, cue/proposal revisions and timebase separately from history/resolutions. Reconcile against the reviewed version before applying a returned file; do not merge stale feedback into new comments. A submitted review may record the blank-default keep explicitly, but merely opening a board or waiting is not a submitted review.
- Show each complete source URL as the link text, wrapping long URLs instead of truncating or hiding them behind “Exact source.” Include the actual URL for each alternative and retain meaningful timestamps/fragments. This is a review-board requirement; readable on-video attribution can still use a concise domain with the complete link in the source record.

## Proposed learning from returned reviews

Apply authorized cue edits, then separately propose reusable interpretations from
the review JSON. For each proposed preference show the raw comment/cue IDs,
interpretation, plausible alternative reading, scope and confidence, and the exact
skill/preference change suggested. Separate explicit directions from inference;
blank keeps are not strong evidence of general taste. Ask the user which proposals
to adopt before writing durable preferences or committing inferred rules. Do not
make this optional learning step block the episode edit.
