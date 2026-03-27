#!/bin/bash
# =============================================================================
# SWYX 2025 NEW MAC SETUP — STEP 6: Dotfiles (.zshrc + configs)
# =============================================================================
# Dotfiles gist: https://gist.github.com/swyxio/7fa1009e460ecb818d5e6d9ca4616a05
# =============================================================================

set -e

echo "📄 SWYX NEW MAC SETUP — Step 6: Dotfiles"
echo "=========================================="
echo ""

# =============================================================================
# BACKUP EXISTING .zshrc
# =============================================================================
if [ -f "$HOME/.zshrc" ]; then
    echo "📋 Backing up existing .zshrc to .zshrc.backup..."
    cp "$HOME/.zshrc" "$HOME/.zshrc.backup"
fi

# =============================================================================
# WRITE .zshrc
# =============================================================================
echo "📝 Writing .zshrc..."

cat > "$HOME/.zshrc" << 'ZSHRC'
# =============================================================================
# SWYX .zshrc — 2025 edition
# Merged from gist + 2025 improvements (uv, colima, powerlevel10k, z)
# Dotfiles gist: https://gist.github.com/swyxio/7fa1009e460ecb818d5e6d9ca4616a05
# =============================================================================

# --- Oh-My-ZSH ---
export ZSH="$HOME/.oh-my-zsh"
ZSH_THEME="powerlevel10k/powerlevel10k"
# To switch back to original robbyrussell theme: ZSH_THEME="robbyrussell"

plugins=(
    git
    zsh-autosuggestions
    zsh-syntax-highlighting
    z
)

source $ZSH/oh-my-zsh.sh

# --- Homebrew ---
eval "$(/opt/homebrew/bin/brew shellenv)"

# --- fnm (Fast Node Manager) - replaces nvm ---
eval "$(fnm env --use-on-cd)"

# --- uv (Python) - Astral's replacement for pip/pyenv/conda ---
[ -f "$HOME/.local/bin/env" ] && source "$HOME/.local/bin/env"

# --- z (directory jumping) ---
[ -f /opt/homebrew/etc/profile.d/z.sh ] && . /opt/homebrew/etc/profile.d/z.sh

# =============================================================================
# ALIASES — File Management
# =============================================================================
alias mv="mv -iv"
alias cp="cp -iv"
alias lsd="ls -ltr"

# =============================================================================
# ALIASES — Shell Management
# =============================================================================
alias zs="source ~/.zshrc"
alias zshrc="vi ~/.zshrc"

# =============================================================================
# ALIASES — Git
# =============================================================================
alias gclone="git clone --depth 1 "
alias gpom="git push origin main"
alias gpo="git push origin "
alias gset="git remote set-url"
alias gs="git status"
alias gadmit="git add . && git commit -m"
alias gc="git checkout"
alias gcb="git checkout -b "
alias gupdatefork="git fetch upstream && git checkout master && git rebase upstream/master"
alias gcm="git checkout main 2> /dev/null || git checkout master"

# git log with fancy formatting
alias gl="git log --graph --abbrev-commit --decorate --format=format:'%C(bold blue)%h%C(reset) - %C(bold green)(%ar)%C(reset) %C(white)%s%C(reset) %C(dim white)- %an%C(reset)%C(bold yellow)%d%C(reset)' --all"
alias glr='gl -n 7'

# git branch cleanup
alias git-clean-merged="git branch --merged master | grep -v 'master$' | xargs git branch -d"
alias git-clean-remote-merged="git branch -r --merged | grep -v master | sed 's/origin\///' | xargs -n 1 git push --delete origin"

# git commit summary
alias gitsum='git log --pretty=format:"* %s" --author `git config user.email`'

# =============================================================================
# ALIASES — npm/pnpm
# =============================================================================
alias ni="npm install"
alias nr="npm run"
alias pi="pnpm install"
alias pr="pnpm run"
alias ncu="npm-check-updates"
alias run="npm run"
alias yb="pnpm run build || npm run build"
alias ys="pnpm run start || npm run start"

# =============================================================================
# ALIASES — Editors & Tools
# =============================================================================
alias cc="claude --dangerously-skip-permissions"
alias co="codex --dangerously-bypass-approvals-and-sandbox"
alias fucking=sudo
alias ytdlp='yt-dlp -f "bestvideo[ext=mp4][height<=720]+bestaudio[ext=m4a]/best[ext=mp4]/best" '
alias json_pretty="pbpaste | python -m json.tool | pbcopy"

# =============================================================================
# ALIASES — Docker via Colima
# =============================================================================
alias dstart="colima start"
alias dstop="colima stop"
alias dc="docker-compose"

# =============================================================================
# FUNCTIONS — Directory
# =============================================================================

# mkcdir: create directory and cd into it
function mkcdir () {
  mkdir -p -- "$1" &&
  cd -P -- "$1"
}

# tree: show directory tree with sane defaults
function t() {
  tree -I '.git|node_modules|bower_components|.DS_Store' --dirsfirst --filelimit 15 -L ${1:-3} -aC $2
}

# =============================================================================
# FUNCTIONS — AI Commit Message Generation (ggadmit)
# =============================================================================

unalias ggadmit 2>/dev/null

ggadmit() {
  git add .
  local tmpfile=$(mktemp)
  printf 'Generate a concise git commit message for these changes...\n%s' "$(git diff --cached)" > "$tmpfile"
  local msg=$(devin --model claude-sonnet-4.5 -p --prompt-file "$tmpfile")
  rm -f "$tmpfile"
  if [ -z "$msg" ]; then
    echo "Error: devin returned empty commit message" >&2
    return 1
  fi
  git commit -m "$msg"
}

# =============================================================================
# FUNCTIONS — AI Command Generation (please)
# =============================================================================

needs() {
  which "$1" > /dev/null 2>&1 || { echo "I require $1 but it's not installed.  Aborting." >&2; return 1; }
}

platform() {
  case "$OSTYPE" in
    darwin*)  echo "macOS" ;;
    linux*)   echo "Linux" ;;
    *)        echo "Unknown" ;;
  esac
}

_generate_curl_api_request_for_please() {
  local prompt="$1"
  local model="${2:-gpt-4}"
  local api_key="${OPENAI_API_KEY}"

  if [ -z "$api_key" ]; then
    echo "Error: OPENAI_API_KEY not set" >&2
    return 1
  fi

  curl -s https://api.openai.com/v1/chat/completions \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $api_key" \
    -d "{
      \"model\": \"$model\",
      \"messages\": [
        {\"role\": \"system\", \"content\": \"You are a helpful bash expert. Generate a single bash command to accomplish the task. Output ONLY the command, no explanations.\"},
        {\"role\": \"user\", \"content\": \"$prompt\"}
      ],
      \"temperature\": 0
    }" | grep -o '"content":"[^"]*' | head -1 | sed 's/"content":"//'
}

please() {
  needs gum
  local prompt="$1"
  local model="${2:-gpt-4}"

  if [ -z "$prompt" ]; then
    echo "Usage: please <description> [model]" >&2
    return 1
  fi

  local cmd=$(_generate_curl_api_request_for_please "$prompt" "$model")

  if [ -z "$cmd" ]; then
    echo "Error: Failed to generate command" >&2
    return 1
  fi

  echo "Generated command:"
  echo "  $cmd"
  echo ""

  if gum confirm "Execute this command?"; then
    eval "$cmd"
  else
    echo "Command not executed."
  fi
}

# =============================================================================
# PATH & ENVIRONMENT
# =============================================================================

export PATH="$HOME/.local/bin:$PATH"
export PATH="/opt/homebrew/bin:$PATH"

# Editor preferences
export EDITOR="cursor"
export VISUAL="cursor"

# =============================================================================
# KEYBOARD BINDINGS
# =============================================================================

bindkey '^\[\[H' beginning-of-line       # Home key
bindkey '^\[\[F' end-of-line             # End key
bindkey "^\[\[3-" delete-char            # Delete key
bindkey '^\[\[1;5D' backward-word        # Ctrl+Left
bindkey '^\[\[1;5C' forward-word         # Ctrl+Right

# =============================================================================
# POWERLEVEL10K THEME
# =============================================================================

# To customize prompt, run `p10k configure` or edit ~/.p10k.zsh.
[[ ! -f ~/.p10k.zsh ]] || source ~/.p10k.zsh
ZSHRC

echo "   ✅ .zshrc written"

# =============================================================================
# WRITE .gitignore_global
# =============================================================================
echo ""
echo "📝 Writing .gitignore_global..."

cat > "$HOME/.gitignore_global" << 'GITIGNORE_GLOBAL'
# =============================================================================
# Global .gitignore for swyx — applied to all repos
# Install: git config --global core.excludesfile ~/.gitignore_global
# =============================================================================

# OS
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Editors & IDEs
.vscode/
.idea/
*.swp
*.swo
*~
.vim/
.nvim/
.emacs.d/
*.sublime-project
*.sublime-workspace

# Package managers
node_modules/
.pnpm-store/
.yarn/
dist/
build/
.next/
.nuxt/

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
ENV/
.venv
pip-log.txt
pip-delete-this-directory.txt

# Ruby
Gemfile.lock
.ruby-version

# Environment
.env
.env.local
.env.*.local

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Temporary files
*.tmp
*.bak
.cache/
.temp/

# macOS specifics
.AppleDouble
.LSOverride

# IDE settings (keep .vscode/settings.json, but ignore workspace state)
.vscode/settings.json.bak

# Testing
.nyc_output/
coverage/

# Misc
.turbo/
.eslintcache
.stylelintcache
GITIGNORE_GLOBAL

# Install globally
git config --global core.excludesfile ~/.gitignore_global
echo "   ✅ .gitignore_global written and configured"

# =============================================================================
# WRITE .vimrc
# =============================================================================
echo ""
echo "📝 Writing .vimrc..."

cat > "$HOME/.vimrc" << 'VIMRC'
" =============================================================================
" SWYX .vimrc — 2025 edition
" =============================================================================

set nocompatible
filetype plugin indent on
syntax on

" Indentation
set expandtab
set tabstop=4
set shiftwidth=4
set softtabstop=4

" Filetype-specific indentation
autocmd FileType json setlocal tabstop=2 shiftwidth=2 softtabstop=2
autocmd FileType html setlocal tabstop=2 shiftwidth=2 softtabstop=2
autocmd FileType css setlocal tabstop=2 shiftwidth=2 softtabstop=2
autocmd FileType javascript setlocal tabstop=2 shiftwidth=2 softtabstop=2
autocmd FileType typescript setlocal tabstop=2 shiftwidth=2 softtabstop=2
autocmd FileType vue setlocal tabstop=2 shiftwidth=2 softtabstop=2
autocmd FileType yaml setlocal tabstop=2 shiftwidth=2 softtabstop=2
autocmd FileType svg setlocal tabstop=2 shiftwidth=2 softtabstop=2

" No backups/swapfiles
set nobackup
set nowritebackup
set noswapfile

" Search
set ignorecase
set smartcase
set incsearch
set hlsearch

" Display
set number
set relativenumber
set cursorline
set wrap
set linebreak
set showmatch
set lazyredraw

" Behavior
set backspace=indent,eol,start
set mouse=a
set ttimeoutlen=10

" Status line
set laststatus=2
set statusline=%F%m%r%h%w\ [%{&ff}]\ %l:%c

" Keybindings: preserve whitespace in insert mode
inoremap <C-U> <C-G>u<C-U>
inoremap <C-W> <C-G>u<C-W>

" Quick save
nnoremap <leader>w :w<CR>
nnoremap <leader>q :q<CR>

" Navigation
nnoremap j gj
nnoremap k gk

" FZF integration (if available)
if has('nvim') || has('gui_running')
  set rtp+=/opt/homebrew/opt/fzf
endif
VIMRC

echo "   ✅ .vimrc written"

# =============================================================================
# WRITE VSCode/Cursor settings
# =============================================================================
echo ""
echo "📝 Writing VSCode/Cursor settings..."

# Create VSCode user settings directory
mkdir -p "$HOME/Library/Application Support/Code/User"

cat > "$HOME/Library/Application Support/Code/User/settings.json" << 'VSCODE_SETTINGS'
{
  "editor.fontFamily": "Meslo LG M for Powerline",
  "editor.fontSize": 14,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.fixAll.prettier": "explicit"
  },
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.insertSpaces": true,
  "editor.tabSize": 2,
  "files.trimTrailingWhitespace": true,
  "files.insertFinalNewline": true,
  "files.trimFinalNewlines": true,
  "files.exclude": {
    "**/.git": true,
    "**/.DS_Store": true,
    "**/.next": true,
    "**/node_modules": true,
    "**/.venv": true
  },
  "search.exclude": {
    "**/.git": true,
    "**/.next": true,
    "**/node_modules": true,
    "**/dist": true,
    "**/.venv": true
  },
  "workbench.colorTheme": "GitHub Dark",
  "workbench.iconTheme": "GitHub Modern",
  "terminal.integrated.fontFamily": "Meslo LG M for Powerline",
  "terminal.integrated.fontSize": 14,
  "terminal.integrated.defaultProfile.osx": "zsh",
  "terminal.integrated.profiles.osx": {
    "zsh": {
      "path": "/bin/zsh",
      "args": ["-l"]
    }
  },
  "git.ignoreLimitWarning": true,
  "[json]": {
    "editor.tabSize": 2
  },
  "[yaml]": {
    "editor.tabSize": 2
  },
  "[markdown]": {
    "editor.wordWrap": "on",
    "editor.formatOnSave": false
  },
  "extensions.ignoreRecommendations": false,
  "telemetry.telemetryLevel": "off"
}
VSCODE_SETTINGS

echo "   ✅ VSCode/Cursor settings written to ~/Library/Application Support/Code/User/settings.json"

# Create Cursor-specific settings directory (if using Cursor)
if [ -d "$HOME/Library/Application Support/Cursor" ]; then
  mkdir -p "$HOME/Library/Application Support/Cursor/User"
  cp "$HOME/Library/Application Support/Code/User/settings.json" "$HOME/Library/Application Support/Cursor/User/settings.json"
  echo "   ✅ Also copied to Cursor settings directory"
fi

# =============================================================================
# GHOSTTY CONFIG
# =============================================================================
echo ""
echo "📝 Writing Ghostty config..."

GHOSTTY_DIR="$HOME/.config/ghostty"
mkdir -p "$GHOSTTY_DIR"

cat > "$GHOSTTY_DIR/config" << 'GHOSTTYCONF'
# =============================================================================
# Ghostty config — swyx 2025
# cmux also reads this file for themes/fonts/colors
# =============================================================================

# Font
font-family = "Meslo LG M for Powerline"
font-size = 14

# Theme
theme = dark:GruvboxDark,light:GruvboxLight

# Window
window-padding-x = 8
window-padding-y = 4
window-decoration = true
macos-titlebar-style = tabs

# Shell
shell-integration = zsh

# Cursor
cursor-style = block
cursor-style-blink = false

# Scrollback
scrollback-limit = 10000

# Clipboard
clipboard-read = allow
clipboard-write = allow

# Mouse
mouse-hide-while-typing = true

# Quick terminal (drop-down)
keybind = global:cmd+grave_accent=toggle_quick_terminal
GHOSTTYCONF

echo "   ✅ Ghostty config written to ~/.config/ghostty/config"
echo "   💡 cmux will also read this config for themes, fonts, and colors"

# =============================================================================
# COMPLETE
# =============================================================================
echo ""
echo "✅ Step 6 complete! All dotfiles written:"
echo "   • ~/.zshrc — Full shell config with all aliases & functions"
echo "   • ~/.gitignore_global — Global git ignore patterns"
echo "   • ~/.vimrc — Vim configuration"
echo "   • ~/Library/Application Support/Code/User/settings.json — VSCode/Cursor"
echo "   • ~/.config/ghostty/config — Ghostty terminal emulator"
echo ""
echo "Next steps:"
echo "   • Run: source ~/.zshrc  (or open a new terminal)"
echo "   • If using Cursor/VSCode, reload the window (Cmd+K, Cmd+R)"
echo "   • Run ./07-macos-settings.sh next."
