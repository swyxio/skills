# Slack message formatting

Read this for broken bold, paragraphs, lists, links, citations, or conversion of
model-generated prose into Slack messages. This is a rendering contract, not a
request to change the bot's maturity level, answer-generation logic, or permissions.

## Choose the actual rendering surface

Inspect the outgoing payload and installed SDK types before changing prompts.
Slack supports several distinct formats; choose one deliberately for the field
being sent. Check the linked current API reference when introducing a format.

| Surface | Contract | Use |
|---|---|---|
| `plain_text` | Literal text, without formatting | Labels and original content that must remain literal |
| `mrkdwn` text object | Slack syntax: `*bold*`, `_italic_`, `<https://example.test|label>` | Existing simple Block Kit text fields that support it |
| `markdown` block | Standard Markdown, including `**bold**` and `[label](URL)` | Model prose when the app supports this block and its native translation meets the product contract |
| `rich_text` block | Structured sections, lists, quotes, code and styled inline elements | Explicit control of formatting, citations and permitted interactive elements |
| Streaming `markdown_text` | Markdown on the streaming API | Existing native answer streams; follow [L4](level-4-native-agent.md) |

Do not send standard Markdown into `plain_text` or assume that `mrkdwn` parses
it identically. Slack's supported `markdown` block can remove the need for a
custom converter; evaluate the existing dependency and native capability first.
When explicit conversion is needed, use an established Markdown parser already
in the project, then map its tokens to validated Slack elements. Avoid global
regex substitutions for bold, links or lists: nested styles, code and reference
syntax need structural handling. Do not ask the model to author arbitrary Block Kit.

References: [message text](https://docs.slack.dev/messaging/formatting-message-text/),
[Markdown block](https://docs.slack.dev/reference/block-kit/blocks/markdown-block/),
[rich text block](https://docs.slack.dev/reference/block-kit/blocks/rich-text-block/),
[streaming API](https://docs.slack.dev/reference/methods/chat.startStream/).

## Preserve readable structure and literal evidence

Keep the lead, short paragraphs, actual list items and next action separate.
Render styles as styles rather than exposing Markdown delimiters. Put source
metadata and execution diagnostics in smaller context blocks where supported;
do not flatten the entire answer and diagnostics into one paragraph.

Keep original mail, quoted source content and other literal evidence distinct
from generated formatted prose. A formatter must not silently rewrite the
original content. Encode literal `&`, `<` and `>` in parsing-enabled Slack text
fields as required by the message-text reference; do not blanket-encode every
character or accidentally activate `<@USER>`, `<!channel>` or other mentions.
Native mention/broadcast elements require intentional, authorized application
behavior, not an arbitrary token emitted by the model or found in source text.

Keep top-level fallback text useful for notifications and accessibility, and
apply its own escaping/parsing controls. A safe block renderer does not by
itself make the fallback safe. Disable link/media unfurls when previews are
unwanted, including for messages with native clickable links.

## Preserve clickable destinations and citations

When the answer recommends opening an invitation, meeting, document or form,
include a descriptive clickable link if its destination is available from the
authorized evidence or validated application data. Do not merely say that a
link exists. Use a native link element or the correct link syntax for the chosen
surface; do not expose duplicated `label (mailto:...)` text as a substitute.

Keep exact destinations and their source identity as structured data in the
core. Preserve surrounding source context when extracting URLs outside a short
excerpt, so a model can distinguish an invitation from quoted, expired,
revoked or misleading material. Source-backed means observed in evidence, not
endorsed as safe or proof that access was granted. Do not invent provider URLs,
channel links or invitation tokens. If the relevant destination is missing,
report that limitation; use existing authorized retrieval if it can recover it.

Use the application's destination policy for allowed schemes and hosts. Do not
activate arbitrary model URLs, executable schemes, URL credentials, or unsafe
mailto headers. Extract URLs with an established parser where available;
distinguish terminal prose punctuation from punctuation inside an explicit link.
Preserve ordinary contact labels such as `Email:person@example.test`.

Citation labels and source links must survive formatting. Numeric labels such
as `[1]` can collide with Markdown reference links and definitions such as
`[1]: URL`. Render citations from validated source metadata, or protect their
syntax before parsing, so the formatter cannot hide or renumber them.

Navigation is distinct from accepting an invitation, granting access, submitting
a form, sending mail or approving a change. Keep those actions in the existing
application authorization flow. Private token-bearing links stay in authorized
private surfaces; keep them out of logs and public test fixtures.

Reference: [native link element](https://docs.slack.dev/reference/block-kit/block-elements/link-element/).

## Budgets and verification

Apply both field-specific and total payload budgets. Added link/context metadata
also consumes the serialized model-input budget: fit optional metadata within
that budget rather than causing an otherwise answerable request to fail. Preserve
required evidence and mark any omitted/truncated content. For long output, use
the existing full-detail surface instead of silently dropping the tail or hiding
the essential action behind a large diagnostics block.

For a rendering change, test the affected outputs with synthetic data:

- Bold, italic, paragraphs, ordered/bullet lists and code render as intended.
- Numeric citations remain visible, including reference-definition collisions.
- Invitation, document, meeting and email links have correct labels and exact
  destinations; missing or invented links do not become authorized navigation.
- Sentence-ending punctuation, explicit link punctuation and colon-adjacent
  contact labels are preserved correctly.
- Literal mentions, HTML and original evidence do not gain unintended behavior.
- Long answers and multiple sources stay within message and provider budgets;
  truncation preserves the lead, essential action and valid citations.

Verify changed rendering in the authenticated Slack client when implementing a
bot change: inspect visible layout and anchor destinations, not just JSON shape
or a successful API response. Opening an acceptance/submission link is not
necessary to verify its rendering. A documentation-only update needs reference
and skill validation, not posting messages to a live workspace.
