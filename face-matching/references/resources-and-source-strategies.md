# Face Matching Resources and Source Strategies

Use existing resources deliberately. Do not browse, scrape, download, infer identities, or create biometric data merely because a capability exists. Choose the lowest-cost, appropriately authorized source that materially improves the requested match.

## 1. Authoritative person and collection records

Potential identity sources:

- Employee, customer, member, speaker, attendee, cast, creator, contact, or account directories.
- Existing application user/person IDs and account/provider identifiers.
- Conference schedules, event registrations, organizer speaker profiles, Sessionize or Accelevents records, presentation metadata, and internal owner-approved documents.
- Public company directories, leadership pages, author archives, open-source contributor profiles, publication bylines, university profiles, project ownership, and professional biographies.
- User-provided corrections, approved aliases, reviewed contact lists, previously labeled photos, or explicitly confirmed media.

Prefer stable source-owned identifiers. Preserve tenant, event, account, and permission scope. Do not infer that similarly named records, an employer name, and an organization placeholder identify the same person.

Useful fields include canonical ID, legal/public/display name, accepted alias, current or historical employer, project, job title, personal domain, social handles, company domain, co-participants, relevant date, location, and first-party source links.

Operational lesson: an application field called `photo` can contain an employer about page or LinkedIn profile instead of image bytes. Inspect actual URL type rather than assuming a field name describes its contents.

## 2. Existing image collections

Check authorized in-product data before looking outside:

- Existing profile photos and official headshots.
- Previous verified thumbnails, public avatars, press images, event albums, and staff directories.
- Human-reviewed positive and negative examples.
- Unknown-person albums and conservative repeated-face clusters.
- Existing face boxes, embeddings, landmarks, image quality scores, detector confidence, camera metadata, album IDs, and review history.
- Multiple photos or frames of the same person under varied lighting, pose, facial hair, glasses, and time period.

Distinguish strong direct reference photographs from inferred event exemplars. A large existing gallery is not trustworthy if its original label may be poisoned. A wrong prototype can spread rapidly across the entire collection.

Prefer a small number of independently verified high-quality examples over many near-duplicates from one uncertain source. If using multiple references, preserve per-image provenance and look for agreement rather than averaging conflicting identities into one embedding.

## 3. LinkedIn and professional profiles

Available evidence:

- Exact displayed name and known public/private alias.
- Current or relevant historical employer and role.
- Canonical public `/in/<slug>` identity URL.
- Profile avatar, profile-page media, authored posts, featured posts, presentations, and linked company/personal websites when access and intended use permit.
- Mutual links from an organizer, employer, personal domain, or another first-party identity source.

When authenticated access is genuinely necessary and allowed, use the user's existing signed-in Chrome workflow rather than inventing credentials or inspecting cookies. Confirm the intended name and employer before using a displayed portrait. Do not copy signed `media.licdn.com` URLs, session tokens, connection data, messages, contact details, or other unrelated private page content.

Canonicalize safe legitimate regional LinkedIn hosts carefully instead of accidentally dropping an existing `hk.linkedin.com/in/...` profile. Treat LinkedIn pages that cannot be opened or require review as `known_profile_requires_authorized_access`, not `profile_not_found`.

A professional avatar may be distant, stylized, crowded, stale, or missing. If a visible authored or featured post contains a clearer photo, first determine whether the depicted person is identifiable and whether reuse is authorized. A two-person image does not establish which person is the account owner without corroboration.

## 4. Twitter/X

Available evidence:

- Organizer-linked or self-linked exact public handle.
- Display name, biography, company/project mention, verified external links, and account history when visible and relevant.
- Public profile avatar, often under `pbs.twimg.com/profile_images/`.
- Public posts containing selfies, talk announcements, stage photos, interview clips, or explicitly named co-participants.

Identity gates:

- Prefer an exact handle linked by an authoritative roster, employer, personal site, GitHub profile, or other verified page.
- Corroborate displayed name and contextual affiliation.
- Reject similarly named accounts, profile banners, logos, memes, artwork, group pictures, and image URLs unrelated to the named profile.
- Record the canonical profile URL, not signed media parameters or unrelated timeline data.

Platform image variants can expose a larger avatar, but a larger image is not proof of a detectable face. In the case study, Matt Brockman's actual 400×400 verified X avatar still produced zero detections even though the account page screenshot looked clear to a person.

Use `twitter-x-scraping` only when an actual task requires public X timeline retrieval and its access method is appropriate. Use `download-x-video` only when the user-authorized task requires a specific X video. Neither should become a mandatory dependency of ordinary matching.

## 5. GitHub and developer profiles

Useful evidence:

- Exact account handle and stable GitHub profile URL.
- Public display name, organization, employer, project ownership, linked personal website, and public avatar URL.
- Organizer-linked handle or independent first-party linkage from a personal/company domain.
- Contributor, commit, repository, project-maintainer, package, or author identity where relevant.

Reject account matches based only on a common handle or partial name. Many developer avatars are cartoons, logos, heavily stylized portraits, or stale photos. A verified GitHub identity is therefore weaker evidence about image utility than a validated real-face photograph.

When a project identifies the user but its avatar is unusable, follow verified links to a personal website, conference bio, company author page, video interview, or documented social account. Keep each transition and identity relationship explicit.

## 6. Employer, organization, and publication pages

High-value sources:

- Team, leadership, staff, executive, researcher, contributor, and careers pages.
- Named author pages, blog biographies, startup profiles, contributor directories, conference speaker pages, podcast guest pages, and open-source project documentation.
- Structured JSON-LD `Person` entries and their `image` values.
- Named image `alt`, `title`, and `aria-label` attributes and page-local name/employer context.
- Company interview videos, employee spotlights, announcements, and public press materials.

Preferred order: explicit named `Person.image`, exact named portrait, strongly corroborated author/team photo, and then task-appropriate page imagery with independent person evidence. Do not treat a company's generic `og:image`, logo, office photo, group banner, city map, or promotional graphic as a person's portrait.

Check safe redirects and source ownership. A personal domain might host its files on a CDN; validate the identity-bearing page and exact image relationship instead of trusting any CDN image discovered on the page.

Historical successful examples: Arize's team portrait for Ankur Duggal, a Dynatrace author portrait for Matt Gibiec, a Snyk contributor portrait for Eli Cohen, and a Y Combinator founder portrait for Leo/Leonard Platzer.

## 7. Personal websites, blogs, podcasts, and portfolios

Useful signals:

- Name, current/relevant employer, project, publication, biography, social links, and domain ownership context.
- Named about-page image, author avatar, podcast host/guest photo, structured metadata, or verified speaker profile.
- Links outward to canonical GitHub, X, LinkedIn, YouTube, or company accounts.

Corroborate aliases carefully. A podcast page identifying Jessica Wang plus Braintrust and a matching social account can support the conference name Jess Wang; surname and employer/project evidence matter more than the first-name abbreviation alone.

Do not assume that every headshot under a page belongs to its author; pages can contain guest lists, customer testimonials, advertisements, generic illustrations, or multiple hosts.

## 8. Video, livestream, interviews, and presentations

Available evidence:

- YouTube video title, description, chapter markers, captions, transcript, uploader, speaker names, date, thumbnail, and organization.
- Conference recordings, panel videos, podcast interviews, product launches, employer interviews, livestream archives, social clips, presentation recordings, and user-authorized private media.
- Frame timestamps aligned with a speaker's introduction, chapter, caption, presentation slide, stage session, or named dialogue.
- Consecutive video frames and tracked face trajectories.

Useful installed skills, when specifically relevant:

- `youtube-api`: inspect or operate YouTube data only within the connected account's permissions and the requested scope.
- `aie-event-transcripts`, `conference-transcribe`, and `transcribe-anything`: obtain or inspect relevant transcript evidence when speech-to-time alignment matters.
- `download-video`, `download-x-video`, and `zoom-download`: fetch specifically authorized source media when URL/content access and ownership allow it.
- `thumbnail-extraction` and `multimodal-extraction`: identify useful video frames, slides, timestamps, and face-bearing segments.
- `video-talk-to-essay`: relevant only when the actual request involves interpreting a talk, not as a generic face-matching prerequisite.

Do not download full channels, scrape unrelated recordings, publish thumbnails, inspect an unverified account, or create permanent media archives just because a face might appear somewhere. Extract a bounded time window tied to a named source and identity evidence.

For group panels, use named introductions, speaking turns, transcript timing, known co-panelists, repeated frames, and stage position. A video frame with several people is not a self-labeling reference.

## 9. Context and metadata

Useful corroboration varies by collection:

- Image capture timestamps, EXIF data, day, location, album, photographer, camera filename sequence, and adjacent frames.
- Event schedule, stage, room, session title, confirmed speaker, moderator, organizer, co-speakers, video chapter, or transcript offset.
- Company team membership, office, project ownership, byline, employment date, interview guest, or known collaborator.
- Repeated-face cluster membership, co-occurring already-identified people, consistent pose/clothing within a bounded session, and explicit prior review.

Context helps rank or constrain candidates; it does not independently prove facial identity. People can appear at another person's talk, change employers, share a stage, wear similar clothing, or occur in the background of a group shot.

Examples:

- A missing Google/YouTube speaker can be narrowed by already identified co-speakers and the known recording time.
- A person represented by an old `spk_tbd_*` ID can still be real if their current display name, official schedule, and stage footage identify them.
- An emcee or surprise guest can be discoverable from footage, captions, or YouTube titles despite being absent from the scheduled speaker list.

## 10. Detection, preprocessing, and embedding resources

Prefer resources already present in the application:

- Current face detector, embedding model, image decoder, and runtime.
- Existing sharp/Pillow/OpenCV-equivalent transforms, depending on the project's stack.
- Existing face boxes, landmarks, quality metrics, crop/alignment logic, and reference metadata.
- Existing offline indexing scripts, browser-side inference, and deterministic regression fixtures.

At the documented case-study snapshot, the available stack was SCRFD + SFace + ONNX Runtime Web/WASM + `sharp`. Practical no-new-infrastructure interventions included:

- Normalize color and alpha handling.
- Preserve EXIF orientation where the decoder supports it.
- Validate minimum actual source resolution rather than inventing detail by upscaling.
- Add an approximately 20% neutral border around overly tight close-ups.
- Center/crop a confidently detected small face and retry full validation.
- Combine border padding with the existing centered crop when padding makes relative face area too small.
- Keep internal candidate-proposal thresholds distinct from final acceptance policy.

Test actual detector outputs and exact production image bytes. Bohan Li's selfie returned zero detections unmodified and approximately 0.85 after border padding. Matt Brockman's verified LinkedIn, X, GitHub, and conference photos remained undetected even after several bounded transformations. Never advertise a fallback that has not actually worked.

Benchmark another model, external vision API, GPU inference, or remote service only when the user authorizes infrastructure/cost changes and a measured failure justifies it.

## 11. Existing task-specific skills and tools

Choose by actual need; installed availability is not permission and does not make a skill mandatory:

- `smart-entity-resolution`: genuinely ambiguous people, aliases, competing profiles, or organization/person confusion.
- `chrome:control-chrome`: task-relevant existing signed-in browser state, particularly authorized LinkedIn review.
- `browser:control-in-app-browser`: user-visible browser/gallery verification when browser interaction is actually needed.
- `accelevents-api`, `accelevents-speaker-sync`, and `sync-accelevents`: relevant authoritative speaker/profile metadata when the request actually concerns Accelevents and provider authorization exists.
- `conference-developer-endpoints`, `europe-developer-api`, and `schedule-design`: event-specific schedule, speaker, and developer data when that particular event is in scope.
- `google-drive:google-drive` or connected document tools: specifically authorized internal source documents, photo records, or attendee rosters; preserve the source's privacy level.
- `youtube-api`, `aie-event-transcripts`, `conference-transcribe`, `transcribe-anything`, `multimodal-extraction`, and `thumbnail-extraction`: bounded video/recording evidence when useful.
- `twitter-x-scraping` or `download-x-video`: a specifically relevant public timeline or authorized social video.
- `solstice-programmatic`: structured, bounded model-assisted source discovery or evidence synthesis only when the user requests that model/workflow and deterministic ordinary retrieval is insufficient.
- `ai-engineering` and `live-ai-pipelines`: relevant only if the requested workflow truly requires multi-request reliability, rates/cost controls, visible progress, or durable resumability.
- `visual-playtest`: useful when the requested work includes actual UI/gallery visual validation.
- `rg`, repository scripts, exact production datasets, existing tests, and targeted browser inspection: normally cheaper than introducing a new service or broad agent orchestration.

Do not invoke a skill merely because its name appears in this inventory. Follow its own instructions if it becomes genuinely applicable.

## 12. Source-selection decision table

| Situation | First resource | Escalate only if needed |
| --- | --- | --- |
| Known person with valid official headshot | Existing reference and detector | Additional confirmed references if matching is ambiguous. |
| Person ID exists, but no image is attached | Existing organizer/directory fields and known profile URLs | Verified company/personal/social pages. |
| Name differs slightly between sources | Exact person ID, surname, known employer/project | Explicit corroborated alias and independent source. |
| Verified profile avatar fails detection | Other vetted images plus bounded crop/padding | Authenticated featured media, video frame, or user review when appropriate. |
| Several faces appear in a candidate image | Named caption, timing, known co-participants | Human review; never assign the largest face automatically. |
| No person record exists | Existing collection context, captions, user-approved roster, or video title | Create an identity only when authorized and independently corroborated. |
| Collection has an unknown repeated-face cluster | Human-reviewed anchor and independent context | Conservative bounded propagation after identification. |
| Good-looking image still yields `no-face` | Actual detector diagnostics and approved framing transforms | Alternative model benchmark only with explicit infrastructure/cost authorization. |
| Existing gallery might be mislabeled | Original provenance, independent trusted headshot, exact human review | Quarantine and audit every affected assignment before reindexing. |

Keep the normal route cheap, make the exceptional route observable, and preserve the option to say “we do not know.”
