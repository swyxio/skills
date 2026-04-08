# claude-session-introspect

Pull real telemetry from Claude Code session JSONL files at `~/.claude/projects/`. See [SKILL.md](./SKILL.md) for the full recipe and `stats.sh` for the one-shot.

## Origin & acknowledgments

This skill exists because of **Tal Raviv's** article ["I wanted to know how compaction works"](https://www.talraviv.co/p/i-wanted-to-know-how-compaction-works), which first walked through opening the on-disk session JSONLs and doing "brain surgery" on a Claude Code conversation. The shape of this skill — the encoded-cwd path scheme, the compaction-boundary inspection, the framing of the JSONL as the conversation's source of truth — all comes from that piece. Read it.

The immediate trigger was building a "built with Claude Code" stats strip on a side project (Clank). I had inlined a bunch of `jq` one-liners against my own session file to pull token counts, prompt counts, and tool-call histograms, and realized the recipe was worth saving as a reusable skill rather than re-deriving it next time.

## Quick start

```bash
# auto-locate the newest session for $PWD
bash stats.sh

# or pass a path / uuid
bash stats.sh ~/.claude/projects/-Users-you-Work-foo/abc123.jsonl
bash stats.sh abc123-def456-...
```

Requires `jq`. Output: token totals (input / output / cache reads / cache writes), assistant turn count, human prompt count, top tool calls, and any compaction events.
