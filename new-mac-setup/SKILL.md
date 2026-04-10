---
name: new-mac-setup
description: |
  Fully automated new Mac setup for fullstack web developers and AI engineers. Generates and executes idempotent shell scripts to install dev tools, CLI utilities, GUI apps, AI/ML tooling, shell config, and macOS preferences — all via Homebrew, fnm, uv, and defaults commands. Use this skill whenever someone says "set up my Mac", "new Mac setup", "configure my dev machine", "install my dev tools", "fresh Mac install", "developer environment setup", or anything about bootstrapping a macOS machine for development. Also trigger when someone mentions setting up Homebrew, Oh-My-ZSH, Node.js, Python, Docker, or terminal configuration on a new Mac — even if they don't call it a "setup". This skill is opinionated and based on real-world experience setting up M-series Macs for fullstack JS/TS + Python + AI development.
license: MIT
compatibility: |
  Requires macOS on Apple Silicon (M1/M2/M3/M4). Scripts use Homebrew, which handles all dependencies. Bash 3.2+ (ships with macOS). Internet connection required for package downloads.
metadata:
  author: swyxio
  version: "2.0"
  last-updated: "2026-03-26"
  hardware: Apple Silicon (M-series)
  primary-stack: TypeScript, Python, AI/ML
---

# New Mac Setup

This skill generates and runs a complete, idempotent Mac setup for fullstack web development and AI engineering. It produces 8 shell scripts that can be run individually or via a master runner, plus dotfiles and macOS preference automation.

The scripts are designed to be re-runnable — they check whether each tool is already installed before attempting installation, so you can safely run them again if something fails partway through.

## Philosophy

The setup is opinionated. The core opinions:

- **Terminal**: Ghostty (fast, GPU-accelerated, Zig) + cmux (vertical tabs, split panes, socket API for AI agents). cmux reads Ghostty's config, so one config file serves both.
- **Shell**: ZSH with Oh-My-ZSH, powerlevel10k theme, zsh-autosuggestions, zsh-syntax-highlighting
- **Node**: fnm (not nvm — fnm is faster), pnpm and bun for package management/runtime
- **Python**: uv from Astral (not pyenv, not pip, not conda — uv is dramatically faster and handles both venvs and package installs)
- **Docker**: Colima (not Docker Desktop — lighter weight, CLI-native, free)
- **Editor**: Cursor (AI-native editor)
- **AI tools**: Claude Code, Codex CLI, Railway CLI, Ollama for local models
- **Agent notifications**: peon-ping shared across Claude Code, Codex, and Cursor, tuned to notify only when useful
- **Browser**: Dia (from The Browser Company, successor to Arc)
- **Launcher**: Raycast (replaces Alfred, Spotlight, Caffeine, window management)
- **Voice**: Wispr Flow for voice-to-text
- **Screenshots**: Shottr (includes OCR)

## How to Use This Skill

### Step 1: Interview the User

Before generating scripts, ask the user a few questions to customize the setup. Key things to learn:

1. **Git identity**: name and email for `git config`
2. **Hardware**: Which Mac model / how much RAM? (affects which Ollama models to pull)
3. **What to skip**: Do they want everything, or should certain categories be excluded? (e.g., "no Elixir", "no PostgreSQL", "I use Docker Desktop not Colima")
4. **Additions**: Any apps or tools not in the default list?
5. **Terminal preference**: Ghostty + cmux is the default, but they may want something else

For RAM-based Ollama model recommendations:
- **8GB**: qwen3.5:4b, qwen2.5-coder:3b
- **16GB**: qwen3.5:9b, qwen2.5-coder:7b
- **24GB**: qwen3.5:27b, qwen2.5-coder:14b (best sweet spot)
- **32GB+**: qwen3.5:35b, qwen2.5-coder:32b

### Step 2: Generate the Scripts

Generate 8 scripts into the user's chosen directory. Each script is standalone and idempotent. Use the templates in `scripts/` as the base, customizing per the user's answers.

The scripts should run in this order:

```
01-xcode-and-homebrew.sh   # Xcode CLI tools + Homebrew (15-25 min)
02-shell-setup.sh          # Oh-My-ZSH + plugins + fonts
03-brew-packages.sh        # All brew formulae + cask apps
04-dev-environment.sh      # Node (fnm), Python (uv), Git, Docker
05-ai-tools.sh             # Claude Code, Codex CLI, Ollama models, llama.cpp
06-dotfiles.sh             # .zshrc + Ghostty config
07-macos-settings.sh       # System preferences via defaults commands
00-run-all.sh              # Master runner (runs 01-07 in order)
```

### Step 3: Execute

If possible, execute the scripts directly. If running in a VM/sandbox that can't reach the user's Mac, write the scripts to the workspace folder and put a one-liner in the clipboard:

```bash
cd /path/to/scripts && chmod +x ./*.sh && bash ./00-run-all.sh
```

## Lessons Learned (Bugs to Avoid)

These are real issues encountered during testing. The scripts in `scripts/` already incorporate these fixes, but if you're generating fresh scripts, keep these in mind:

1. **fnm needs sourcing before npm works.** After installing Node via fnm, the current shell doesn't have `npm` in PATH until you run `eval "$(fnm env --use-on-cd)"`. Every script that uses npm/node must source fnm first.

2. **Don't use `set -e` in the master runner.** If one script fails (e.g., a brew cask 404s), `set -e` kills the entire pipeline. Individual scripts can use `set -e` if they handle errors gracefully, but the master runner should not.

3. **Source brew and fnm in the master runner.** Add these lines near the top of `00-run-all.sh` so all child scripts inherit them:
   ```bash
   eval "$(/opt/homebrew/bin/brew shellenv)" 2>/dev/null || true
   eval "$(fnm env --use-on-cd)" 2>/dev/null || true
   ```

4. **Smart quotes break shell commands.** If writing commands to the clipboard, avoid curly/smart quotes. Use simple ASCII quotes only, or avoid quotes entirely where possible. The safest clipboard commands are single simple statements like `bash ./07-macos-settings.sh`.

5. **Zoom and some casks require sudo.** The Zoom installer triggers a `Password:` prompt. The user needs to be warned that some cask installs will pause for their password.

6. **brew install yarn --ignore-dependencies** is needed if Node is managed by fnm (not brew). Otherwise brew tries to install its own Node as a yarn dependency.

7. **Ghostty config location**: `~/.config/ghostty/config`. cmux reads this same file.

## Default Package Lists

### Homebrew Formulae (CLI tools)

```
# Core dev tools
gh, git, fnm, pnpm, bun, z, diff-so-fancy

# Languages & runtimes
elixir, erlang, python@3.13

# Docker (no Docker Desktop)
colima, docker, docker-completion

# Media & processing
ffmpeg, yt-dlp, tesseract

# Build dependencies
openssl@3, readline, sqlite, xz, zstd

# Databases
postgresql@14, rabbitmq

# Misc CLI
honcho, pipx, flyctl, entr, tig, mas, terminal-notifier

# Libraries
cairo, glib, harfbuzz, libvmaf, webp
```

### Homebrew Casks (GUI apps)

```
# Terminal
ghostty

# Editors
cursor, visual-studio-code

# Browser
thebrowsercompany-dia

# Communication
slack, discord, zoom

# Productivity
raycast, rectangle, obsidian, notion, notion-calendar

# AI & ML
ollama

# Media
vlc, audacity, loom, descript

# Utilities
shottr, notunes, caffeine, stretchly, quickshade, pure-paste, 1password

# Dev tools
beeper, superhuman
```

Plus cmux via: `brew tap manaflow-ai/cmux && brew install --cask cmux`

## Claude-Suggested Additions (March 2026)

These tools were suggested by Claude during the initial setup session and accepted by the user. They are now part of the default install in `03-brew-packages.sh`:

1. **fzf** — Fuzzy finder that transforms shell history (Ctrl+R), file search, and git branch selection. Pairs perfectly with zsh-autosuggestions. `brew install fzf`
2. **ripgrep** (`rg`) — Blazingly fast grep replacement. Respects .gitignore, searches recursively by default. Essential for any developer. `brew install ripgrep`
3. **bat** — `cat` with syntax highlighting, line numbers, and git integration. Makes reading code files in terminal beautiful. `brew install bat`
4. **zoxide** — Drop-in `z` replacement with a smarter frecency algorithm and fuzzy matching. Same muscle memory, better results. `brew install zoxide`
5. **Orbstack** — Even lighter than Colima for Docker containers and Linux VMs. Has a nice GUI and near-instant startup. `brew install --cask orbstack`

### Global npm Packages

```
undollar, npm-check-updates, trash-cli,
@anthropic-ai/claude-code, @openai/codex, @railway/cli
```

### peon-ping Defaults

When setting up AI tools on a new Mac, also install and configure `peon-ping` with these defaults:

- Install globally with the shared runtime under `~/.claude/hooks/peon-ping/` so Claude Code, Codex, and Cursor can all use the same install.
- Register Claude Code hooks normally via the installer.
- Register Codex manually in `~/.codex/config.toml`:
  ```toml
  notify = ["bash", "/Users/$USER/.claude/hooks/peon-ping/adapters/codex.sh"]
  ```
- Keep Cursor hooked up if `~/.cursor/` exists.
- Use `default_pack: "peon"` as the fallback pack.
- Install this rotation pool:
  `glados`, `jarvis`, `r2d2`, `peasant`, `sc_kerrigan`, `sc_scv`, `sc_marine`, `sc_raynor`, `sc_ghost`, `sc_terran`, `protoss`, `sc2_alarak`, `sc2_abathur`, `ra2_eva_commander`, `ra2_kirov`, `ra2_yuri`, `ra_soviet`, `ccg_gla_worker`, `ccg_us_dozer`, `ccg_china_dozer`
- Set `pack_rotation_mode` to `round-robin`.
- Set `volume` to `0.2`.
- Keep `desktop_notifications` enabled, but use `notification_style: "standard"` rather than large overlays.
- Install `terminal-notifier` via Homebrew so standard macOS notifications work reliably and support click-to-focus behavior.
- Set `suppress_sound_when_tab_focused: true`.
- Set `silent_window_seconds: 30` so `task.complete` only fires for longer-running work.
- Categories:
  - `session.start: false`
  - `task.acknowledge: false`
  - `task.complete: true`
  - `task.error: true`
  - `input.required: true`
  - `resource.limit: true`
  - `user.spam: false`
- Goal: alerts only for meaningful attention events, with completion sounds reserved for work that took long enough to matter.

### Ollama Models (for 24GB RAM)

```
qwen3.5:27b                    # General purpose (256K context, multimodal)
qwen2.5-coder:14b              # Code-focused
deepseek-r1:8b                 # Reasoning
```

### macOS Defaults (automated)

```bash
# Finder: show extensions, show dotfiles, show path bar, list view
# Dock: auto-hide, no recents, no delay, minimize to app icon
# Keyboard: no autocorrect, no smart quotes, fast repeat, no press-and-hold
# Trackpad: no natural scrolling, tap to click
# Screenshots: PNG, Desktop, no shadow
# Menu bar: auto-hide
```

### macOS Settings (manual — guide the user)

These can't be automated via `defaults write`:
1. Spotlight: disable all except Apps + System Settings
2. Siri: disable
3. Screenshot shortcut: remap to Cmd+E
4. Cmd+Q: remap to double-tap (prevent accidental quits)
5. Trackpad: disable dictionary lookup
6. Finder: set new windows to ~/Work
7. Dock: remove all icons except Finder and Trash
8. Cursor size: set to large in Accessibility (good for presentations)

## Apps to Download Manually

These aren't in Homebrew or need manual install:
- [Wispr Flow](https://wispr.com) — voice-to-text (2025 pick)
- [SuperWhisper](https://superwhisper.com) — voice-to-text (2024 pick, still good)
- [Screenflow 11](https://www.telestream.net/screenflow/) — screen recording
- [App Quitter](https://appquitter.com) — close apps when windows close
- [Clipbook](https://clipbook.app) or Alfred — clipboard manager

## Post-Install: Open Apps That Need Login

After all scripts finish, open these apps to sign in and configure them. The skill should auto-open them for the user:

```bash
# Apps that need login/activation after install
open -a "Slack"
open -a "Discord"
open -a "Raycast"
open -a "Shottr"
open -a "1Password"
open -a "Spotify"
open -a "Zoom"
open -a "Dia"
open -a "GitHub Desktop" 2>/dev/null
open -a "Claude" 2>/dev/null
echo "🔑 Sign into each app above, then continue setup."
```

## Browser Extensions (install in Dia/Chrome)

Essential:
- uBlock Origin, Privacy Badger, Video Speed Controller (highly recommended)
- Refined GitHub, React Developer Tools, Code Copy
- 1Password / LastPass

Nice to have:
- Morpheon Dark, bypass-paywalls-chrome, Twitter-Links-beta
- enhanced-history, Display Anchors, Octolinker, little-rat, RescueTime

## Suggested Additions

Things worth considering that aren't in the original blog posts but complement this setup well:

1. **mise** (mise.jdx.dev) — universal version manager for Node, Python, Ruby, Go, etc. Could replace fnm + uv for version management (swyx mentioned exploring this)
2. **zoxide** — smarter `z` alternative with fuzzy matching
3. **bat** — `cat` replacement with syntax highlighting
4. **eza** — modern `ls` replacement
5. **fd** — faster `find` alternative
6. **ripgrep** — faster `grep` (rg)
7. **fzf** — fuzzy finder for shell history, files, everything
8. **starship** — cross-shell prompt (alternative to powerlevel10k, works with fish too)
9. **Bartender** or **Ice** — menu bar icon management (declutter)
11. **Hand Mirror** — quick webcam check from menu bar (great before calls)
12. **Tailscale** — mesh VPN for accessing home machines
13. **Orbstack** — another Docker Desktop alternative (even lighter than Colima)
14. **Aerospace** — tiling window manager (if Rectangle isn't enough)

## Dotfiles Reference

The .zshrc should include:
- Oh-My-ZSH with powerlevel10k theme
- Plugins: git, zsh-autosuggestions, zsh-syntax-highlighting, z
- Homebrew, fnm, and uv PATH setup
- z directory jumping source
- Git aliases (gs, gd, gc, gp, gl, gco, gcb)
- npm/pnpm aliases (ni, nr, pi, pr, ncu)
- Python aliases (pip → uv pip, venv → uv venv)
- Docker aliases (dstart → colima start, dstop → colima stop)
- Editor set to Cursor

The Ghostty config should include:
- Font: "Meslo LG M for Powerline" at 14pt
- Theme: dark:GruvboxDark,light:GruvboxLight
- Shell integration: zsh
- Block cursor, no blink
- Global hotkey: Cmd+` for quick terminal
- Clipboard read/write enabled
- Mouse hide while typing
