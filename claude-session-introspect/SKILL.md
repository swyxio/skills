---
name: claude-session-introspect
description: |
  Inspect Claude Code session JSONL files under the configured Claude projects directory to extract token, turn, prompt, tool-use, and compaction telemetry. Load when the user asks for on-disk session statistics or compaction inspection; not for live-context estimates or general JSONL parsing.
license: MIT
compatibility: |
  Requires `jq`. Sessions live at `~/.claude/projects/<encoded-cwd>/<session-uuid>.jsonl`. The encoded-cwd is the absolute working directory with `/` replaced by `-` and a leading `-`. Each line is a JSON object with `type`, `message`, `toolUseResult`, etc.
metadata:
  author: swyxio
  version: "1.0"
  last-updated: "2026-08-11"
  primary-tools: jq, bash
---

# Claude Session Introspect

Claude Code persists every conversation as a JSONL file on disk. This skill is the recipe for opening one and pulling out the numbers you actually want — token usage, prompt counts, compaction events, tool calls — without guessing.

## Where sessions live

```
~/.claude/projects/<encoded-cwd>/<session-uuid>.jsonl
```

`<encoded-cwd>` is the absolute path of the project's working directory with `/` replaced by `-` and a leading `-`. Example: `/Users/swyx/Work/foo` → `-Users-swyx-Work-foo`.

Each line is one event. The interesting `type` values:

| type | what it is |
|---|---|
| `user` | a real user message **OR** a tool result (distinguished by `toolUseResult` being non-null) |
| `assistant` | an assistant turn (one model response). `message.usage` has the token counts. |
| `system` | system messages (mostly compaction-related) |
| `file-history-snapshot` | edited-file snapshots used for undo |
| `attachment` | image/file attachments |
| `permission-mode` | permission mode toggles |

## Quick locate: find the current session

```bash
# 1. encode current working directory
ENC="-$(pwd | sed 's,/,-,g' | sed 's/^-//')"
# 2. list the project's session files, newest first
ls -t "$HOME/.claude/projects/$ENC/"
# 3. the most recent .jsonl is usually the live one
SESSION="$HOME/.claude/projects/$ENC/$(ls -t "$HOME/.claude/projects/$ENC/" | head -1)"
echo "$SESSION"
```

If you know the session UUID (Claude Code shows it, and image-cache paths embed it), you can grep all projects:

```bash
find ~/.claude/projects -name '<uuid>.jsonl'
```

## The headline stats (one-shot)

The `stats.sh` script in this skill folder takes a session path and prints token totals, turn counts, prompt counts, tool-use counts, and any compaction events.

```bash
bash stats.sh "$SESSION"
```

If you don't have the script handy, here are the inline jq one-liners.

### Token totals across the whole session

```bash
jq -s '
  [.[] | select(.message.usage)] |
  {
    assistant_turns: length,
    input_tokens:        (map(.message.usage.input_tokens // 0)              | add),
    output_tokens:       (map(.message.usage.output_tokens // 0)             | add),
    cache_read_tokens:   (map(.message.usage.cache_read_input_tokens // 0)   | add),
    cache_create_tokens: (map(.message.usage.cache_creation_input_tokens // 0)| add)
  }
' "$SESSION"
```

`input_tokens` is the FRESH (non-cached) input. `cache_read_tokens` is the dominant number on long sessions — it's how much was re-read from prompt cache. `cache_create_tokens` is what got newly written into the cache. Effective total tokens processed = `input + cache_read + cache_create`.

### Counts by event type

```bash
jq -r '.type' "$SESSION" | sort | uniq -c
```

### Real human prompts (excluding tool results and system reminders)

A `type:"user"` line is a human message **only if** `toolUseResult` is null. Even then, the content may be a system-injected reminder, not the human's words.

```bash
jq -r '
  select(.type == "user" and .toolUseResult == null) |
  (.message.content
    | if type == "string" then .
      else (map(select(.type == "text") | .text) | join("\n"))
      end)
' "$SESSION" > /tmp/prompts.txt

# total non-empty user message blocks
grep -cv '^$' /tmp/prompts.txt

# distinct human messages = blocks not starting with <system-reminder> or <command-
awk '
  BEGIN { n = 0; cur = "" }
  /^$/ { if (cur != "" && cur !~ /^<system-reminder>/ && cur !~ /^<command-/) n++; cur=""; next }
  { if (cur=="") cur=$0 }
  END { if (cur != "" && cur !~ /^<system-reminder>/ && cur !~ /^<command-/) n++; print n }
' /tmp/prompts.txt
```

(Blunt but works. If you want surgical accuracy, parse the content array and skip blocks whose first text element is a `<system-reminder>` tag.)

### Tool calls — how many and which tools

```bash
jq -r '
  select(.type == "assistant") |
  .message.content[]? |
  select(.type == "tool_use") |
  .name
' "$SESSION" | sort | uniq -c | sort -rn
```

### Compaction boundaries — where, why, and what survived

Compaction inserts a `system` event with `subtype:"compact_boundary"` (older builds may use `isCompactSummary` on the next user message). The summary itself is the *next* user message, prefixed with "This session is being continued from a previous conversation that ran out of context."

```bash
# count compaction events
jq -r 'select(.type=="system" and (.subtype // "") == "compact_boundary") | .timestamp' "$SESSION" | wc -l

# was each one auto or manual?
jq -r '
  select(.type == "system" and (.subtype // "") == "compact_boundary") |
  {ts: .timestamp, trigger: (.compactMetadata.trigger // "unknown"), preTokens: (.compactMetadata.preCompactTokens // null)}
' "$SESSION"

# read the compaction summaries (the actual contents that survived)
jq -r '
  select(.type == "user" and (.isCompactSummary == true or
    ((.message.content // "") | tostring | test("session is being continued from a previous conversation"))))
  | (.message.content | if type == "string" then . else (map(select(.type=="text").text)|join("\n")) end)
' "$SESSION" | less
```

### Per-turn token usage (for spotting blowups)

```bash
jq -r '
  select(.message.usage) |
  [.timestamp,
   (.message.usage.input_tokens // 0),
   (.message.usage.output_tokens // 0),
   (.message.usage.cache_read_input_tokens // 0)]
  | @tsv
' "$SESSION" | column -t
```

This is how you find the one tool result that bloated your context — sort by `cache_read` ascending across the session and watch for the jump.

## Gotchas

- **`type:"user"` is overloaded.** Tool results are also `type:"user"`. Always filter on `toolUseResult == null` to get human turns.
- **`input_tokens` looks tiny on long sessions.** That's correct — it's the *delta* sent uncached. Almost everything flows through `cache_read_input_tokens`.
- **The "live" session file isn't always the newest.** If multiple Claude Code windows are open in the same project, both write to the same project folder. Disambiguate by UUID — the chat header and image-cache paths both expose it.
- **JSONL files grow without bound.** A long-running project folder can have hundreds of session files. `ls -t | head` is your friend.
- **Don't edit a live JSONL.** Claude Code reads it back on `/resume`. If you want to do "brain surgery" (Tal Raviv's term), copy the file out, edit the copy, and use `claude --resume <copied-uuid>` from a clean directory.

## When to reach for this skill

- "How many tokens has this session burned?"
- "How many prompts have I sent today?"
- "Where did compaction kick in and what got summarized?"
- "Which tool call blew up the context?"
- Building a stats display, leaderboard, or "built with Claude Code" badge that needs real numbers.
- Forensics on a session that went sideways — replaying tool calls in order.

## Reference

- Tal Raviv, "I wanted to know how compaction works" — https://www.talraviv.co/p/i-wanted-to-know-how-compaction-works
- Claude Code docs on session storage — `~/.claude/projects/`
