# Building a Virtual Filesystem for a Documentation Assistant

Source: [Mintlify, "How we built a virtual filesystem for our Assistant"](https://www.mintlify.com/blog/how-we-built-a-virtual-filesystem-for-our-assistant) by Dens Sumesh, published March 24, 2026.

This is a clean markdown reference version for the `public-qa-chatbot` skill. It is intentionally paraphrased and implementation-focused rather than a verbatim copy of the source article.

## Core Problem

Plain RAG is useful until users ask questions that require behavior closer to browsing a docs repo:

- The answer spans multiple pages.
- The user needs exact syntax, names, or parameters.
- The relevant page does not land in the top-k semantic retrieval results.
- The model needs to compare pages or inspect surrounding context.

Mintlify's conclusion: a docs assistant should sometimes explore the knowledge base the way a developer explores a codebase. The useful interface is not just "retrieve similar chunks"; it is a small read-only filesystem with familiar operations such as `ls`, `cat`, `find`, and `grep`.

## Why Not Use Real Sandboxes?

The obvious implementation is to start an isolated sandbox, clone the docs repo, and let the agent run shell commands. That works for asynchronous background agents, but it is too slow and expensive for an in-page assistant where a user is waiting.

The source article reports:

- P90 sandbox session creation, including repository setup, was about 46 seconds.
- A naive micro-VM approach for hundreds of thousands of monthly conversations would create meaningful annual infrastructure cost.
- The target user experience needed session setup closer to instant.

The key design move was to preserve the shell/filesystem workflow while removing the real sandbox.

## ChromaFs Pattern

Mintlify built a virtual filesystem over the documentation index they already had in Chroma.

Instead of giving the agent a real filesystem, ChromaFs intercepts filesystem-like operations and translates them into database queries or memory lookups. The assistant still experiences paths and commands, but the backend is an indexed docs store.

Reported result:

| Metric | Real sandbox | Virtual filesystem |
|---|---:|---:|
| P90 boot time | about 46 seconds | about 100 milliseconds |
| Marginal compute | per-session sandbox cost | reuses existing database |
| Search path | scan files | query metadata/content index |
| Access control | OS/container permissions | metadata filters before retrieval |

## Shell Parsing Layer

Mintlify used Vercel Labs' `just-bash`, a TypeScript implementation of common shell behavior. The value is that command parsing, piping, flags, and shell semantics can be delegated to a library, while the backing `IFileSystem` is custom.

For a chatbot skill, the same concept can be implemented either as:

- A narrow tool set: `list_docs`, `read_doc`, `find_docs`, `search_docs_exact`.
- A shell-like tool backed by a virtual filesystem.

Prefer narrow tools for public widgets unless the assistant truly needs shell composition. Narrow tools are easier to validate, secure, observe, and rate-limit.

## Path Tree Index

The virtual filesystem needs to know what paths exist before the agent asks for them. Mintlify stores a path tree as a compact JSON document in the same collection as the indexed docs.

An adapted manifest shape:

```json
{
  "auth/oauth": {
    "isPublic": true,
    "groups": []
  },
  "auth/api-keys": {
    "isPublic": true,
    "groups": []
  },
  "internal/billing": {
    "isPublic": false,
    "groups": ["admin", "billing"]
  },
  "api-reference/endpoints/users": {
    "isPublic": true,
    "groups": []
  }
}
```

At initialization, convert the manifest into:

- `Set<string>` for valid paths.
- `Map<string, string[]>` for directory children.
- Optional aliases for title-based lookup.

Then `ls`, `cd`, path validation, and basic `find` can run in memory without a network round trip. Cache the tree by docs site and docs version.

## Access Control

Access control should happen before the model sees the path tree.

For each request/session:

1. Read the user's tenant, role, plan, groups, or public/anonymous status.
2. Prune hidden paths from the tree.
3. Apply the same visibility filter to every chunk, semantic, exact-search, and page-read query.
4. Omit inaccessible paths entirely rather than returning "permission denied" for paths the assistant should not know exist.

For public Q&A bots, this prevents draft, internal, unpublished, or customer-only docs from leaking through tool calls.

## Reassembling Pages From Chunks

Vector indexes often store page chunks, not full pages. That is good for semantic discovery but weak for exact answers.

When the assistant runs a page read operation such as `cat /auth/oauth.mdx`, fetch all chunks for that page, sort them by chunk order, and join them into the original page text.

Implementation pattern:

```ts
async function readDoc(path: string, docsVersion: string) {
  const chunks = await fetchChunks({ path, docsVersion });

  return chunks
    .sort((a, b) => a.chunkIndex - b.chunkIndex)
    .map((chunk) => chunk.text)
    .join("\n\n");
}
```

Cache full-page reads by `{ path, docsVersion }` so repeated `cat` and `grep` workflows do not keep hitting the database.

## Lazy Files

Not every file has to live in the vector database.

For large assets such as OpenAPI specs or generated reference JSON:

- Register a path pointer in the tree.
- Show the file in `ls`.
- Fetch the content lazily when `read_doc` or `cat` is called.
- Cache the resolved content by path and version.

This gives the assistant a complete docs filesystem view without loading every large artifact into the default retrieval index.

## Read-Only Enforcement

Every write operation should fail.

Use an `EROFS`-style read-only error for operations such as `write`, `rm`, `mv`, `mkdir`, or shell redirection. The assistant can explore freely, but it cannot mutate docs, corrupt state, or create cleanup requirements.

For public chatbot infrastructure, read-only behavior also reduces the need for per-user sandboxes.

## Optimizing Grep

Recursive exact search is the expensive part if implemented naively. Scanning every file over the network is too slow.

Mintlify's pattern:

1. Parse the grep command and flags.
2. Translate fixed-string or regex intent into datastore filters.
3. Use the database as a coarse filter to find candidate pages.
4. Bulk prefetch candidate chunks into cache.
5. Run exact string or regex matching in memory.
6. Return the precise matching paths/snippets.

For a public chatbot, expose this as `search_docs_exact(pattern, { regex, path })`. Log both candidate count and final hit count so you can tune filters and detect expensive searches.

## When To Use This Pattern

Use a virtual docs filesystem when:

- The knowledge base has many pages with stable paths.
- Users ask precise technical questions.
- Correct answers require full-page context or cross-page synthesis.
- You need source-grounded citations.
- Plain semantic retrieval misses too often.
- A real sandbox would be too slow or too costly.

Avoid it when:

- The bot answers from a short FAQ.
- The source material is small enough to fit in prompt context.
- Users mostly ask broad natural-language questions.
- You do not have stable paths or chunk metadata.

## Public Q&A Chatbot Upgrade Checklist

- Generate a docs path manifest during indexing.
- Store visibility metadata on both paths and chunks.
- Load access-pruned path trees into memory at session start.
- Expose `list_docs`, `read_doc`, `find_docs`, and `search_docs_exact` as constrained tools.
- Reassemble full pages from sorted chunks for `read_doc`.
- Cache path trees and full-page reads by docs version.
- Implement coarse-to-fine exact search for `grep`-style queries.
- Enforce read-only behavior for all mutation attempts.
- Trace retrieval tool calls separately from LLM calls.
- Keep normal semantic search as the first-pass tool for broad questions.

## Skill Takeaway

The upgrade is not "replace RAG." The upgrade is to add a second retrieval mode for documentation-backed bots:

> Semantic search for discovery, virtual filesystem tools for inspection.

That combination lets the assistant behave less like a chunk retriever and more like a docs expert who can browse, search, verify, and cite the underlying source material.
