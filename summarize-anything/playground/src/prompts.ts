import type { PromptTemplate } from "./types";

export const PROMPTS: Record<string, PromptTemplate> = {
  executive_summary: {
    name: "Executive Summary",
    description: "1-3 paragraph prose summary",
    template: `Write a concise executive summary of this content in 1-3 paragraphs.
Lead with the single most important takeaway.
Include key names, numbers, and conclusions.
Write in third person, past tense for events, present tense for ongoing states.
{FOCUS}`,
  },
  bullet_points: {
    name: "Bullet Points",
    description: "8-12 key takeaways",
    template: `Extract the key takeaways as bullet points.
- Each bullet should be one complete, standalone sentence
- Lead with the most important/surprising points
- Include specific names, numbers, and facts — no vague statements
- Aim for 8-12 bullets
- No sub-bullets
{FOCUS}`,
  },
  timestamps: {
    name: "Timestamps / Sections",
    description: "Timestamped table of contents",
    template: `Create a timestamped table of contents for this transcript.
Format each entry as:
[HH:MM:SS] Section Title — one-sentence description

Requirements:
- Create 8-20 sections depending on length
- Section titles should be specific and descriptive (not 'Introduction' or 'Discussion')
- Place timestamps at natural topic transitions, not at arbitrary intervals
- Include speaker changes if multiple speakers are present
- The one-sentence description should tell the reader what they'll learn in that section
{FOCUS}`,
  },
  youtube_chapters: {
    name: "YouTube Chapters",
    description: "0:00 format chapter markers",
    template: `Create YouTube chapter markers for this transcript.
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
{FOCUS}`,
  },
  youtube_description: {
    name: "YouTube Description",
    description: "SEO-optimized, 150-300 words",
    template: `Write a YouTube video description optimized for search and engagement.

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
{FOCUS}`,
  },
  youtube_tags: {
    name: "YouTube Tags",
    description: "15-25 comma-separated keywords",
    template: `Generate YouTube tags for this video.
Return as a comma-separated list.
Requirements:
- 15-25 tags
- Mix of broad terms and specific terms
- Include proper nouns (people, companies, products mentioned)
- Include common search variations
- Order from most to least relevant
- Each tag should be 1-4 words
{FOCUS}`,
  },
  tweet_single: {
    name: "Tweet (Single)",
    description: "3 tweet options, each under 280 chars",
    template: `Write a single tweet (max 280 characters) about this content.
Requirements:
- Must be under 280 characters including any handles or hashtags
- Make it compelling enough to click/engage
- Include the most interesting or surprising angle
- Use 0-2 hashtags (only if they add discoverability)
- Don't start with 'Just watched...' or 'Check out...'
- Write 3 options, each with a different angle (hook, insight, controversy/question)
{FOCUS}`,
  },
  twitter_thread: {
    name: "Twitter Thread",
    description: "4-8 tweet thread",
    template: `Write a Twitter/X thread about this content.

Requirements:
- 4-8 tweets, numbered 1/N format
- Tweet 1 (the hook): must be compelling standalone. End with a thread indicator.
- Each tweet must be under 280 characters
- Each tweet should make a single point and be readable standalone
- Last tweet: the key takeaway or call to action
- Use specific facts, numbers, quotes — not vague summaries
- Don't start every tweet with 'Tweet N:' — vary the structure
{FOCUS}`,
  },
  linkedin_post: {
    name: "LinkedIn Post",
    description: "Professional, 150-250 words",
    template: `Write a LinkedIn post about this content.

Requirements:
- Start with a hook line that stops the scroll (surprising fact, bold claim, or question)
- Use short paragraphs (1-2 sentences each) for mobile readability
- Include a personal angle or reflection if possible
- End with a question to drive comments
- 150-250 words
- Professional but not corporate — authentic voice
- No emojis at the start of lines
- Don't use 'I'm excited to share...' or 'Thrilled to announce...'
{FOCUS}`,
  },
  title_options: {
    name: "Title Options",
    description: "10 variants in different styles",
    template: `Generate 10 title options for this content. Include a variety of styles:

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
{FOCUS}`,
  },
  thumbnail_prompts: {
    name: "Thumbnail Prompts",
    description: "5 visual concepts for AI image gen",
    template: `Create 5 YouTube thumbnail concepts for this video. For each, provide:

**Concept name:** (2-3 words)
**Visual description:** A detailed scene description suitable as an AI image generation prompt. Include: subject, expression, pose, background, lighting, color palette, and style.
**Overlay text:** 2-4 words of large text to overlay on the thumbnail (the hook)
**Why it works:** One sentence on the psychological hook

Requirements:
- Thumbnails must work at small sizes (mobile) — simple compositions, high contrast
- Use close-up faces with strong emotions where possible (faces get clicks)
- Bright, saturated colors outperform muted ones
- Maximum 2-4 words of overlay text
- Include at least one concept that uses contrast/juxtaposition
- Include at least one concept that's a close-up face with an expression
- Each concept should be visually distinct
- Reference specific people or scenes from the content where possible
{FOCUS}`,
  },
  blog_outline: {
    name: "Blog Outline",
    description: "Structured outline for 1500-2500 words",
    template: `Create a blog post outline based on this content.

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
{FOCUS}`,
  },
  pull_quotes: {
    name: "Pull Quotes",
    description: "5-10 most quotable moments",
    template: `Extract the 5-10 best pull quotes from this content.

For each quote:
- The exact quote (or very close paraphrase if exact wording is unclear)
- Who said it (if identifiable)
- One sentence of context (why this quote matters)

Requirements:
- Quotes should be powerful standalone
- Prioritize: surprising insights, memorable phrases, emotional moments, contrarian takes
- Include a mix of informational and emotional quotes
- Each quote should be 1-3 sentences max
- If this is a transcript, note the approximate timestamp
{FOCUS}`,
  },
  logline: {
    name: "Logline",
    description: "Single sentence, under 30 words",
    template: `Write a single sentence (under 30 words) that captures the essence of this content.
It should answer: what is this about, and why should someone care?
Write 5 options with different angles.
{FOCUS}`,
  },
  newsletter_blurb: {
    name: "Newsletter Blurb",
    description: "50-80 words for email",
    template: `Write a newsletter blurb (50-80 words) about this content.
Requirements:
- First sentence is the hook
- Include one specific detail that makes it concrete
- End with why the reader should care or what they'll learn
- Conversational tone, as if recommending to a friend
{FOCUS}`,
  },
  show_notes: {
    name: "Show Notes",
    description: "Podcast-style episode notes",
    template: `Create podcast-style show notes for this content.

Structure:
- Episode title
- One-paragraph summary
- Key topics discussed (bulleted)
- Notable quotes (2-3)
- People mentioned (with brief context for each)
- Resources/links mentioned (note: don't fabricate URLs, just list what was referenced)
- Timestamps for key moments (if available in the source)
{FOCUS}`,
  },
  all_in_one: {
    name: "All-in-One Package",
    description: "Everything in one call",
    template: `Create a complete content package from this material:

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

{FOCUS}`,
  },
};

export const FORMAT_IDS = Object.keys(PROMPTS);

export function buildSystemPrompt(template: string, focusDirective: string): string {
  if (focusDirective.trim()) {
    return template.replace("{FOCUS}", `FOCUS: ${focusDirective.trim()}`);
  }
  return template.replace(/\n?\{FOCUS\}/, "");
}
