---
name: face-matching
description: Diagnose, improve, or operate person-centered face matching across photo libraries, video, social profiles, directories, events, and other media when reference discovery, identity verification, detection failures, unknown people, or safe face-to-person assignment are involved. Use for face recognition and face-reference sourcing; not for generic image editing, image generation, or galleries without an identity-matching problem.
---

# Face Matching

Match real faces to the right people while preserving uncertainty, consent, source boundaries, and existing correct assignments. Keep the ordinary path simple for people who already have a good reference; spend additional retrieval and inference only on unresolved cases.

Read supporting material only when it helps the task:

- [references/resources-and-source-strategies.md](references/resources-and-source-strategies.md): inventory of usable person records, LinkedIn/X/GitHub, employer/personal pages, public search, existing photo collections, video, transcripts, timestamps, browser access, and relevant installed skills/tools.
- [references/worldsfair-2026-journey.md](references/worldsfair-2026-journey.md): detailed real-world case study, concrete incorrect matches, identity corrections, production counts, failed hypotheses, and eight benchmarked padding recoveries.
- [references/implementation-and-operations.md](references/implementation-and-operations.md): existing SCRFD/SFace implementation, image-quality gates, operational commands, repository paths, regression checks, and release verification.

## Distinguish the five problems

1. **Identity coverage:** Do we even know that this person belongs in the searchable population? The source might be a customer directory, employee roster, contact list, event program, cast list, photo metadata, video title, caption, or prior human review.
2. **Person identity:** Does a profile, document, media item, or candidate name actually refer to the right individual? Similar names, employers, public aliases, organizations, and historical affiliations are evidence, not identity by themselves.
3. **Reference utility:** Do we have one or more trustworthy images of that person, and does any image contain a detectable usable face?
4. **Biometric comparison:** Does an unknown or query face resemble that person strongly enough while remaining clearly separated from competing identities?
5. **Contextual assignment:** Do independent time, place, nearby frames, co-occurring known people, captions, source provenance, or prior human confirmation justify assigning or expanding a match?

A verified profile can contain an unusable avatar. A clear-looking screenshot can still fail the actual detector. A face cluster proves visual recurrence, not a person's name. A match score is not a probability.

## Fast path for ordinary cases

1. Use the requested collection's authoritative person ID and existing verified reference image. Keep customer, organization, event, collection, and authorization boundaries explicit.
2. Reject cartoons, logos, obvious placeholders, ambiguous group portraits, unknown provenance, and unsupported images.
3. Detect and validate the face: appropriate image size, exactly one reference face, detector confidence, usable landmarks, reasonable face area, and finite embedding.
4. Compare normalized descriptors against verified enrolled identities. Require both minimum similarity and sufficient separation from the runner-up. Treat near ties as ambiguous.
5. Preserve existing human-reviewed identities, exact-only exceptions, denied assignments, and unknown results.
6. Match additional photos or video frames only when the same identity is independently corroborated; never let an inferred assignment become its own proof.

Do not add authenticated browsing, web search, video downloading, expensive alternate models, or multi-source investigation to every successful ordinary match.

## Last-mile escalation

For people who remain unresolved, use the smallest next step that might materially improve the result:

1. **Reuse available information.** Inspect existing directories, original record fields, previous source links, captions, filenames, human-reviewed examples, and collection metadata before launching fresh searches.
2. **Preserve candidate evidence.** Keep stable subject ID, authoritative name, corroborated aliases, company/project/event where relevant, source URLs, candidate images, per-candidate outcomes, and explicit uncertainty. Do not erase previously found links between runs.
3. **Search identity-bearing sources.** Prioritize verified official profiles and existing organizer/company links, then appropriate LinkedIn, X/Twitter, GitHub, employer team/author pages, personal websites, interviews, recordings, captions, or reviewed photos. Follow access boundaries and use the user's existing signed-in browser only when justified.
4. **Corroborate aliases.** Resolve Alex/Alexander, Jeff/Jeffrey, Jess/Jessica, Leo/Leonard, spelling variants, or changed surnames only when another independent signal supports the same person.
5. **Evaluate multiple verified images.** Retain many identity-vetted candidates, but promote exactly one passing reference for a single-reference workflow. Rank identity strength first, then actual real-detector utility. A source-priority `break` before detection can silently discard every useful alternative.
6. **Repair framing conservatively.** For a tightly cropped trusted portrait, retry with an approximately 20% neutral border. For a confidently detected undersized face, retry a bounded face-centered crop. A padded detection may need that same crop afterward. Reapply all original quality, one-face, confidence, landmarks, and embedding gates.
7. **Use contextual triangulation.** Compare timestamps, source album, location, session or scene, neighboring camera frames, transcript/video timing, recognized co-occurring people, and conservative repeated-person clusters. Do not infer names or identity from race, nationality, body shape, skin tone, glasses, age, or similar appearance alone.
8. **Escalate uncertain cases honestly.** Request a human decision, more reliable image, or separately authorized benchmark when existing evidence remains ambiguous. Keep false matches out of the index.

The documented event case study demonstrated that all fifteen tested alternative portraits still failed the detector, while a simple border plus existing face-centered crop recovered eight rejected trusted portraits without weakening the existing 0.80 acceptance threshold. These are measured historical examples, not a promise that any particular production system is already fixed.

## Source and privacy boundaries

- Unknown is a valid result. Never silently force a closed-set match to the nearest enrolled face.
- Treat public profiles, authenticated pages, private albums, customer records, PII, biometric embeddings, provider credentials, and generated output according to the most restrictive source involved.
- Never inspect or persist browser cookies, session stores, access tokens, signed media URLs, unrestricted private payloads, or unrelated people merely because an authenticated page is available.
- Preserve only task-appropriate canonical identity URLs, authorized image bytes, safe hashes, minimal provenance, explicit human decisions, and necessary scoped IDs.
- A person, organization, employer, brand, and project are distinct entities. Record relationships; merge only explicitly verified equivalent identities.
- In multi-person images, preserve `(image_id, person_id)` assignments rather than assuming one image has one owner.
- Never use reviewed exact-only photos, poisoned galleries, quarantined identities, rejected clusters, uncertain inferred labels, or disallowed propagation as reusable identity seeds.
- Respect the user's actual authorization: read access does not imply permission to republish media, scrape at scale, change production data, or deploy.

## Verify observable outcomes

Measure coverage, false-positive risk, unknown count, newly recovered face/person assignments, and every lost historical assignment separately. Record why candidates failed: `link_known_not_processed`, `identity_unverified`, `reference_missing`, `face_not_detected`, `low_confidence`, `multiple_faces`, `ambiguous_match`, or `human_review_required`.

Run the actual detector on real representative image bytes when changing preprocessing; mocked detections and source-ranking tests do not prove real-world detection. Preserve user-confirmed regression cases, rerun appropriate tests, and verify actual user-visible behavior when that is within scope. Distinguish proposed, benchmarked, implemented, merged, deployed, and live-verified outcomes.
