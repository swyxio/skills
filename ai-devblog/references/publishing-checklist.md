# Devblog publishing checklist

Read this reference when the requested endpoint includes preview or
publication. Follow repository instructions and the destination's existing
content model, build, deployment, authorship, and visibility conventions.

## Confirm the endpoint

- State whether the handoff is draft-only, preview-only, internal publication,
  or public publication.
- Confirm the destination and visibility before exposing private material.
- Use the existing human-editable format and metadata schema. Do not introduce
  a new blog framework, author persona, or shared presentation convention for
  one article.
- Use `blog-system-design` when shared navigation, index, taxonomy, typography,
  search, article chrome, responsive behavior, or reusable components change.

## Build and preview

1. Save only the intended post and supporting assets or article-local code.
2. Run the relevant content, type, link, lint, and production-build checks.
3. Open the rendered article rather than reviewing source alone.
4. Inspect desktop and mobile. Also inspect tablet or ultrawide when shared
   layout or unusually wide interactive content changed.
5. Check title, deck, byline, description, date, tags, visibility, canonical
   URL, social card, citations, and navigation.
6. Check code wrapping, tables, asides, long links, captions, footnotes,
   interactive fallbacks, and narrow-screen overflow.

## Inspect evidence and visuals

- Verify every public link and exact-source link that supports a material
  claim.
- Inspect screenshots for secrets, identifiers, irrelevant browser chrome, and
  legibility at rendered size.
- Inspect each explanatory visual against
  [the visual-language reference](visual-language.md): labels, relationships,
  units, scales, colors, clipping, alt text, and static fallback must support
  the stated question.
- Use rendered or structural assertions for components. String-presence checks
  do not prove that a diagram, chart, or interaction works.
- Treat generated imagery as illustration, never as proof.

Do not call a visual article complete when the preview or consequential figures
could not be inspected. Report the incomplete boundary.

## Release and verify

1. Review the final diff and include only intended files.
2. Commit with the destination's normal workflow.
3. Push or merge through the owning path.
4. Observe the actual deployment result.
5. Open the final authorized URL and verify the article, assets, metadata,
   navigation, and binding-dependent or interactive behavior.

Report these as separate facts:

- source written;
- checks passed;
- preview inspected;
- commit created;
- push or merge completed;
- deployment completed;
- final URL verified.

A commit does not prove a push. A push does not prove a deployment. A healthy
URL does not prove the article's technical argument.
