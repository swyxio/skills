# Media Studio Lessons

Read this reference only for a requested media-studio capability. Its patterns
are optional product-design guidance, not requirements for ordinary editing,
individual canvas tools, single-provider integrations, or inference runtimes.

## Lessons From The Storyboard Board Redesign

- The strongest mental model is “side drafting process.” Users should be able to generate, compare, rerun, and discard media without polluting the main chat or document.
- The main artifact should receive media only through an explicit publish/insert action.
- Candidate history is product state, not merely API output. Preserve multiple batches with prompt/model/reference snapshots.
- A “favorite” or “save” action is not enough for reference workflows. The UI must say whether an image is merely saved or actually attached to the model request.
- Model cards must be operational, not decorative. Users need to know: text-to-image vs image-to-image vs image-to-video, prompt-only vs single-ref vs multi-ref vs start-frame, native route vs Fal route, and likely wait time.
- Public-reference search works better as a cast board than as a flat image grid. Named subject lanes make multi-person shots and reference limits easier to reason about.
- Listal-style sources need source context, gallery/profile grouping, previewing, saving, and attaching. Search results alone are not sufficient.
- “Attach best” should be model-aware. A prompt-only model should attach nothing and say why; a single-reference model should attach one; a multi-reference model can attach up to its limit.
- Image-to-video generally means “animate this start frame,” not “blend these character refs.” The UI should make this clear.
- Structured media prompts are more robust than raw chat transcripts. Use story beat plus visual fields, then render a final prompt preview.
- Do not add broad prompt safety layers to work around provider behavior unless the endpoint requires them. Hidden media safety prompt tuning can overfit to one test case and damage generality.
- Direct providers should stay direct when their controls matter: OpenAI for GPT Image, Google for Gemini/Veo, xAI for Grok. Fal is not a universal proxy.
- Long media calls need visible state, cancellation when possible, and timeout notes. Some video/image models can take more than five minutes and should not look stuck.
- When publishing, preserve source metadata: source message, prompt, model, task, references used, metrics, and selected candidate.

## Implementation Checklist

- Add or normalize a media draft/board state object.
- Persist that state near the owning chat, story, project, or document.
- Keep generated batches immutable.
- Use stable candidate keys for selection.
- Store typed references, not only URL strings.
- Separate saved references from attached references.
- Add model capability helpers and tests.
- Add prompt rendering helpers and tests.
- Route provider requests through the right native backend.
- Verify that generation does not write to the main artifact.
- Verify that publishing writes only selected winners.
- Prefer focused tests for the changed behavior. Run broader suites, builds, or visual smokes only when the scope or risk warrants them.

## Common Failure Modes

- A generation button immediately inserts the first result into chat.
- Favorites are silently treated as references, or attached images are silently ignored.
- Prompt-only models appear compatible with reference images.
- Multi-character reference sets are sent to a single-reference or start-frame endpoint without warning.
- A failed provider response leaks raw schema errors into the UI without a usable model/task explanation.
- The media panel closes after generation, forcing users to hunt for outputs in chat.
- Prompt construction overfeeds roleplay history and produces generic or contradictory visuals.
- Backend code assumes all providers accept the same `width`, `height`, `image_url`, `reference_images`, safety, or moderation fields.
- UI tests only check API success and miss the product invariant: chat remains unchanged until publish.

## Specialized Studio Patterns

- **Cast boards and public references:** For products that explicitly support
  celebrity/public-web references or Listal-style sources, group candidates by
  named subject, preserve profile/gallery context, and distinguish saved images
  from attached model inputs. Offer model-aware "attach best" only when useful.
- **Provider catalogs:** A multi-provider studio may document OpenAI/GPT Image,
  Google Gemini/Veo, xAI/Grok, Fal, Flux, Qwen Image, Kling, Seedance, or other
  requested providers. Verify each current endpoint and its actual capabilities;
  this list is illustrative, not a routing requirement or compatibility claim.
- **Prompt authoring:** When structured prompt editing is requested, expose
  relevant fields such as objective, subjects, scene, composition, lighting,
  style, and exclusions; preview the final prompt before generation.
- **Workspace layouts:** Consider a docked board on desktop, an expanded view
  for heavy curation, or a mobile stepper only when the product benefits. Dense
  contact sheets, shallow cards, and labeled icon actions are optional patterns.
- **Project handoffs:** For newspicychat/SoloChat work, consider the existing
  local-dev-server skill. For genuinely slow operations or substantial redesigns,
  consider long-running-operation-ux or frontend-design when directly relevant.
- **Studio QA:** Candidate history, publish selection, visual/responsive smoke
  tests, full suites, and builds are warranted only when the user asks for those
  surfaces or the change creates a matching correctness or release risk.
