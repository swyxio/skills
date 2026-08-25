---
name: media-heavy-workflows
description: Design or revise a multi-candidate AI media-generation workspace with reference attachment, model/provider capability routing, generation history, or explicit draft-to-publish flows. Use when those workflow concerns are central to the requested product. Do not use for individual canvas tools, ordinary image editing, one-off provider integrations, inference-runtime work, or simple image/video generation without a media workspace.
---

# Media Heavy Workflows

Apply only the patterns required by the requested product; a media operation is
not automatically a media studio.

## Behavioral core

1. Inspect the existing media entrypoint, ownership, provider route, and final
   insertion path. Preserve working behavior and the requested interaction.
2. Distinguish saved references from references actually sent to a model. Honor
   the selected endpoint's supported tasks, input schema, and reference limits.
3. When users compare multiple generated candidates, keep batches and selection
   with their owning artifact; snapshot the prompt, model, and references needed
   to explain each result.
4. Separate generation from publishing only when the product requests a draft
   or review workflow. Direct image-edit actions may update their target
   immediately when undo and existing state semantics are preserved.
5. Make external uploads and material cost visible. Keep provider credentials
   server-side, and require authorization before paid or irreversible actions.
6. Show useful progress or failure state for slow operations. Preserve original
   dimensions and source ownership when the requested operation requires them.
7. Verify only the changed behavior and risks: capability/reference handling,
   intended insertion or publish semantics, privacy, and secret protection.

## Optional specialist guidance

Read `references/media-studio-lessons.md` only when the user actually requests
cast boards, public/celebrity references, multi-provider studios, structured
prompt authoring, specialized media-workspace layouts, or broader studio QA.
Those patterns are recommendations, not prerequisites for unrelated work.
