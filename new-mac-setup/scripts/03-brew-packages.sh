#!/bin/bash
# =============================================================================
# SWYX 2025 NEW MAC SETUP — STEP 3: Homebrew Packages + Cask Apps
# NOTE: Warp removed. Using Ghostty + cmux instead.
# =============================================================================

set -e

echo "🍺 SWYX NEW MAC SETUP — Step 3: Homebrew Packages + Cask Apps"
echo "==============================================================="
echo ""

# Make sure Homebrew is available
eval "$(/opt/homebrew/bin/brew shellenv)" 2>/dev/null || true

# =============================================================================
# FORMULAE (CLI tools)
# =============================================================================
echo "📦 Installing Homebrew formulae..."

FORMULAE=(
    # Core dev tools
    gh              # GitHub CLI
    git             # Latest git
    fnm             # Fast Node Manager (not nvm!)
    pnpm            # Fast npm alternative
    z               # Directory jumping
    diff-so-fancy   # Better git diffs

    # Languages & runtimes
    elixir
    erlang
    python@3.13

    # Docker without Docker Desktop
    colima
    docker
    docker-completion

    # Media & processing
    ffmpeg
    yt-dlp
    tesseract       # OCR engine

    # Build dependencies
    openssl@3
    readline
    sqlite
    xz
    zstd

    # Databases
    postgresql@14
    rabbitmq

    # Misc CLI
    honcho          # Process manager (Procfile)
    pipx            # Python CLI tool installer
    flyctl          # Fly.io CLI
    entr            # File watcher
    tig             # Git TUI

    # Mac App Store CLI
    mas             # Install App Store apps from CLI

    # Claude-suggested modern CLI replacements
    fzf             # Fuzzy finder (Ctrl+R history, file search)
    ripgrep         # Fast grep replacement (rg)
    bat             # cat with syntax highlighting
    zoxide          # Smarter z/directory jumping

    # Libraries (needed by other packages)
    cairo
    glib
    harfbuzz
    libvmaf
    webp
)

for pkg in "${FORMULAE[@]}"; do
    # Skip comments
    [[ "$pkg" =~ ^#.*$ ]] && continue
    if brew list "$pkg" &>/dev/null; then
        echo "   ✅ $pkg already installed"
    else
        echo "   📦 Installing $pkg..."
        brew install "$pkg" 2>/dev/null || echo "   ⚠️  Failed to install $pkg (continuing...)"
    fi
done

# =============================================================================
# CASKS (GUI apps)
# =============================================================================
echo ""
echo "📦 Installing Homebrew cask apps..."

CASKS=(
    # Terminal — Ghostty + cmux (NOT Warp)
    ghostty

    # Editors
    cursor
    visual-studio-code

    # Browsers
    thebrowsercompany-dia

    # Communication
    slack
    discord
    zoom

    # Productivity
    raycast
    rectangle
    obsidian
    notion
    notion-calendar
    notion-calendar

    # AI & ML
    ollama

    # Media
    vlc
    audacity
    loom
    descript

    # Utilities
    shottr           # Screenshots + OCR
    notunes          # Disable iTunes/Apple Music
    caffeine         # Keep Mac awake (or use Raycast Coffee plugin)
    stretchly        # Break reminders
    quickshade       # Brightness control
    pure-paste       # Clean clipboard
    1password

    # Dev tools
    beeper           # Unified messaging
    superhuman       # Email

    # Claude-suggested additions
    orbstack            # Lighter Docker alternative (even lighter than Colima)
)

for cask in "${CASKS[@]}"; do
    if brew list --cask "$cask" &>/dev/null; then
        echo "   ✅ $cask already installed"
    else
        echo "   📦 Installing $cask..."
        brew install --cask "$cask" 2>/dev/null || echo "   ⚠️  Failed to install $cask (continuing...)"
    fi
done

# =============================================================================
# CMUX — Ghostty-based terminal for AI agents
# =============================================================================
echo ""
echo "📦 Installing cmux (Ghostty-based terminal with vertical tabs)..."
brew tap manaflow-ai/cmux 2>/dev/null || true
if brew list --cask cmux &>/dev/null; then
    echo "   ✅ cmux already installed"
else
    brew install --cask cmux || echo "   ⚠️  Failed to install cmux"
fi

# =============================================================================
# MAC APP STORE APPS (via mas)
# =============================================================================
echo ""
echo "📦 Installing Mac App Store apps..."
if command -v mas &>/dev/null; then
    # Okta Verify — 2FA/MFA for work SSO (Okta, Auth0, etc.)
    mas install 490179405 2>/dev/null || echo "   ⚠️  Okta Verify install failed (sign into App Store first: mas signin)"
    echo "   ✅ Mac App Store apps installed"
else
    echo "   ⚠️  mas not found — install via: brew install mas"
fi

echo ""
echo "✅ Step 3 complete! All packages and apps installed."
echo ""
echo "💡 Apps that need manual download:"
echo "   - Wispr Flow: https://wispr.com"
echo "   - Screenflow 11: https://www.telestream.net/screenflow/"
echo "   - App Quitter: https://appquitter.com"
echo "   - Clipbook: https://clipbook.app"
echo ""
echo "🔑 Opening apps that need login..."
open -a "Slack" 2>/dev/null
open -a "Discord" 2>/dev/null
open -a "Raycast" 2>/dev/null
open -a "Shottr" 2>/dev/null
open -a "1Password" 2>/dev/null
open -a "Spotify" 2>/dev/null
open -a "Zoom" 2>/dev/null
open -a "Dia" 2>/dev/null
open -a "Claude" 2>/dev/null
echo "   Sign into each app above, then continue setup."
echo ""
echo "   Run ./04-dev-environment.sh next."
