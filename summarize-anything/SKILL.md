---
name: summarize-anything
description: |
  Summarizes arbitrarily long text (1k-1M words) using recursive map-reduce with any LLM backend. Accepts raw text, markdown, transcripts, articles, codebases, or any plaintext input. Produces one or more output formats: executive summary, section headings with timestamps, YouTube description, Twitter/X posts, title options, thumbnail prompts, blog outlines, pull quotes, and more. Supports focus directives ("focus on the AI parts", "emphasize the business angle") to steer the summary. Pluggable backends: OpenRouter, Ollama, OpenAI, Anthropic, Gemini, or any OpenAI-compatible endpoint. Use this skill when someone says "summarize this", "give me a summary", "TL;DR", "make this shorter", "create a YouTube description", "write a tweet about this", "generate titles", "thumbnail ideas", or provides long text and wants any condensed output.
license: MIT
compatibility: |
  Requires curl and one LLM backend. No local dependencies beyond shell tools. For local inference, Ollama must be running. For cloud backends, relevant API keys must be set.
metadata:
  author: swyxio
  version: "1.0"
  last-updated: "2026-03-28"
  primary-tools: curl, jq
---

# Summarize Anything

Recursive map-reduce summarization for arbitrarily long text, with pluggable LLM backends and a wide variety of output formats.

## Setup

### Required

```bash
which curl || echo "curl is required (should be pre-installed on macOS)"
which jq || brew install jq
```

### LLM Backends (at least one required)

```bash
# Local — no API key needed, runs on your machine
# Install Ollama: https://ollama.com
ollama pull llama3.1:8b        # 4.7GB, 128k context
ollama pull qwen2.5:32b        # 18GB, 128k context (if you have RAM)

# Cloud — set the relevant env var
export OPENAI_API_KEY=sk-...           # GPT-4.1 (1M context, $2/M input)
export ANTHROPIC_API_KEY=sk-ant-...    # Claude Sonnet 4 (200k context)
export GEMINI_API_KEY=...              # Gemini 3.1 Pro (1M context, free tier available)
export OPENROUTER_API_KEY=sk-or-...    # Any model via OpenRouter
```

### Verify

```bash
echo "=== Local ==="
curl -s http://localhost:11434/ 2>/dev/null | grep -q "Ollama" && echo "Ollama: running" || echo "Ollama: not running"
ollama list 2>/dev/null | head -5

echo ""
echo "=== Cloud ==="
[ -n "$OPENAI_API_KEY" ] && echo "OpenAI: configured" || echo "OpenAI: not set"
[ -n "$ANTHROPIC_API_KEY" ] && echo "Anthropic: configured" || echo "Anthropic: not set"
[ -n "$GEMINI_API_KEY" ] && echo "Gemini: configured" || echo "Gemini: not set"
[ -n "$OPENROUTER_API_KEY" ] && echo "OpenRouter: configured" || echo "OpenRouter: not set"
```

## How to Use This Skill

### Inputs

1. **Text to summarize** — a file path, piped stdin, or inline text. Any plaintext format: markdown, transcripts, articles, code, logs, etc.
2. **Focus directive** (optional) — a sentence describing what to emphasize. Examples:
   - "focus on the technical architecture decisions"
   - "emphasize the personal story and emotional arc"
   - "extract the actionable advice"
   - "highlight what's relevant to developers"
3. **Output format(s)** — one or more from the output catalog below.
4. **Backend** — which LLM to use (defaults to best available).

### Step 1: Assess the Input

Read the input and estimate its size:

```bash
# Word count
wc -w < input.txt

# Rough token estimate (1 token ≈ 0.75 words)
WORDS=$(wc -w < input.txt | tr -d ' ')
TOKENS=$((WORDS * 4 / 3))
echo "~${TOKENS} tokens"
```

### Step 2: Choose Backend and Strategy

**Backend selection priority** (if user doesn't specify):

| Input Size | Best Backend | Why |
|---|---|---|
| < 50k tokens | Any available | Fits in one call everywhere |
| 50k-150k tokens | Ollama (llama3.1), OpenAI, Anthropic | 128-200k context |
| 150k-500k tokens | Gemini 3.1 Pro, GPT-4.1 | 1M context |
| 500k-1M tokens | Gemini 3.1 Pro, GPT-4.1 | 1M context, may need chunking |
| > 1M tokens | Any (with recursive chunking) | Map-reduce required |

**Strategy selection:**

| Input Size vs Context Window | Strategy |
|---|---|
| Input fits in one call (< 80% of context) | **Direct** — single LLM call |
| Input exceeds context window | **Map-reduce** — chunk, summarize each, then combine |
| Input is 5x+ the context window | **Recursive map-reduce** — may need multiple reduce passes |

### Step 3: Make the LLM Call

#### Backend: OpenAI / OpenAI-Compatible

Works for: OpenAI, OpenRouter, Ollama, Together, Fireworks, any OpenAI-compatible endpoint.

```bash
call_openai_compatible() {
  local BASE_URL="$1"    # e.g., https://api.openai.com/v1
  local API_KEY="$2"
  local MODEL="$3"
  local SYSTEM="$4"
  local USER_MSG="$5"
  local MAX_TOKENS="${6:-4096}"

  curl -s "${BASE_URL}/chat/completions" \
    -H "Authorization: Bearer ${API_KEY}" \
    -H "Content-Type: application/json" \
    -d "$(jq -n \
      --arg model "$MODEL" \
      --arg system "$SYSTEM" \
      --arg user "$USER_MSG" \
      --argjson max_tokens "$MAX_TOKENS" \
      '{
        model: $model,
        temperature: 0.3,
        max_tokens: $max_tokens,
        messages: [
          {role: "system", content: $system},
          {role: "user", content: $user}
        ]
      }')" \
    | jq -r '.choices[0].message.content'
}
```

**Provider-specific configs:**

```bash
# OpenAI
call_openai_compatible "https://api.openai.com/v1" "$OPENAI_API_KEY" "gpt-4.1-mini" "$SYSTEM" "$TEXT"

# OpenRouter
call_openai_compatible "https://openrouter.ai/api/v1" "$OPENROUTER_API_KEY" "google/gemini-3.1-flash" "$SYSTEM" "$TEXT"

# Ollama (local)
call_openai_compatible "http://localhost:11434/v1" "ollama" "llama3.1:8b" "$SYSTEM" "$TEXT"

# Gemini (OpenAI-compatible endpoint)
call_openai_compatible "https://generativelanguage.googleapis.com/v1beta/openai" "$GEMINI_API_KEY" "gemini-3.1-flash" "$SYSTEM" "$TEXT"
```

#### Backend: Anthropic (different format)

```bash
call_anthropic() {
  local MODEL="$1"
  local SYSTEM="$2"
  local USER_MSG="$3"
  local MAX_TOKENS="${4:-4096}"

  curl -s "https://api.anthropic.com/v1/messages" \
    -H "x-api-key: ${ANTHROPIC_API_KEY}" \
    -H "anthropic-version: 2023-06-01" \
    -H "content-type: application/json" \
    -d "$(jq -n \
      --arg model "$MODEL" \
      --arg system "$SYSTEM" \
      --arg user "$USER_MSG" \
      --argjson max_tokens "$MAX_TOKENS" \
      '{
        model: $model,
        temperature: 0.3,
        max_tokens: $max_tokens,
        system: $system,
        messages: [{role: "user", content: $user}]
      }')" \
    | jq -r '.content[0].text'
}

# Usage
call_anthropic "claude-sonnet-4-20250514" "$SYSTEM" "$TEXT" 4096
```

### Step 4: Recursive Map-Reduce (for long inputs)

When the input exceeds the context window, split and summarize recursively.

#### Chunking

```bash
split_into_chunks() {
  local INPUT_FILE="$1"
  local CHUNK_WORDS="${2:-20000}"  # ~26k tokens per chunk
  local OVERLAP_WORDS="${3:-1000}" # ~1.3k tokens overlap
  local OUTPUT_DIR="${4:-.}"

  # Split on paragraph boundaries near the target word count
  python3 << PYEOF
import re, sys, os

with open("${INPUT_FILE}") as f:
    text = f.read()

paragraphs = re.split(r'\n\s*\n', text)
chunks = []
current = []
current_words = 0

for para in paragraphs:
    para_words = len(para.split())
    if current_words + para_words > ${CHUNK_WORDS} and current:
        chunks.append('\n\n'.join(current))
        # Keep last paragraph as overlap
        overlap_paras = []
        overlap_words = 0
        for p in reversed(current):
            pw = len(p.split())
            if overlap_words + pw > ${OVERLAP_WORDS}:
                break
            overlap_paras.insert(0, p)
            overlap_words += pw
        current = overlap_paras
        current_words = overlap_words
    current.append(para)
    current_words += para_words

if current:
    chunks.append('\n\n'.join(current))

for i, chunk in enumerate(chunks):
    with open(f"${OUTPUT_DIR}/chunk_{i:03d}.txt", "w") as f:
        f.write(chunk)

print(f"{len(chunks)} chunks created")
PYEOF
}
```

#### Map Phase

Summarize each chunk independently. The map prompt should be tailored to the final output format — don't throw away information you'll need later.

```
SYSTEM_MAP="You are a precise summarizer. Summarize the following text section.
Preserve: key facts, names, quotes, numbers, timestamps, and narrative arc.
If there are timestamps (like [HH:MM:SS] headers), preserve them.
Compress to roughly 10-15% of the original length.
${FOCUS_DIRECTIVE}"
```

For each chunk:
```bash
for chunk_file in chunk_*.txt; do
  TEXT=$(cat "$chunk_file")
  SUMMARY=$(call_openai_compatible ... "$SYSTEM_MAP" "$TEXT" 4096)
  echo "$SUMMARY" > "${chunk_file%.txt}_summary.txt"
done
```

#### Reduce Phase

Concatenate all chunk summaries and check if they fit in one context window:

```bash
cat chunk_*_summary.txt > combined_summaries.txt
SUMMARY_WORDS=$(wc -w < combined_summaries.txt | tr -d ' ')
SUMMARY_TOKENS=$((SUMMARY_WORDS * 4 / 3))

if [ "$SUMMARY_TOKENS" -gt "$CONTEXT_LIMIT" ]; then
  # Recurse: split combined summaries and map-reduce again
  split_into_chunks combined_summaries.txt ...
  # ... repeat map phase ...
else
  # Final reduce: produce the desired output format(s)
  # Use the output-specific prompts from the Output Catalog below
fi
```

#### Reduce Prompt

```
SYSTEM_REDUCE="You are producing a final summary from section summaries of a longer document.
The sections are in chronological/sequential order.
Synthesize them into a coherent whole — don't just concatenate.
Remove redundancy from overlapping sections.
${FOCUS_DIRECTIVE}
${OUTPUT_FORMAT_INSTRUCTIONS}"
```

### Step 5: Generate Output Format(s)

Use the combined summary (or direct input if it fits) to produce the requested format(s). You can generate multiple formats in a single call by asking for them all, or make separate calls for higher quality.

**For multiple formats in one call** (efficient, good for shorter inputs):
```
Produce ALL of the following from this content:

1. TIMESTAMPS — section headings with timestamps
2. YOUTUBE_DESCRIPTION — optimized for YouTube SEO
3. TWEETS — 3 tweet options
4. TITLES — 5 title options
5. THUMBNAIL_PROMPTS — 3 visual scene descriptions

Format each under a clear heading.
```

**For individual high-quality outputs** (better for long/complex inputs):
Make a separate LLM call for each format using the format-specific prompts below.

---

## Output Catalog

### 1. Executive Summary

A 1-3 paragraph prose summary. The default if no format is specified.

```
PROMPT="Write a concise executive summary of this content in 1-3 paragraphs.
Lead with the single most important takeaway.
Include key names, numbers, and conclusions.
Write in third person, past tense for events, present tense for ongoing states.
${FOCUS_DIRECTIVE}"
```

### 2. Bullet Points (Key Takeaways)

5-15 bullet points, each one sentence.

```
PROMPT="Extract the key takeaways as bullet points.
- Each bullet should be one complete, standalone sentence
- Lead with the most important/surprising points
- Include specific names, numbers, and facts — no vague statements
- Aim for 8-12 bullets
- No sub-bullets
${FOCUS_DIRECTIVE}"
```

### 3. Timestamps / Section Headings

For transcripts with timestamps. Produces chapter markers.

```
PROMPT="Create a timestamped table of contents for this transcript.
Format each entry as:
[HH:MM:SS] Section Title — one-sentence description

Requirements:
- Create 8-20 sections depending on length
- Section titles should be specific and descriptive (not 'Introduction' or 'Discussion')
- Place timestamps at natural topic transitions, not at arbitrary intervals
- Include speaker changes if multiple speakers are present
- The one-sentence description should tell the reader what they'll learn in that section
${FOCUS_DIRECTIVE}"
```

### 4. YouTube Chapters

Like timestamps but formatted for YouTube's chapter feature (first must be 0:00).

```
PROMPT="Create YouTube chapter markers for this transcript.
Format:
0:00 Chapter Title
M:SS Chapter Title
...

Requirements:
- First chapter MUST be 0:00
- Minimum 10 seconds between chapters
- 8-20 chapters depending on length
- Chapter titles should be compelling and specific (think: what would make someone click to that moment)
- Keep titles under 60 characters
- Don't use generic titles like 'Introduction' — be specific about the content
${FOCUS_DIRECTIVE}"
```

### 5. YouTube Description

SEO-optimized description with summary, links, and metadata.

```
PROMPT="Write a YouTube video description optimized for search and engagement.

Structure:
1. Opening hook (1-2 sentences that make people want to watch — front-load keywords)
2. Paragraph summary (3-5 sentences covering the key content)
3. Key topics covered (bulleted list of 5-8 topics, each as a phrase)
4. About the speaker(s) (1-2 sentences each if identifiable)

Requirements:
- Front-load the most searchable keywords in the first 2 lines (YouTube truncates after ~100 chars in search)
- Use natural language, not keyword stuffing
- Include relevant proper nouns (people, companies, technologies)
- Don't include hashtags (they go in a separate field)
- Don't fabricate links or social handles
- Total length: 150-300 words
${FOCUS_DIRECTIVE}"
```

### 6. YouTube Tags / Keywords

```
PROMPT="Generate YouTube tags for this video.
Return as a comma-separated list.
Requirements:
- 15-25 tags
- Mix of broad terms (e.g., 'artificial intelligence') and specific terms (e.g., 'osteosarcoma treatment')
- Include proper nouns (people, companies, products mentioned)
- Include common search variations (e.g., both 'AI' and 'artificial intelligence')
- Order from most to least relevant
- Each tag should be 1-4 words
${FOCUS_DIRECTIVE}"
```

### 7. Twitter/X — Single Post

One tweet, max 280 characters.

```
PROMPT="Write a single tweet (max 280 characters) about this content.
Requirements:
- Must be under 280 characters including any handles or hashtags
- Make it compelling enough to click/engage
- Include the most interesting or surprising angle
- Use 0-2 hashtags (only if they add discoverability, not decoratively)
- Don't start with 'Just watched...' or 'Check out...' — those are boring
- Write 3 options, each with a different angle (hook, insight, controversy/question)
${FOCUS_DIRECTIVE}"
```

### 8. Twitter/X — Thread

A multi-tweet thread for deeper coverage.

```
PROMPT="Write a Twitter/X thread about this content.

Requirements:
- 4-8 tweets, numbered 1/N format
- Tweet 1 (the hook): must be compelling standalone — this is what people see first. End with '🧵' or 'A thread:'
- Each tweet must be under 280 characters
- Each tweet should make a single point and be readable standalone
- Last tweet: the key takeaway or call to action
- Use specific facts, numbers, quotes — not vague summaries
- Don't start every tweet with 'Tweet N:' — vary the structure
${FOCUS_DIRECTIVE}"
```

### 9. LinkedIn Post

Professional tone, engagement-optimized.

```
PROMPT="Write a LinkedIn post about this content.

Requirements:
- Start with a hook line that stops the scroll (a surprising fact, bold claim, or question)
- Use short paragraphs (1-2 sentences each) for mobile readability
- Include a personal angle or reflection if possible
- End with a question to drive comments
- 150-250 words
- Professional but not corporate — authentic voice
- No emojis at the start of lines (LinkedIn cliché)
- Don't use 'I'm excited to share...' or 'Thrilled to announce...'
${FOCUS_DIRECTIVE}"
```

### 10. Title Options

5-10 title variants for different contexts.

```
PROMPT="Generate 10 title options for this content. Include a variety of styles:

1-2: Straightforward/descriptive (what it is)
1-2: Curiosity gap (makes you want to know more)
1-2: Listicle/number-based (if applicable)
1-2: Quote or key phrase from the content
1-2: Bold claim or counterintuitive framing
1: SEO-optimized (front-load keywords)

Requirements:
- Each title under 70 characters (YouTube/Google truncation limit)
- No clickbait that the content doesn't deliver on
- Include the most recognizable proper nouns (people, companies)
- Mark each with its style in brackets, e.g., [curiosity] [descriptive] [quote]
${FOCUS_DIRECTIVE}"
```

### 11. YouTube Thumbnail Prompts

Visual scene descriptions for AI image generation (Midjourney, DALL-E, Flux).

```
PROMPT="Create 5 YouTube thumbnail concepts for this video. For each, provide:

**Concept name:** (2-3 words)
**Visual description:** A detailed scene description suitable as an AI image generation prompt. Include: subject, expression, pose, background, lighting, color palette, and style.
**Overlay text:** 2-4 words of large text to overlay on the thumbnail (the hook)
**Why it works:** One sentence on the psychological hook

Requirements:
- Thumbnails must work at small sizes (mobile) — simple compositions, high contrast
- Use close-up faces with strong emotions where possible (faces get clicks)
- Bright, saturated colors outperform muted ones
- Maximum 2-4 words of overlay text (more than that is unreadable at thumbnail size)
- Include at least one concept that uses contrast/juxtaposition (before/after, problem/solution)
- Include at least one concept that's a close-up face with an expression
- Each concept should be visually distinct from the others
- Reference specific people or scenes from the content where possible
${FOCUS_DIRECTIVE}"
```

### 12. Blog Post Outline

Structured outline for long-form writing.

```
PROMPT="Create a blog post outline based on this content.

Structure:
- Title (compelling, SEO-friendly)
- Subtitle/deck (one sentence expanding the title)
- Introduction hook (2-3 sentences)
- 4-8 main sections, each with:
  - Section heading
  - 2-3 bullet points of what to cover
  - One key quote or data point to include
- Conclusion
- Suggested meta description (under 160 characters)

Requirements:
- The outline should work for a 1500-2500 word blog post
- Section headings should be specific and scannable
- Include enough detail that someone else could write the post from this outline
${FOCUS_DIRECTIVE}"
```

### 13. Pull Quotes

The most quotable, shareable moments.

```
PROMPT="Extract the 5-10 best pull quotes from this content.

For each quote:
- The exact quote (or very close paraphrase if exact wording is unclear)
- Who said it (if identifiable)
- One sentence of context (why this quote matters)

Requirements:
- Quotes should be powerful standalone — someone seeing just the quote should find it compelling
- Prioritize: surprising insights, memorable phrases, emotional moments, contrarian takes
- Include a mix of informational quotes and emotional/personal quotes
- Each quote should be 1-3 sentences max
- If this is a transcript, note the approximate timestamp
${FOCUS_DIRECTIVE}"
```

### 14. One-Sentence Summary (Logline)

A single sentence that captures the essence.

```
PROMPT="Write a single sentence (under 30 words) that captures the essence of this content.
It should answer: what is this about, and why should someone care?
Write 5 options with different angles."
```

### 15. Newsletter Blurb

Short paragraph for email newsletters.

```
PROMPT="Write a newsletter blurb (50-80 words) about this content.
Requirements:
- First sentence is the hook
- Include one specific detail that makes it concrete
- End with why the reader should care or what they'll learn
- Conversational tone, as if recommending to a friend
${FOCUS_DIRECTIVE}"
```

### 16. Show Notes (Podcast Style)

```
PROMPT="Create podcast-style show notes for this content.

Structure:
- Episode title
- One-paragraph summary
- Key topics discussed (bulleted)
- Notable quotes (2-3)
- People mentioned (with brief context for each)
- Resources/links mentioned (note: don't fabricate URLs, just list what was referenced)
- Timestamps for key moments (if available in the source)
${FOCUS_DIRECTIVE}"
```

### 17. All-in-One Content Package

When the user wants everything at once. Make a single call requesting all social/marketing formats:

```
PROMPT="Create a complete content package from this material:

## Logline
One sentence, under 30 words.

## Executive Summary
2-3 paragraphs.

## Key Takeaways
8-12 bullet points.

## YouTube Description
SEO-optimized, 150-300 words.

## YouTube Chapters
Timestamped chapter markers (first must be 0:00).

## Titles
5 options in different styles.

## Tweets
3 single-tweet options (each under 280 chars).

## Twitter Thread
5-8 tweet thread.

## Thumbnail Concepts
3 visual concepts with overlay text suggestions.

## Tags
20 comma-separated keywords.

${FOCUS_DIRECTIVE}"
```

---

## Focus Directives

The focus directive is injected into every prompt to steer the summary. It's a simple sentence appended to the system/user prompt.

**Format:**
```
FOCUS_DIRECTIVE="FOCUS: {user's instruction}"
```

**Examples:**
```
FOCUS: Emphasize the AI and technology aspects.
FOCUS: Focus on the personal/emotional story arc.
FOCUS: Extract only the actionable, tactical advice.
FOCUS: Highlight what's relevant to startup founders.
FOCUS: Focus on the medical/scientific details.
FOCUS: Emphasize the business implications.
FOCUS: Write for a developer audience.
FOCUS: Write for a non-technical audience.
```

If no focus directive is given, omit it entirely (don't say "no specific focus"). The LLM will produce a balanced summary.

---

## Practical Examples

### Example 1: Summarize a transcript file, get YouTube description + chapters

```bash
# Input: a 48-minute transcript markdown file
# Backend: Gemini (free, 1M context — fits in one call)
# Outputs: YouTube description + chapters

TEXT=$(cat transcript.md)
FOCUS="FOCUS: Emphasize the AI and cancer treatment innovation aspects."

SYSTEM="You are creating YouTube metadata from a transcript. Produce TWO sections:

## YouTube Description
SEO-optimized, 150-300 words. Front-load keywords.

## YouTube Chapters
0:00 format, 10-20 chapters, specific titles under 60 chars."

call_openai_compatible \
  "https://generativelanguage.googleapis.com/v1beta/openai" \
  "$GEMINI_API_KEY" \
  "gemini-3.1-flash" \
  "$SYSTEM" \
  "${TEXT}\n\n${FOCUS}" \
  8192
```

### Example 2: Summarize a 200k-word document with local Ollama

```bash
# Input exceeds 128k context — needs map-reduce
# Backend: Ollama with llama3.1:8b
# Output: Executive summary

# Step 1: Chunk
split_into_chunks "huge_document.txt" 15000 1000 /tmp/chunks

# Step 2: Map
for f in /tmp/chunks/chunk_*.txt; do
  TEXT=$(cat "$f")
  SUMMARY=$(call_openai_compatible \
    "http://localhost:11434/v1" "ollama" "llama3.1:8b" \
    "Summarize this section. Preserve key facts, names, numbers." \
    "$TEXT" 2048)
  echo "$SUMMARY" > "${f%.txt}_summary.txt"
done

# Step 3: Reduce
COMBINED=$(cat /tmp/chunks/chunk_*_summary.txt)
FINAL=$(call_openai_compatible \
  "http://localhost:11434/v1" "ollama" "llama3.1:8b" \
  "Synthesize these section summaries into a coherent 3-paragraph executive summary. Remove redundancy." \
  "$COMBINED" 2048)
echo "$FINAL"
```

### Example 3: Generate all social content from a podcast transcript

```bash
TEXT=$(cat podcast_transcript.md)

# Use the all-in-one content package prompt (Output #17)
call_openai_compatible \
  "https://api.openai.com/v1" "$OPENAI_API_KEY" "gpt-4.1-mini" \
  "$ALL_IN_ONE_PROMPT" \
  "$TEXT" \
  8192 > content_package.md
```

---

## Troubleshooting

### LLM returns truncated output
The `max_tokens` is too low for the requested output. Increase it:
- Single format: `4096` is usually enough
- Multiple formats: use `8192-16384`
- All-in-one package: use `16384`

### Map-reduce produces incoherent summaries
The chunks are too small or the overlap is too narrow. Increase `CHUNK_WORDS` and `OVERLAP_WORDS`. Also ensure the map prompt asks to preserve narrative arc and transitions.

### Hallucinated facts in summary
Lower the temperature to `0.1-0.2`. Add to the prompt: "Only include information explicitly stated in the text. Do not add external knowledge or infer unstated facts."

### Ollama is slow on long input
Local models on CPU are slow with long context. Options:
- Use a smaller model (`llama3.1:8b` instead of `70b`)
- Chunk more aggressively (smaller `CHUNK_WORDS`)
- Switch to a cloud backend for the reduce phase (local map, cloud reduce)

### Anthropic 400 error: max_tokens required
The Anthropic API requires `max_tokens` to be explicitly set (unlike OpenAI where it's optional). Always pass it.

### OpenRouter rate limit
Add a small delay between calls: `sleep 1` between chunk processing. Or use a local backend for the map phase and OpenRouter only for the final reduce.

## Backend Comparison

| Backend | Config | Best Model | Context | Cost |
|---------|--------|-----------|---------|------|
| Ollama (local) | `http://localhost:11434/v1` | llama3.1:8b | 128k | Free |
| OpenAI | `https://api.openai.com/v1` | gpt-4.1-mini | 1M | $0.40/M in |
| Anthropic | Custom format | claude-sonnet-4 | 200k | $3/M in |
| Gemini | `https://generativelanguage.googleapis.com/v1beta/openai` | gemini-3.1-flash | 1M | Free tier / $0.15/M in |
| OpenRouter | `https://openrouter.ai/api/v1` | any model | varies | varies |

**Recommendation for most users:** Gemini 3.1 Flash via the OpenAI-compatible endpoint. Free tier, 1M context (no chunking needed for most inputs), fast, good quality.
