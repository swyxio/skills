#!/bin/bash
# =============================================================================
# SWYX 2025 NEW MAC SETUP — STEP 5: AI & ML Tools
# =============================================================================

set -e

echo "🤖 SWYX NEW MAC SETUP — Step 5: AI & ML Tools"
echo "================================================"
echo ""

eval "$(/opt/homebrew/bin/brew shellenv)" 2>/dev/null || true
eval "$(fnm env --use-on-cd)" 2>/dev/null || true

# =============================================================================
# CLAUDE CODE
# =============================================================================
echo "📦 Installing Claude Code..."
if command -v claude &>/dev/null; then
    echo "   ✅ Claude Code already installed"
else
    npm install -g @anthropic-ai/claude-code
    echo "   ✅ Claude Code installed"
fi

# Add Playwright MCP to Claude Code
echo "   📦 Adding Playwright MCP to Claude Code..."
claude mcp add playwright -- npx -y @playwright/mcp@latest 2>/dev/null || echo "   ⚠️  Playwright MCP setup skipped (run manually later)"

# =============================================================================
# OPENAI CODEX CLI
# =============================================================================
echo ""
echo "📦 Installing OpenAI Codex CLI..."
if command -v codex &>/dev/null; then
    echo "   ✅ Codex CLI already installed"
else
    npm install -g @openai/codex
    echo "   ✅ Codex CLI installed"
fi

# =============================================================================
# PEON-PING — Shared agent notifications for Claude Code, Codex, Cursor
# =============================================================================
echo ""
echo "📦 Installing peon-ping..."
eval "$(/opt/homebrew/bin/brew shellenv)" 2>/dev/null || true
brew tap PeonPing/tap 2>/dev/null || true
if command -v peon &>/dev/null; then
    echo "   ✅ peon-ping already installed"
else
    brew install peon-ping 2>/dev/null || echo "   ⚠️  peon-ping install failed"
fi

if command -v peon-ping-setup &>/dev/null; then
    echo "   📦 Running peon-ping setup..."
    peon-ping-setup --global --packs=peon 2>/dev/null || echo "   ⚠️  peon-ping setup skipped (run manually later)"
fi

if command -v peon &>/dev/null; then
    echo "   📦 Installing preferred peon-ping packs..."
    peon packs install glados,jarvis,r2d2,peasant,sc_kerrigan,sc_scv,sc_marine,sc_raynor,sc_ghost,sc_terran,protoss,sc2_alarak,sc2_abathur,ra2_eva_commander,ra2_kirov,ra2_yuri,ra_soviet,ccg_gla_worker,ccg_us_dozer,ccg_china_dozer 2>/dev/null || echo "   ⚠️  Some peon-ping packs failed to install"
fi

if [ -f "$HOME/.claude/hooks/peon-ping/config.json" ]; then
    echo "   🛠️  Applying peon-ping defaults..."
    python3 - <<'PY'
import json
import os

config_path = os.path.expanduser("~/.claude/hooks/peon-ping/config.json")
with open(config_path, "r", encoding="utf-8") as f:
    cfg = json.load(f)

cfg["default_pack"] = "peon"
cfg["volume"] = 0.2
cfg["desktop_notifications"] = True
cfg["notification_style"] = "standard"
cfg["suppress_sound_when_tab_focused"] = True
cfg["silent_window_seconds"] = 30
cfg["pack_rotation_mode"] = "round-robin"
cfg["pack_rotation"] = [
    "glados",
    "jarvis",
    "r2d2",
    "peasant",
    "sc_kerrigan",
    "sc_scv",
    "sc_marine",
    "sc_raynor",
    "sc_ghost",
    "sc_terran",
    "protoss",
    "sc2_alarak",
    "sc2_abathur",
    "ra2_eva_commander",
    "ra2_kirov",
    "ra2_yuri",
    "ra_soviet",
    "ccg_gla_worker",
    "ccg_us_dozer",
    "ccg_china_dozer",
]
cfg["categories"] = {
    "session.start": False,
    "task.acknowledge": False,
    "task.complete": True,
    "task.error": True,
    "input.required": True,
    "resource.limit": True,
    "user.spam": False,
}

with open(config_path, "w", encoding="utf-8") as f:
    json.dump(cfg, f, indent=2)
    f.write("\n")
PY
fi

if [ -f "$HOME/.codex/config.toml" ] && [ -f "$HOME/.claude/hooks/peon-ping/adapters/codex.sh" ]; then
    echo "   🛠️  Wiring peon-ping into Codex..."
    python3 - <<'PY'
import os

config_path = os.path.expanduser("~/.codex/config.toml")
line = 'notify = ["bash", "{}/.claude/hooks/peon-ping/adapters/codex.sh"]'.format(os.path.expanduser("~"))

with open(config_path, "r", encoding="utf-8") as f:
    content = f.read()

if line not in content:
    content = line + "\n\n" + content
    with open(config_path, "w", encoding="utf-8") as f:
        f.write(content)
PY
fi

# =============================================================================
# OLLAMA — Local AI Models
# =============================================================================
echo ""
echo "📦 Setting up Ollama models..."

# Check if Ollama is running
if command -v ollama &>/dev/null; then
    echo "   ✅ Ollama installed"

    # Start Ollama if not running
    if ! pgrep -x "ollama" &>/dev/null; then
        echo "   🔄 Starting Ollama..."
        open -a Ollama 2>/dev/null || ollama serve &>/dev/null &
        sleep 3
    fi

    echo "   📦 Pulling models (this takes a while)..."
    echo "   📦 Pulling llama3.2..."
    ollama pull llama3.2 2>/dev/null || echo "      ⚠️  Failed (try: ollama pull llama3.2)"

    echo "   📦 Pulling qwen2.5-coder:14b..."
    ollama pull qwen2.5-coder:14b 2>/dev/null || echo "      ⚠️  Failed (try: ollama pull qwen2.5-coder:14b)"

    echo "   📦 Pulling deepseek-r1 distill..."
    ollama pull hf.co/unsloth/DeepSeek-R1-Distill-Llama-8B-GGUF:Q8_0 2>/dev/null || echo "      ⚠️  Failed (try manually)"
else
    echo "   ⚠️  Ollama not found — install via: brew install --cask ollama"
fi

# =============================================================================
# LLAMA.CPP (Local inference server)
# =============================================================================
echo ""
echo "📦 Installing llama.cpp..."
if command -v llama-server &>/dev/null; then
    echo "   ✅ llama.cpp already installed"
else
    brew install llama.cpp 2>/dev/null || echo "   ⚠️  llama.cpp install failed"
fi

echo ""
echo "✅ Step 5 complete! AI tools ready."
echo ""
echo "💡 Useful commands:"
echo "   ollama run llama3.2              # Chat with Llama"
echo "   ollama run qwen2.5-coder:14b     # Code with Qwen"
echo "   claude                            # Start Claude Code"
echo "   peon status                       # Check agent notification status"
echo "   peon toggle                       # Toggle peon-ping mute"
echo "   llama-server -hf ggml-org/Qwen2.5-Coder-3B-Q8_0-GGUF --port 8012 -ngl 99"
echo ""
echo "💡 Manual downloads:"
echo "   - ChatGPT Desktop: https://chat.openai.com/download"
echo "   - LM Studio: https://lmstudio.ai"
echo "   - Claude Desktop: https://claude.ai/download"
echo ""
echo "   Run ./06-dotfiles.sh next."
