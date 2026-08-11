# Reader and angle checkpoint

Use this checkpoint before drafting a standard or feature post. Treat a title
or angle supplied by the user as a strong candidate, not permission to skip the
reader check, unless the user explicitly fixed both.

## Align on the reader

Tailor the choices to the material and ask them in one compact batch. Use this
shape when no better project-specific wording exists:

1. **Reader — I believe the primary reader is:**
   - A. A smart adjacent engineer — explain the project and its minimum model.
   - B. A practitioner in this domain — move faster and emphasize decisions.
   - C. A specialist contributor — prioritize internals and precise tradeoffs.
   - D. A technical decision-maker — prioritize consequences and alternatives.
2. **Prior knowledge — I plan to assume:**
   - A. General software knowledge, but no project-specific nouns.
   - B. Familiarity with the domain, but not this system.
   - C. Familiarity with the named system or ecosystem.
3. **Desired result — I will optimize for the reader to:**
   - A. Gain a useful mental model.
   - B. Make a technical or product decision.
   - C. Try a technique or reproduce a result.
   - D. Understand what happened and why.

Mark a recommendation for every decision and state its effect. Default to `1A,
2B`, then choose `3A`, `3B`, `3C`, or `3D` from the story. End with:

> Reply **approve all** to accept 1A, 2B, 3A, or give changes such as 2C, 3B.

Wait for the response. Do not ask what the user already made explicit. For a
short note with an obvious readership, state the inferred answers and proceed.

After alignment, record these beliefs privately:

4. **Before:** one sentence describing what the reader likely believes or
   cannot yet do.
5. **After:** one sentence describing the evidence-earned belief, model,
   decision, or action.
6. **Exclusions:** two or three relevant facts that this post will deliberately
   leave to another document.

If the user's view of 4 or 5 would materially change the story, include
lettered alternatives for those decisions in the same alignment batch.

## Choose the angle

For a standard or feature post, offer two or three materially different angles
unless only one honest story exists. Keep each option to this form:

> **A. Title —** Promise: one sentence. Tradeoff: one sentence.

Vary the actual reader promise, not punctuation or title phrasing. Draw from
the title families and prompts in [story modes](story-modes.md). Recommend the
angle that best combines truth, reader value, specificity, and an explainable
mechanism. Wait for the user's choice.

Do not add an opening scene, visual concept, evidence inventory, pros list, or
content outline to every option. Develop those only after the angle is chosen.

## Recheck after drafting

1. Summarize the finished post in one concrete sentence without looking at its
   title.
2. Compare that sentence with the approved before/after beliefs, title, deck,
   first paragraph, and primary visual.
3. Confirm that they promise the same subject and conclusion at the same scope.
4. Check that the title or first paragraph names the elephant in the room.
5. Generate two or three replacement title/deck pairs only if drafting revealed
   a better story or the current wording became vague, overstated, or generic.
6. Ask again when a replacement changes the promised belief; otherwise keep the
   approved angle and improve its wording.

When revising an existing post, propagate a changed premise through the title,
deck, description, opening, section order, headings, evidence, limitation,
visual, and ending. Do not paste a new headline over the old argument.
