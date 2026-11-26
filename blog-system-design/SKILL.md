---
name: blog-system-design
description: Design, build, or revise a technical blog and changelog as a product system, including its index, navigation, release history, heading links, search, responsive article layout, internal links, and social previews. Use when creating a publication, repairing a missing reading or sharing baseline, or changing shared blog presentation. Pair with ai-devblog for article writing.
---

# Blog System Design

Build a dense, readable technical publication rather than a marketing landing
page. Treat the index, post shell, navigation, typography, and explanatory
components as one reusable reading system.

## Keep the boundary clear

Use `ai-devblog` for choosing an article angle, writing and editing the prose,
selecting article-specific evidence, and publishing a post. Use this skill when
that work requires a new or changed shared layout, navigation model, taxonomy,
search behavior, or reusable component.

One article must not silently redesign the blog. Audit the existing system
first. Reuse a suitable established component; change the system deliberately
when the existing pattern is inadequate.

For a small static TypeScript blog with no suitable existing implementation,
adapt the [runnable starter](assets/static-blog-starter/README.md): it includes the
reading shell, search, stable anchors, related links and social-card generation.
Use the existing site's stack and shell when they already meet the need.

## Audit before designing

Inspect the rendered blog and its implementation at desktop, tablet, and mobile
sizes. Identify:

- content source and metadata schema;
- index, category, archive, and post routes;
- typography, spacing, reading width, and theme tokens;
- navigation, heading anchors, TOC behavior, and keyboard shortcuts;
- existing inline links, related-post metadata, and the archive's internal-link
  graph;
- search corpus and URL state;
- reusable figures, tables, code blocks, callouts, tabs, and playgrounds;
- image provenance, loading behavior, accessibility, and bundle cost.

Preserve durable URLs, feeds, metadata, and existing content contracts. Keep
shared layout code separate from article-owned content and data.

## Information architecture

Provide the smallest useful hierarchy:

1. **Index** — recent and featured posts, full-text search, and clear metadata.
2. **Sections** — stable categories or topics only when they help readers find
   related work. Do not manufacture a large taxonomy from a small archive.
3. **Post** — title, short deck, compact byline, prose, contextual navigation,
   and explanatory components.
4. **Archive/feed** — durable chronological access for readers and machines.

Use one canonical post URL. Make filters shareable through query parameters.
Do not create duplicate routes for visual variants of the same article.

## Pair the devblog with a rich changelog

Keep a dated, chronological release history with durable version fragments;
link recent changes from the devblog index and related posts from the relevant
releases. Link articles back to their release when that relationship is known.

For changelogs and in-app update windows, lead with the **shipped feature**,
then give one sentence about what the reader can now do. Keep both visible.
Put implementation notes behind a native `details`/`summary` disclosure.
Hover can preview the detail. Readers can also open it by click, tap or
keyboard.

Under **Details**, explain how the shipped version achieves the result. Check
the release source for a mechanism, constraint or edge case a reader could
verify. For example, **Copy a chart as PNG** lets you paste a titled chart into
a document. Its detail can say “Smol rebuilds the saved Vega-Lite chart on a
720-pixel-wide canvas and renders it at 2× resolution.”

Consider a real screenshot when a visual change is easier to recognize than
describe. Crop to the relevant control or result, use safe sample data, give
it descriptive alt text and let readers enlarge the thumbnail. A keyboard
shortcut or background fix can often be explained in text alone.

Reconstruct claims from releases, source and verification records. An old entry
describes what shipped then; label subsequent changes, models and unverified
behavior rather than presenting them as current facts. Do not turn unfinished
work into a release or expose private thread content. Give authors a simple,
reusable content model, and ensure disclosures work with keyboard, touch and
without JavaScript. Preserve existing release URLs, query behavior and metadata.
The [static starter](assets/static-blog-starter/README.md) includes a working
example; adapt it to the site's existing stack and content.

## Build intentional internal links

Treat internal linking as part of the publication's information architecture,
not as an SEO afterthought. When adding or substantially revising a post, scan
the existing archive for a small number of relationships that genuinely help a
reader continue the subject.

Use two complementary forms:

- add contextual inline links where an earlier incident, implementation,
  benchmark, or design decision is directly mentioned in the prose;
- store a short ordered list of related-post identifiers in the canonical post
  catalog and render it consistently near the end of the article.

Prefer two or three strong related posts over a long automatically generated
list. Curate for explanatory continuity, not shared keywords alone. Add
reciprocal links when two posts are true counterparts, but do not force every
relationship to be bidirectional. Keep stable post identity separate from link
labels so titles can change without breaking references.

Validate the link graph in tests: every related identifier must resolve to a
public canonical post, lists must not contain duplicates or the current post,
and ordering must be preserved. Render related reading as compact semantic
links with useful context such as category, date, reading time, title, and a
short description. Do not let repeated recommendation cards dominate mobile
reading density.

## Design a useful index

- Prefer a compact two-column list on wide screens and one column on narrow
  screens. Keep titles, category, date, and reading time easy to scan.
- Provide simple client-side full-text search across title, description,
  category, and body when the archive is small enough to ship safely. Use a
  real index or server search when the corpus makes client delivery wasteful.
- Bind `/` to focus search when the reader is not typing. Let `Escape` clear or
  blur it. Show the shortcut beside the field.
- Store non-empty search text in `?q=` with replace-state semantics so filtered
  indexes survive reload, sharing, and browser navigation.
- Show result count, a specific no-match state, and a visible clear action.
- Do not use decorative hero art to make the index feel substantial. Lead with
  the strongest article and its useful description.

## Design the post shell

On wide desktop screens, keep the blog index available in a left rail while the
reader opens a post. Make the rail genuinely useful:

- support pointer resizing with an explicit separator or handle;
- support keyboard resizing or provide equivalent preset widths;
- define sensible minimum, default, and maximum widths;
- offer a labeled minimize/restore control;
- preserve the reader's width preference when the site already persists UI
  preferences;
- transition width and visibility without shifting the reading position.

Use conventional responsive transitions unless the existing site defines
better breakpoints:

- **wide desktop (about 1280px and above):** resizable index rail, article, and
  sticky TOC can coexist;
- **tablet/small desktop (about 768–1279px):** hide the index rail, keep an
  obvious return-to-index action, and use a floating minimized TOC;
- **mobile (below about 768px):** use one reading column, compact masthead and
  back navigation, and a minimized TOC that expands without covering the
  article permanently.

Treat iPhone layouts as first-class rather than a scaled-down desktop. Test at
320, 375, 390, and 430px when the system supports those widths. Keep the article
index rail fully absent, preserve a visible back-to-index path, respect safe-area
insets, keep fixed controls above browser chrome, and prevent expanded TOCs,
tables, code, diagrams, and long titles from forcing horizontal scroll. Stack or
scroll wide evidence locally instead of widening the page.

Generate the TOC from stable heading anchors. Highlight the current section.
Let readers minimize and restore it. Keep it sticky beside the article on wide
screens and floating on narrower screens. Ensure transformed ancestors do not
break fixed positioning.

Give each article section a real fragment ID and a clickable permalink shown
when its heading is hovered or the link receives keyboard focus; show it on
touch devices without requiring hover. Keep it keyboard accessible and label it
for screen readers. Generate TOC and permalinks from the same IDs; preserve
published IDs, support explicit IDs for headings that may be renamed, reserve
authored IDs before generating slugs, and reject duplicate explicit IDs.

## Make social previews work

Give each public post and relevant public landing page a suitable, distinct
social card by default. Generate or select a 1200×630 PNG or JPEG, with readable
article-specific title and meaningful imagery or typography. Keep a social
card separate from any in-article hero; illustration is not evidence.

Emit canonical and absolute `og:url`, `og:title`, `og:description`, `og:type`,
`og:image`, image dimensions and alt text, plus Twitter `summary_large_image`
and image metadata in the initial HTML. Check the deployed image is publicly
fetchable without authentication, returns the correct image MIME type and
dimensions, and looks right at chat-preview size. Audit other public pages when
adding or repairing a shared card system. Existing platform caches may retain
an older preview; distinguish a verified origin from a refreshed chat card.

## Favor compact technical typography

Use a restrained publication such as the Cloudflare blog as inspiration:

- favor a highly legible sans-serif for body copy and a compact display face
  for headings;
- keep desktop body copy around 15–17px with roughly 1.55–1.7 line height;
- use a readable measure, usually 65–80 characters, rather than a narrow
  magazine column or edge-to-edge prose;
- keep article titles prominent but below billboard scale;
- reduce vertical ceremony between deck, byline, opening, headings, figures,
  and paragraphs;
- use monospace for metadata, code, labels, and small navigational indices;
- apply fluid type and spacing with bounded `clamp()` values where appropriate.

Information density does not mean tiny text. Compare how much useful content a
reader can scan in one viewport, then check legibility, hierarchy, and touch
targets.

Measure mobile density by useful facts visible per viewport, not by font size or
the absence of horizontal overflow. Treat repeated tall cards as a design smell.
When each item is a label plus one or two values, use a compact row, table, or
definition list; do not allocate a large bordered panel and centered badge to
every item. As a practical review trigger, redesign repeated mobile cards taller
than roughly 72px unless their content or interaction genuinely needs the space.
Prefer locally scrolling wide evidence over vertically expanding every field.

## Enforce readable contrast

- Meet at least 4.5:1 contrast for normal text and 3:1 for large text, controls,
  focus indicators, and meaningful graphical objects in every supported theme.
- Test semantic foreground/background token pairs programmatically when colors
  are controlled by the site. Do not rely on visual intuition alone.
- Avoid low-opacity labels on tinted panels and text placed directly over chart
  colors without a verified foreground. Use symbols, labels, or patterns in
  addition to color for meaning.
- Check default, hover, active, selected, disabled, and focus states. A readable
  body palette does not excuse low-contrast metadata, legends, captions, or
  keyboard controls.

## Build reusable explanatory components

Prefer semantic, site-native components for recurring forms:

- `Figure` with caption, provenance, and alt text;
- responsive comparison table with a textual mobile treatment;
- code sample, focused diff, and meaningful language label;
- note, caveat, definition, and operator callout;
- tabs for real alternatives, never to hide the only complete example;
- chart or diagram with explicit scale, labels, and textual equivalent;
- interactive playground that exposes the result before interaction and
  supports keyboard, touch, reduced motion, and narrow screens.

Keep component logic and styles feature-owned. Keep article data separate from
rendering. Do not grow one post route or global stylesheet into the permanent
home of every custom visualization.

## Keep visuals information-dense

Editorial illustration is welcome when it contributes a useful idea, memorable
context, or recognizable publication identity. It must not become an enormous
low-information block above the fold. Prefer a compact treatment beside the
opening, later in the article, or in the social card.

Use an information-dense SVG diagram, chart, annotated screenshot, or other
technical visual when the opening needs a hero. Do not generate decorative hero
art unless the user explicitly requests it. Prefer no in-article image over a
vibes image that does not explain, prove, or contextualize anything.

Use, in order of explanatory value:

1. authentic screenshots of the relevant surface;
2. deterministic diagrams, plots, tables, code, and diffs;
3. article-specific interactive demonstrations;
4. editorial photography or illustration only when it carries real context.

Remove any visual that could be swapped for unrelated artwork without changing
the article's meaning.

## Verify the system

Run content, type, lint, link, and production-build checks. Then inspect the
rendered system at representative widths such as 1600, 1280, 1024, 768, 430,
390, 375, and 320px. Verify:

- index density and search behavior, including `/`, `Escape`, `?q=`, empty
  results, and browser back/forward;
- rail resizing, minimum/maximum bounds, minimize/restore, and breakpoint
  hiding;
- TOC anchors, active state, sticky/floating placement, restore control, and
  heading permalinks on hover, keyboard focus, and touch;
- canonical and social metadata and publicly fetchable, correctly sized cards;
- release links, version fragments, historical context and expandable details,
  including keyboard, touch and no-JavaScript behavior;
- contextual internal links and related-post lists, including reciprocal links
  where intended, missing targets, duplicates, self-links, and mobile density;
- title wrapping, reading measure, code overflow, figures, tables, captions,
  and interactive fallbacks;
- no horizontal overflow, obscured text, clipped controls, or layout shifts;
- iPhone safe areas, browser-chrome clearance, fixed-control placement, long
  title wrapping, locally scrolling evidence, and expanded TOC containment;
- visible focus, semantic landmarks, touch targets, reduced motion, and theme
  contrast;
- measured contrast for normal text and controls in light and dark themes;
- mobile information density: compact repeated evidence, multiple useful facts
  per viewport, and no one-card-per-screen status or proof sequences;
- reasonable image and JavaScript weight.

Treat visual inspection as required evidence. A passing build does not prove
that a reading system works. Neither does HTTP 200, an overflow measurement, or
DOM presence. Inspect actual rendered screenshots at the target CSS widths.
