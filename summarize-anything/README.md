# Summarize Anything

Recursive map-reduce summarization for text of any length (1k-1M words). Pluggable LLM backends, 17 output formats, and optional focus directives to steer what gets emphasized.

## Setup

```bash
which jq || brew install jq
```

Plus at least one LLM backend:

```bash
# Local (free, no API key)
ollama pull llama3.1:8b

# Cloud (set any of these)
export GEMINI_API_KEY=...          # Recommended: free tier, 1M context
export OPENAI_API_KEY=sk-...       # GPT-4.1, 1M context
export ANTHROPIC_API_KEY=sk-ant-...# Claude Sonnet 4, 200k context
export OPENROUTER_API_KEY=sk-or-...# Any model via proxy
```

**Recommended default:** Gemini 3.1 Flash — free tier, 1M context window (most inputs fit in a single call without chunking), and it has an OpenAI-compatible endpoint.

## Problem

Long-form content (transcripts, articles, documents) needs to be repurposed into many formats: YouTube descriptions, tweets, blog outlines, chapter markers. Doing this manually is tedious. Doing it with an LLM is straightforward for short text but breaks down when the input exceeds the context window.

## What This Skill Does

1. Estimates input size and picks the right strategy (direct call vs. recursive map-reduce)
2. Chunks long text on paragraph boundaries with overlap to avoid losing context
3. Summarizes with any LLM backend via a unified calling convention
4. Produces any combination of 17 output formats from a single input
5. Accepts focus directives to steer emphasis ("focus on the AI parts")

## Output Formats

| # | Format | Use Case |
|---|--------|----------|
| 1 | Executive summary | Default, 1-3 paragraphs |
| 2 | Bullet points | Key takeaways, 8-12 bullets |
| 3 | Timestamps / section headings | Table of contents for transcripts |
| 4 | YouTube chapters | `0:00` format for YouTube's chapter feature |
| 5 | YouTube description | SEO-optimized, 150-300 words |
| 6 | YouTube tags | 15-25 comma-separated keywords |
| 7 | Tweet (single) | 3 options, each under 280 chars |
| 8 | Twitter thread | 4-8 tweet thread |
| 9 | LinkedIn post | Professional, engagement-optimized |
| 10 | Title options | 10 variants in different styles |
| 11 | Thumbnail prompts | Visual scene descriptions for AI image gen |
| 12 | Blog post outline | Structured outline for 1500-2500 words |
| 13 | Pull quotes | 5-10 most quotable moments |
| 14 | Logline | Single sentence, under 30 words |
| 15 | Newsletter blurb | 50-80 words for email |
| 16 | Show notes | Podcast-style episode notes |
| 17 | All-in-one package | Everything above in one call |

## Strategy by Input Size

| Input | Strategy |
|-------|----------|
| < 50k tokens (~37k words) | Direct — single LLM call |
| 50k-1M tokens | Direct with Gemini/GPT-4.1 (1M context) |
| > 1M tokens | Recursive map-reduce with any backend |

## Focus Directives

Steer what the summary emphasizes:

```
"focus on the technical architecture decisions"
"emphasize the personal story and emotional arc"
"extract the actionable advice for startup founders"
"highlight what's relevant to developers"
```

See SKILL.md for the full prompt catalog, LLM calling functions, chunking implementation, and troubleshooting.
