# Swyx 2025 New Mac Setup — Quick Reference

Based on [swyx.io/new-mac-setup](https://www.swyx.io/new-mac-setup) (2025) and [swyx.io/new-mac-setup-2024](https://www.swyx.io/new-mac-setup-2024)

## Run Order

```bash
chmod +x ./*.sh
./00-run-all.sh        # Runs everything, OR run individually:

./01-xcode-and-homebrew.sh   # Xcode CLI tools + Homebrew
./02-shell-setup.sh          # Oh-My-ZSH + plugins + fonts
./03-brew-packages.sh        # All brew formulae + cask apps
./04-dev-environment.sh      # Node (fnm), Python (uv), Git, Docker
./05-ai-tools.sh             # Claude Code, Ollama models, llama.cpp
./06-dotfiles.sh             # .zshrc with all config
./07-macos-settings.sh       # System preferences automation
```

## Key 2025 Opinions (what changed from 2024)

| Category | 2024 | 2025 |
|---|---|---|
| Browser | Kagi Orion | Arc Browser |
| Voice | SuperWhisper | Wispr Flow |
| Editor | Cursor | Cursor + Windsurf |
| AI Terminal | Claude Code | Claude Code + Gemini CLI |
| Python | uv (new) | uv (confirmed) |
| Docker | Colima | Colima (+ watching Podman) |
| Terminal | Warp | Ghostty + cmux |

## Browser Extensions to Install Manually

Install in Arc/Chrome/Orion:

- **uBlock Origin** — ad blocker
- **Privacy Badger** — tracker blocker
- **Video Speed Controller** — VERY HIGHLY RECOMMENDED per swyx
- **Refined GitHub** — better GitHub UI
- **React Developer Tools**
- **Code Copy** — copy code blocks easily
- **RescueTime** — time tracking
- **LastPass / 1Password** — password manager
- **Morpheon Dark** — dark theme
- **bypass-paywalls-chrome** — paywall bypass
- **Twitter-Links-beta** — see tweets about any page
- **enhanced-history** — better browser history
- **Display Anchors** — show heading anchors
- **Octolinker** — link imports in GitHub
- **little-rat** — see extension network traffic
- **Palettab** — new tab colors

## Manual macOS Steps

After running the scripts:

1. **Spotlight**: System Settings → Siri & Spotlight → disable all except Apps and System Preferences
2. **Siri**: Disable "Ask Siri"
3. **Screenshot shortcut**: Keyboard → Shortcuts → Screenshots → set Cmd+E for "Copy selected area to clipboard"
4. **Cmd+Q protection**: Consider remapping to double-tap
5. **Trackpad**: Disable "Look up & data detectors"
6. **Dock**: Remove all icons except Finder and Trash
7. **Finder**: Set new windows to show ~/Work
8. **Cursor size**: Accessibility → Display → set to large (good for presentations)
9. **Screen recording permissions**: Create a Google Meet/Discord call immediately to trigger permission dialogs

## Apps to Download Manually

- [Wispr Flow](https://wispr.com) — voice-to-text (2025 pick)
- [SuperWhisper](https://superwhisper.com) — voice-to-text (2024 pick, still good)
- [Windsurf](https://windsurf.com/download/editor) — AI code editor
- [Screenflow 11](https://www.telestream.net/screenflow/) — screen recording
- [App Quitter](https://appquitter.com) — close apps when windows close
- [Clipbook](https://clipbook.app) or Alfred — clipboard manager

## Ghostty + cmux: Modern Terminal & Multiplexing

### Why Ghostty + cmux?

**Ghostty** is a fast, GPU-accelerated terminal emulator written in Zig. **cmux** (companion multiplexer) adds powerful session management with:

- **Vertical tabs** — organize sessions horizontally
- **Split panes** — divide terminal into layouts
- **Socket API** — control cmux from other applications (perfect for AI agents integrating with Claude Code or Gemini CLI)
- **Reads Ghostty config** — shares configuration with your terminal

### Ghostty Config

Create or edit `~/.config/ghostty/config`:

```ini
# Font settings
font-family = "Hack Nerd Font"
font-size = 14

# Colors
background = #0d1117
foreground = #c9d1d9

# Cursor style
cursor-style = block
cursor-invert-fg-bg = true

# Window padding
padding = 8

# Shell integration
shell-integration = auto
```

### cmux Commands

```bash
cmux new-session -s main           # Create new session
cmux list-sessions                 # List all sessions
cmux attach -t main                # Attach to session
cmux kill-session -t main          # Kill session

# Split panes (in active session)
cmux split-window -h               # Split horizontally
cmux split-window -v               # Split vertically

# Navigate panes
cmux select-pane -L|R|U|D          # Move to left/right/up/down pane

# Vertical tabs
cmux new-window -t main            # Create new tab in session
cmux next-window                   # Navigate to next tab
cmux previous-window               # Navigate to previous tab

# Socket API (for AI agents)
cmux send-keys -t main "your command" Enter
cmux capture-pane -t main -p       # Get pane contents
```

## Dotfiles Reference

Your dotfiles gist: https://gist.github.com/swyxio/7fa1009e460ecb818d5e6d9ca4616a05

## Useful Commands Cheat Sheet

```bash
# Terminal (Ghostty + cmux)
cmux new-session -s work           # Start new session
cmux attach -t work                # Attach to session
cmux split-window -v               # Split pane vertically
cmux new-window -t work            # Create new tab
cmux send-keys -t work "cmd" Enter # Send command to pane (AI agents)

# Directory jumping (after using z for a while)
z work          # Jump to ~/Work
z proj          # Jump to most-frecent "proj" directory

# Node management
fnm install 22  # Install Node 22
fnm use 22      # Switch to Node 22
ncu             # Check for outdated npm packages

# Python (via uv)
uv venv         # Create virtualenv
uv pip install  # Install packages (replaces pip)

# Docker (via Colima)
colima start    # Start Docker daemon
colima stop     # Stop Docker daemon

# Local AI
ollama run llama3.2              # Chat with Llama
ollama run qwen2.5-coder:14b     # Chat with Qwen coder

# llama.cpp server
llama-server -hf ggml-org/Qwen2.5-Coder-3B-Q8_0-GGUF --port 8012 -ngl 99
```
