---
name: new-mac-setup
description: Set up a new Apple-Silicon Mac for development by generating and running an idempotent, user-approved bootstrap for Homebrew, shell tools, language runtimes, containers, editors, and optional AI/media tools. Use for a fresh Mac or an explicit developer-machine bootstrap; do not trigger for installing one package, changing one dotfile, or general macOS troubleshooting.
license: MIT
compatibility: Requires macOS on Apple Silicon (M1/M2/M3/M4), Bash 3.2+, and an internet connection for downloads.
metadata:
  author: swyxio
  version: "2.0"
  last-updated: "2026-06-13"
  hardware: Apple Silicon (M-series)
  primary-stack: TypeScript, Python, AI/ML
---

# New Mac Setup

Generate a repeatable bootstrap for a new Apple-Silicon Mac. Keep the setup
opinionated but user-approved: discover what the user already has, ask what to
skip, and do not install or remove a large software bundle silently.

## Before generating anything

Ask for:

- Git name and email;
- Mac model and RAM, if local-model choices matter;
- categories to include or skip, including Docker Desktop versus Colima and
  terminal/editor preferences; and
- extra tools the user needs.

Do not put credentials in scripts. Explain when an installer may request sudo,
login, or a license acceptance. Keep generated paths explicit and preserve
existing dotfiles unless the user approves replacement or a backup strategy.

## Default run order

Generate standalone, re-runnable scripts in a user-selected directory. Use this
order only for categories the user approved:

```text
01-xcode-and-homebrew.sh  Xcode command-line tools and Homebrew
02-shell-setup.sh         zsh, plugins, and fonts
03-brew-packages.sh       approved formulae and casks
04-dev-environment.sh     fnm/Node, uv/Python, Git, and containers
05-ai-tools.sh            approved CLIs and optional local models
06-dotfiles.sh            shell and terminal configuration
07-macos-settings.sh      explicitly approved defaults
00-run-all.sh             master runner for 01–07
```

Each script must detect existing installations, be safe to rerun after a
partial failure, and report failures with enough context to resume. If the
environment cannot execute the scripts, write them to the requested location
and provide the exact command the user can run.

## Implementation rules that prevent common failures

- Source Homebrew and `fnm` in the master runner; source `fnm` before invoking
  `node` or `npm` in any child script.
- The master runner should continue past an optional package failure and report
  it; a child script may use `set -e` only when its failure handling is clear.
- Use plain ASCII shell quoting. Avoid putting secrets, tokens, or private
  configuration into generated files or clipboard commands.
- Warn before casks or system changes that can prompt for sudo, overwrite
  preferences, or require a GUI login.
- Prefer the user's existing version manager, container runtime, terminal, and
  editor when they are already installed unless the user explicitly opts into
  replacement.

## Concise default categories

Offer, rather than assume, these categories:

- Homebrew, Git/GitHub CLI, `rg`, `fzf`, and other small shell utilities;
- Node via `fnm` with pnpm or bun, Python via `uv`, and the user's required
  language/database tools;
- a container runtime (Colima plus Docker CLI, Docker Desktop, or another
  user-selected runtime);
- a terminal, editor, browser, and communication/productivity apps the user
  names; and
- optional media/AI tools such as `ffmpeg`, `yt-dlp`, local ASR, model runners,
  or agent CLIs.

For local transcription, ML, or diarization, make hardware and runtime costs
explicit. Do not configure a token in a script. Long diarization should use an
appropriate GPU/cloud path or an explicitly approved short CPU test; accepting
model terms and setting `HF_TOKEN` remain user actions.

macOS defaults and GUI settings are optional, reversible where possible, and
must be listed for approval. Do not automatically open a fixed list of apps,
install browser extensions, or impose a complete personal preference profile.
