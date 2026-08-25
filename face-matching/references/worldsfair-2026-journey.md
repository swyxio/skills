# World’s Fair 2026 Photo Finder: Detailed Investigation

This is a dated case study, not a statement that these numbers, branches, thresholds, or unresolved people are still current. The main investigation occurred on 2026-08-24 in `aiDotEngineer/aietools`, primarily against `conferenceId=wf26`. Refresh live evidence before using a historical count operationally.

## Product and constraints

The product was the AI Engineer Photo Finder at:

`https://tools.aieconf.com/photos/?conferenceId=wf26`

Its job was to let an operator find event photographs of speakers or attendees, browse per-person galleries, inspect similarity, search by uploaded face, and retain an unidentified-photo bucket.

The user explicitly wanted broader accuracy and coverage improvements, not a slow workflow requiring them to identify one face at a time. They did not want the project diverted into an anonymous-access discussion. They also wanted to preserve existing infrastructure and postpone comparisons of alternative detectors and embedding models.

The existing architecture used an SCRFD detector, SFace embedding model, 128-dimensional descriptors, ONNX Runtime Web/WASM in the browser and offline scripts, static event data, and a Cloudflare Pages production frontend. Therefore the highest-leverage near-term changes were identity curation, trustworthy reference photographs, preprocessing, conservative propagation, and existing-data audits rather than replacing inference infrastructure.

## First failure: identity records were not canonical

Explicitly reviewed duplicates or organization placeholders had to be reconciled as follows:

| Incorrect or alternate record | Canonical real person | Evidence |
| --- | --- | --- |
| `spk_bereket_engida` | `spk_bereket_habtemeskel` | Bereket Engida and Bereket Habtemeskel are the same person. |
| `spk_dominic_kundel` | `spk_dominik_kundel` | Dominic and Dominik Kundel are spelling variants for the same person. |
| `spk_microsoft` | `spk_idan_gazit` | Idan Gazit works at Microsoft/GitHub; “Microsoft” is not another person. |
| `spk_andon_labs` | `spk_lukas_petersson` | Lukas Petersson is CEO of Andon Labs; “Andon Labs” is not another person. |

These were reviewed mappings, not a license to automatically merge every employee into their employer or everyone with a similar first name.

The official schedule was also incomplete as an attendee registry:

- Raouf Chebri was an emcee, not an ordinary scheduled speaker.
- Peter Steinberger appeared as an unscheduled cameo and was later referenced in a YouTube title.
- Hosts, organizers, moderators, panelists, and surprise guests can appear repeatedly despite lacking a standard speaker assignment.

A closed-set matcher restricted to the speaker list will force these people toward whichever enrolled face happens to be closest. Add independently corroborated attendee identities or leave them unknown; never silently force a closed-set classification.

## Most important production mistake: Peter Steinberger labeled Dylan Patel

The Photo Finder displayed a Dylan Patel gallery containing approximately 43 photographs of Peter Steinberger. The user corrected the mistake immediately.

The failure combined several weaker assumptions:

1. Dylan’s available profile image was a stylized illustration rather than a trustworthy real face reference.
2. Peter was absent from the standard speaker roster despite appearing extensively on stage.
3. The matcher attempted to explain Peter through the available enrolled identities instead of admitting an unknown person.
4. Glasses and other superficial appearance similarities were allowed to appear more persuasive than identity, reference quality, and actual event participation.
5. Once a wrong identity had a populated gallery, treating that gallery as reusable truth risked spreading contamination to nearby event faces.

The fix did not simply rename a label. It quarantined Dylan’s unreliable identity/reference, added the reviewed Peter identity, corrected the explicitly reviewed former Dylan gallery, kept human-reviewed cluster membership separate from independent human-reviewed faces, and prohibited cluster-derived labels from seeding unrelated identities.

Historical regression targets after correction:

- Peter Steinberger: 43 photos.
- Dylan Patel: 0 photos.
- Raouf Chebri: 31 photos.
- Three explicitly reviewed images stayed unassigned: `19397164505.webp`, `19397329061.webp`, and `19397356736.webp`.

This example established the core invariant: a confident-looking wrong name is worse than an unknown face.

## Human review became targeted evidence, not a one-face-at-a-time product

An early conservative clustering pass found approximately 355 repeated-person groups spanning 1,031 faces. Fifty-two speakers had only one verified reference photo. These observations showed why a single reviewed identity could unlock many images and why weak, one-photo references needed calibration.

The user manually identified or confirmed representative samples including:

- Addy Osmani.
- Erik Meijer.
- Raouf Chebri.
- John Lindquist.
- Zain Hasan.
- Joanne Song.
- Thais Castello Branco.
- Brian Lewis.
- Daniel Svonava.

Historical verified galleries after these corrections:

| Person | Photos | Specific lesson |
| --- | ---: | --- |
| Addy Osmani | 77 | A reviewed representative can seed conservative identification of a broader gallery. |
| Erik Meijer | 268 | Large repeated-person galleries amplify both good and bad reference decisions. |
| John Lindquist | 64 | Eight photos had previously been mislabeled as Anders; reviewed neighboring frames corrected them. |
| Zain Hasan | 9 | User-confirmed identity can establish a new reviewed anchor. |
| Joanne Song | 9 | A reviewed cluster can identify a previously missing person. |
| Thais Castello Branco | 11 | One confirmed face embedding collided with unrelated attendees, so its anchor had to be exact-photo-only. |
| Brian Lewis | 27 | Session and repeated-event evidence can expand a correct identity. |
| Daniel Svonava | 20 | Conservative repeated-face propagation recovers useful galleries. |

Not every confirmed face is a safe reusable prototype. Thais’s exact reviewed image, `19397302476.webp`, was valid for that image but visually collided with unrelated people across multiple conference days. The system had to prevent that embedding from identifying arbitrary new faces.

## Conservative propagation and its failure boundaries

The system used several increasingly strong forms of corroboration:

- Direct official-headshot-to-face similarity with a runner-up identity margin.
- A strictly trusted event exemplar whose existing owner independently agrees with the official reference.
- Gallery consensus requiring two distinct existing event photographs of the same person.
- Nearby single-person camera frames on the same event day and camera filename sequence.
- Consistency with a confirmed scheduled session day.
- Explicitly human-reviewed faces and separately bounded human-reviewed clusters.

Important negative examples:

- Do not reuse `gallery_consensus` or `human_reviewed_cluster` matches as fresh authoritative anchors.
- Do not use an exact-only reviewed photo to identify other images.
- Do not infer group-photo bystanders in bulk.
- Do not chain similarity transitively: A≈B and B≈C does not establish A≈C. Accepted neighboring-frame components must remain mutually corroborated.
- Do not overwrite a confident existing assignment just because a new prototype now scores slightly better.
- Compare `(image, person)` pairs because group photos can correctly belong to several people.

## First social-reference production release

The later effort moved from reviewing one photo at a time toward deterministic portrait discovery. It introduced verified reference extraction from:

- Official conference speaker photos.
- Authenticated, explicitly reviewed LinkedIn profile portraits with exact displayed person and employer corroboration.
- Organizer-linked public Twitter/X profile images under `pbs.twimg.com/profile_images/`.
- GitHub account avatars with exact profile-name, organizer-link, project, or employer corroboration.
- Named-person photographs on employer pages, personal websites, JSON-LD `Person.image`, author pages, and verified startup pages.

Examples of source evidence:

- Ankur Duggal: Arize team page and named employer portrait.
- Matt Gibiec: Dynatrace author page and named portrait.
- Eli Cohen: Snyk contributor page and profile imagery.
- Yunmo Koo: named personal website and matching photograph.
- Leo Platzer: Y Combinator founder portrait; the source called him Leonard Platzer, requiring an explicitly reviewed Leo/Leonard alias.
- Daniel Han: a reviewed real LinkedIn photograph replaced the unusable stylized/cartoon GitHub profile image.
- Dean Quiñanola: the official historical speaker ID was `spk_pranjal_jain`; preserve the canonical conference ID while displaying the verified real person rather than inventing a different identity from the slug.

LinkedIn media URLs were signed and should never be persisted. The safe intake stored reviewed image bytes, a SHA-256 digest, exact scheduled identity, verified employer, and the canonical public `/in/<slug>` profile URL only.

### Verified PR #174 production snapshot

Merged pull request:

`https://github.com/aiDotEngineer/aietools/pull/174`

Historical merge commit:

`268b161e5dd45da3449ab33487cfac88f017ab7e`

Measured production changes:

- Canonical enrolled people: 573 → 591, an increase of 18.
- Missing scheduled speakers: 39 → 21.
- Unknown photo records: 2,662 → 2,612, a reduction of 50.
- Newly named `(photo, person)` face assignments: 57.
- Existing named assignments audited and preserved: all 6,968.
- Lost existing assignments: 0.
- Signed or unsafe persisted profile URLs: 0.
- Full test suite at that snapshot: 143 files and 1,713 passing tests.

The 18 newly enrolled people were:

| Person | Newly visible event photos at that snapshot |
| --- | ---: |
| Abdul Dakkak | 0 |
| Ang Li | 1 |
| Ankur Duggal | 11 |
| Daniel Han | 12 |
| Dean Quiñanola | 0 |
| Eli Cohen | 1 |
| Ethan Sutin | 0 |
| George He | 10 |
| Kamalakannan Nandagopal | 0 |
| Leo Platzer | 4 |
| Matt Gibiec | 8 |
| Mingsheng Hong | 1 |
| Nicolai Ouporov | 1 |
| Omer Primor | 1 |
| Parth Sareen | 1 |
| Sunny Rekhi | 4 |
| Tanmai Gopal | 2 |
| Yunmo Koo | 0 |

An enrolled person with zero event photos is legitimate roster/reference coverage, but is not a newly recovered conference photograph. Count those outcomes separately.

## Second failure: “no portrait found” meant “we never tried”

At the PR #174 snapshot, the remaining 21 people were initially divided into 12 with a verified but rejected reference and nine allegedly lacking a verified portrait. This wording was overly pessimistic.

All nine “not found” records had `attempts=[]`. Several already had strong leads in authoritative organizer data or prior research:

1. Alex Campos, FriendliAI: the matching full name was Alexander Campos.
2. Ali Khial, G2i: the authoritative speaker record already contained his LinkedIn URL.
3. Jeff Ng, Unblocked: his full name was Jeffrey Ng, and the official speaker `photo` field contained Unblocked’s team/about page.
4. Jess Wang: Jessica Wang was identified as a Braintrust developer advocate, with a podcast website, portrait, and X profile; her conference record omitted employer information.
5. Nan Jiang, Modal: a personal website, named portrait, GitHub, and X provided promising identity evidence.
6. Rowan Christmas, Docker: the `photo` field contained a LinkedIn profile rather than a JPEG.
7. Shawn Chan, China Resources Holdings: the `photo` field contained a legitimate `hk.linkedin.com` regional LinkedIn profile rejected by overly strict host matching.
8. Chris Souza, Google/YouTube: co-speakers Daniel Bump and Preetika Bhateja, recorded talk footage, and adjacent stage photos provided contextual identification opportunities even without a dependable profile.
9. XiangMing Sun, Unitree: the historical database ID `spk_tbd_unitree` looked like a placeholder even though the actual display name and session identified a real person; Unitree presentation footage was a better candidate source.

Distinct mechanisms, not one generic search failure:

- Organizer links were discarded because they appeared in a field named `photo`.
- A regional but legitimate social-profile host was rejected.
- Existing LinkedIn URLs were collected but not fetched or surfaced as requiring authenticated review.
- A reviewed seed manifest contained only six selected entries and did not retain previously researched leads.
- Name equality ignored independently corroborated short-name/full-name aliases.
- The failure report erased the distinction between no evidence, unprocessed evidence, unavailable authenticated access, and a failed image.

The durable correction is to preserve a bounded per-speaker evidence ledger, normalize known safe fields/hosts, retain explicit corroborated aliases, and report actual discovery attempts.

## Third failure: the first verified source won before face detection

The source-discovery code ranked candidates, materialized the first trusted image, marked it approved, and executed `break`. The enrollment code then required exactly one preapproved candidate. Therefore a failed LinkedIn photo prevented Twitter, GitHub, employer, or other named images from ever being tested.

Examples:

- Matt Brockman: a LinkedIn image was tried while verified X and GitHub alternatives were not initially tested.
- Bohan Li: LinkedIn was tried before conference and GitHub alternatives.
- Jeff Vestal: LinkedIn was tried before conference and GitHub alternatives; his profile avatar showed him distantly on stage, while a featured post visibly contained a clearer image.
- Yohei Nakajima: LinkedIn outranked organizer-linked X and GitHub.
- Melanie Warrick: verified GitHub and personal-site images remained available after LinkedIn failed.
- Em Shreve: conference, personal, and registry alternatives had different actual image utility.

Nine of the twelve detector-rejected speakers had additional vetted high- or medium-confidence sources. Merely removing the `break` would be wrong: the existing contract rejects multiple simultaneously approved candidates as ambiguous. The correct contract is many vetted candidates, individual real-detector outcomes, and exactly one passing selected reference.

### Crucial correction to the attractive fallback theory

The user showed a clear-looking screenshot of Matt’s X profile, which made it tempting to claim Twitter fallback would fix him. Direct benchmarking contradicted that assumption:

- Matt’s reviewed LinkedIn portrait: `no-face`.
- Matt’s actual downloaded 400×400 X profile image: `no-face`.
- Matt’s GitHub image: `no-face`.
- Matt’s official conference image: `no-face`.

All fifteen then-available alternative candidates tested across this unresolved cohort also failed the current detector:

- Six official conference alternatives: four returned `no-face`; two were only 100×100 and failed the 128-pixel minimum.
- Nine public alternatives included Matt’s X/GitHub, Yohei’s X/GitHub, Bohan’s GitHub, Jeff’s GitHub, Melanie’s GitHub/personal site, and an 80-pixel Em Gravatar.

Thus “try every source” improves completeness and provenance but, by itself, had a measured recovery of zero on those available alternatives. Do not confuse a screenshot that looks obvious to a human with a photograph the production detector can actually detect.

## Fourth failure: tight framing confused the detector

Bohan Li’s 370×370 reviewed LinkedIn selfie visibly contained a large, clear frontal face. The real production SCRFD model returned zero detections even when its proposal threshold was reduced to 0.2. This was not evidence that no human face existed.

Adding an approximately 20% neutral gray border to exactly the same RGB image produced one valid detected face at approximately 0.85 confidence. Black, gray, and white borders also worked in bounded experiments. No model swap, cloud service, new embedding system, demographic heuristic, or reduced 0.80 enrollment requirement was necessary.

The explanation was missing visual context and edge-cropped face framing. An existing retry handled `face-too-small` by centering and cropping, but it never ran when the detector initially produced `no-face` or `low-face-confidence`.

### Benchmarked padding recoveries

Using the same model and unchanged detector-confidence floor, approximately 20% neutral border recovered:

| Person | Padded detector score | Outcome |
| --- | ---: | --- |
| Bohan Li | approximately 0.85 | Passed unchanged quality gates. |
| Ali Adl-Tabatabai | 0.8431 | Passed unchanged quality gates. |
| Hossein Niazmandi | 0.8803 | Passed unchanged quality gates. |
| Marina Petzel | 0.8724 | Passed unchanged quality gates. |
| Yohei Nakajima | 0.8202 | Passed unchanged quality gates. |

Three additional people became valid when the padded detection was followed by the existing face-centered crop and a complete second validation:

| Person | Padded score | Re-cropped score |
| --- | ---: | ---: |
| Em Shreve | 0.9036 | 0.9037 |
| Rafael Levi | 0.8738 | 0.8357 |
| Uday Kanagala | 0.9145 | 0.8634 |

Total historical benchmark: eight of twelve previously rejected trusted references became enrollable through bounded preprocessing while maintaining the exact one-face requirement and the existing 0.80 floor.

Counterexamples were equally important:

- Jeff Vestal improved only to approximately 0.797 and must remain rejected at a 0.80 minimum.
- Arun Sekhar improved only to approximately 0.707 and must remain rejected.
- Matt Brockman’s images remained undetected even with padding, mirroring, and modest rotation.
- Melanie Warrick remained undetected in the tested portraits.

These benchmarked last-mile findings were investigation evidence after the PR #174 snapshot. Do not assume a subsequent padding implementation was merged or deployed without checking current code and live production.

## Fifth failure: tests established ranking, not real image utility

One test was described as preferring a GitHub face over an unusable official headshot, but it used synthetic JPEG-header bytes and did not execute the actual face detector. GitHub won because it ranked higher, not because its photograph was detectable.

Another test explicitly treated two approved references as ambiguous, which was reasonable under the old one-winner contract but prevented a naive multi-candidate change.

Useful regression coverage must prove:

- Multiple sources can be identity-vetted while exactly one detector-passing image is ultimately approved.
- A tightly cropped real or representative fixture fails before border padding and passes after padding without lowering confidence.
- Border padding can feed the existing centered-face crop when relative face area becomes too small.
- Low-confidence, multiple-face, invalid-landmark, undersized, wrong-person, signed-URL, and ambiguous cases still fail.
- Previously reviewed Peter/Dylan, Thais exact-only, excluded images, and existing `(photo, person)` assignments stay unchanged.
- A full reindex converges rather than discovering new self-generated identities on every run.

## Transferable conclusion

The ordinary fast path was already sufficient for approximately 90% of speakers. The right system was not an elaborate universal pipeline. It was:

`canonical person -> verified reference -> validated face -> conservative event assignment`

with a bounded last-mile escalation only when necessary:

`preserve existing leads -> reconcile corroborated alias -> try verified images -> repair framing -> use event context -> ask a human if still ambiguous`

Keep observed, inferred, benchmarked, proposed, merged, and deployed states separate throughout.
