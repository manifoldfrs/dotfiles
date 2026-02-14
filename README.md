# dotfiles

Configuration files for zsh, Homebrew, Ghostty terminal, tmux, and Neovim.

## Requirements

| Tool | Minimum Version | Notes |
|------|-----------------|-------|
| **Neovim** | >= 0.11.0 | Required for mason-lspconfig v2 and vim.lsp.config() |
| **Git** | >= 2.19.0 | Required for lazy.nvim partial clones |
| **Ghostty** | Latest | Uses `macos-option-as-alt` syntax |
| **Node.js** | LTS | For LSP servers via Mason |
| **tree-sitter-cli** | >= 0.26.1 | Required for nvim-treesitter `main` branch parser compilation |
| **lazygit** | >= 0.40 | Required for snacks.lazygit keymap (`<leader>gg`) |
| **imagemagick** | >= 7.0 | Required for snacks.image preview support |

[![Test Dotfiles](https://github.com/manifoldfrs/dotfiles/actions/workflows/test.yml/badge.svg)](https://github.com/manifoldfrs/dotfiles/actions/workflows/test.yml)

## Quick Start (New Mac)

```bash
# 1. Clone the repo
git clone https://github.com/manifoldfrs/dotfiles.git ~/dotfiles

# 2. Run shell setup (installs Homebrew, oh-my-zsh, Ghostty, tmux, Neovim config, etc.)
cd ~/dotfiles
./shell_setup.sh install

# 3. Restart your terminal (quit and reopen)
# 4. Install Node.js
nvm install --lts

# 5. Install OpenCode (optional, for AI features)
curl -fsSL https://opencode.ai/install | bash
```

## What Gets Installed

### Shell Setup (`shell_setup.sh install`)

- **Homebrew** + all packages from `Brewfile` (includes Ghostty, tmux, Nerd Fonts)
- **Oh My Zsh** with `robbyrussell` theme (minimal, fast)
- **zsh-syntax-highlighting** plugin
- **nvm** (Node Version Manager) via HTTPS
- **Configs copied**: `.zshrc`, `.zprofile`, `.zshenv`, `.gitconfig`, `ghostty/config` → `~/.config/ghostty/config`, `tmux/tmux.conf` → `~/.tmux.conf`, `nvim/` → `~/.config/nvim`, `bin/tmux-sessionizer` → `~/.local/bin/tmux-sessionizer`

### npm Global Packages (`npm-global-packages.txt`)

- `@anthropic-ai/claude-code` - Claude Code CLI
- `@openai/codex` - OpenAI Codex CLI
- `vercel` - Vercel CLI
- `tree-sitter-cli` - Parser generator for nvim-treesitter

### MCP Setup (`mcp_setup.sh install`)

MCP (Model Context Protocol) configs for AI coding assistants:
- **Claude Desktop**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Codex**: `~/.codex/config.toml`

See `mcp/README.md` for setup instructions and API key configuration.

### Karabiner Status

Karabiner is deprecated in this repo and no longer installed by `shell_setup.sh`/`Brewfile`.
Existing configs remain archived under `karabiner/` and `old/` for historical reference.

## Development Environment

### Primary Tools

| Tool | Purpose |
|------|---------|
| **Neovim** | Primary editor (lazy.nvim) |
| **OpenCode** | AI-assisted coding CLI |
| **Ghostty** | Terminal emulator |
| **tmux** | Terminal multiplexer |

### Neovim Plugins

| Plugin | Purpose |
|--------|---------|
| snacks.nvim | Modern QoL plugins (replaces telescope, alpha, indent-blankline, nvim-surround, Comment.nvim) |
| neo-tree | File explorer |
| oil.nvim | Buffer-based file editing |
| blink.cmp | High-performance autocompletion (Rust-based fuzzy matching) |
| opencode.nvim | AI coding assistant integration (opencode CLI + tmux) |
| mason + lspconfig | LSP support |
| treesitter | Syntax highlighting |
| gitsigns | Git integration |
| lualine | Status line |
| bufferline | Buffer tabs |
| vim-test + vimux | Test runner |
| nvim-dap | Debugging (Go, Python) |

**Key plugins explained:**
- **snacks.nvim**: Collection of 15+ QoL plugins including `picker` (fuzzy finder), `dashboard` (startup screen), `lazygit`, `notifier`, `bufdelete`, `indent` (guides), `scope` (text objects), `scratch` (buffers), `words` (LSP navigation), and more
- **blink.cmp**: Rust-based completion engine with 0.5-4ms response time, typo-resistant fuzzy matching, and native LuaSnip support
- **opencode.nvim**: Integrates opencode AI assistant via tmux split pane, with context-aware prompts and blink.cmp completion

### LSP Servers (auto-installed via Mason)

- `lua_ls` - Lua
- `ts_ls` - TypeScript/JavaScript
- `gopls` - Go
- `clangd` - C/C++
- `ty` - Python (Beta type checker from Astral)

## Keybindings

### Neovim

| Keys | Action |
|------|--------|
| `Space` | Leader key |
| `jk` (insert) | Escape to Normal |
| `<C-n>` | Toggle neo-tree |
| `-` | Open oil.nvim (float) |
| `<leader>h` | Clear search highlight |
| **snacks.picker (Search)** ||
| `<C-p>` / `<leader>sf` | Find files |
| `<leader>sg` | Grep |
| `<leader>sb` | Buffers |
| `<leader>sr` | Recent files |
| `<leader>sh` | Help pages |
| `<leader>sk` | Keymaps |
| `<leader>sc` | Colorschemes |
| `<leader>sn` | Notification history |
| `<leader><space>` | Smart find files |
| `gd` / `gr` / `gI` | LSP: definition / references / implementation |
| **opencode.nvim (AI)** ||
| `<leader>oa` | Ask opencode about current context |
| `<leader>os` | Select opencode action |
| `<leader>ot` | Toggle opencode (tmux split) |
| `<leader>oo` | Add visual range to opencode |
| `<leader>og` | Add current line to opencode |
| **snacks (Utilities)** ||
| `<leader>bd` | Delete buffer |
| `<leader>gg` | Lazygit |
| `<leader>z` | Zen mode |
| `<leader>.` | Toggle scratch buffer |
| `]]` / `[[` | Next/prev LSP reference |
| **Navigation** ||
| `<C-h/j/k/l>` | Navigate windows/tmux panes |
| `<S-h>` / `<S-l>` | Previous/next buffer |
| **LSP** ||
| `K` | LSP: hover documentation |
| `<leader>rn` / `<leader>ca` | LSP: rename / code action |
| `<leader>lf` | Format file |
| `gl` / `[d` / `]d` | Diagnostics: float / prev / next |
| **Testing & Git** ||
| `<leader>tt` / `<leader>tf` / `<leader>ts` | Test: nearest / file / suite |
| `<leader>gp` / `<leader>gt` | Git: preview hunk / toggle blame |
| `]h` / `[h` | Git: next/prev hunk |

### Debugging (nvim-dap)

| Keys | Action |
|------|--------|
| `<leader>dc` | Continue / Start debugging |
| `<leader>db` | Toggle breakpoint |
| `<leader>dB` | Conditional breakpoint |
| `<leader>di` | Step into |
| `<leader>do` | Step over |
| `<leader>dO` | Step out |
| `<leader>dr` | Toggle REPL |
| `<leader>dl` | Run last |
| `<leader>du` | Toggle DAP UI |
| `<leader>dx` | Terminate session |
| `<leader>de` | Eval expression |

**Supported languages:** Go (delve), Python (debugpy)

**First-time setup:**
```bash
# Debug adapters are auto-installed via Mason, or manually:
:MasonInstall delve debugpy
```

**Basic workflow:**
1. Open a Go or Python file
2. `<leader>db` to set a breakpoint on a line
3. `<leader>dc` to start debugging
4. DAP UI opens automatically
5. Use step commands to navigate
6. `<leader>dx` to terminate

### tmux

| Keys | Action |
|------|--------|
| `C-a` | Prefix |
| `C-a r` | Reload tmux.conf |
| `C-a f` | **tmux-sessionizer** (fuzzy find projects) |
| `C-a d` / `C-a s` | Detach / session list |
| `C-a "` / `C-a %` | Split vertical / horizontal |
| `<C-h/j/k/l>` | Navigate panes (seamless with nvim) |
| `Alt-Arrow` | Resize panes |

**Note:** Status bar is positioned at top with Catppuccin Mocha theme. Pane navigation uses a manual `is_vim` script (not the TPM plugin) for transparency and fewer dependencies. Works seamlessly with `nvim-tmux-navigation` in Neovim.

### tmux-sessionizer

Quick project switching via fzf. Press `C-a f` to:
1. See subdirectories of your current path
2. Fuzzy-select a project
3. Create/switch to a tmux session named after that project

The session name appears in the tmux status bar, providing project context without needing a fancy shell prompt.

## Shell Configuration

### History Settings

```bash
HISTSIZE=10000           # Commands in memory
SAVEHIST=50000           # Commands saved to file
setopt inc_append_history  # Save immediately, not on exit
setopt share_history       # Share between terminals
```

## File Structure

```
dotfiles/
├── shell_setup.sh          # Main shell/brew/zsh installer
├── mcp_setup.sh            # MCP config backup/install
├── Brewfile                # Homebrew packages
├── npm-global-packages.txt # Global npm packages
├── .zshrc                  # Zsh configuration
├── .zprofile               # Zsh profile
├── .zshenv                 # Zsh environment
├── .gitconfig              # Git configuration
├── CHANGELOG.md            # Change history
├── ghostty/                # Ghostty terminal config (Nord)
│   └── config
├── bin/                    # Shell scripts
│   └── tmux-sessionizer    # Project switcher (fzf-based)
├── tmux/                   # tmux configuration (Catppuccin Mocha)
│   └── tmux.conf
├── nvim/                   # Neovim config (lazy.nvim + Nord)
│   ├── init.lua
│   ├── lazy-lock.json      # Plugin version lock
│   └── lua/
│       ├── vim-options.lua
│       └── plugins/        # Plugin configurations
│           ├── snacks.lua      # QoL plugins + picker
│           ├── blink.lua       # Autocompletion (Rust)
│           ├── opencode.lua    # AI assistant integration
│           ├── lsp-config.lua  # LSP configuration
│           └── ...
├── karabiner/              # Deprecated keyboard remapping archive
├── mcp/                    # MCP configs for AI tools
├── opencode/               # OpenCode configuration
│   └── opencode.jsonc
└── old/                    # Archived/deprecated configs
```

## Backup Your Current Mac

```bash
cd ~/dotfiles

# Backup shell configs and Brewfile
./shell_setup.sh backup

# Backup MCP configs
./mcp_setup.sh backup

# Commit and push
git add -A
git commit -m "Backup configs"
git push
```

## Troubleshooting

**Neovim LSP not working?**
- Requires Neovim >= 0.11.0 for mason-lspconfig v2
- Run `:Mason` to check installed servers
- Run `:LspInfo` to verify attachment

**Treesitter parsers not compiling?**
- Requires `tree-sitter-cli` >= 0.26.1 for nvim-treesitter `main` branch
- Run `:checkhealth nvim-treesitter` to verify CLI is found
- Install via: `npm install -g tree-sitter-cli`

**Powerline symbols not showing?**
- Ensure terminal uses a Nerd Font (JetBrainsMono Nerd Font)
- Restart terminal after font installation

**tmux plugins not loading?**
- Run `~/.tmux/plugins/tpm/bin/install_plugins`

**C-h/j/k/l not working between nvim and tmux?**
- Ensure `nvim-tmux-navigation` plugin is installed in Neovim
- Reload tmux config: `tmux source-file ~/.tmux.conf`

**nvm not found?**
- Restart terminal or `source ~/.zshrc`

**Debugging not working?**
- Run `:MasonInstall delve debugpy` to install adapters
- Check `:checkhealth dap` for adapter status
- Ensure you have a valid debug configuration for your language

## Future Considerations

### zoxide - Smarter Directory Navigation

[zoxide](https://github.com/ajeetdsouza/zoxide) is a smarter `cd` command that learns your habits. It uses "frecency" (frequency + recency) to jump to directories with minimal typing.

```bash
# Instead of:
cd ~/github/dotfiles

# You can just type:
z dotfiles
```

**Installation (when ready):**
```bash
# Add to Brewfile
brew "zoxide"

# Add to .zshrc (after oh-my-zsh sourcing)
eval "$(zoxide init zsh)"
```

Currently not using this because `cd` + fzf works well enough, but worth revisiting if directory jumping becomes a bottleneck.
