# dotfiles

Configuration files for zsh, Homebrew, Ghostty terminal, tmux, and Neovim.

## Requirements

| Tool | Minimum Version | Notes |
|------|-----------------|-------|
| **Neovim** | >= 0.11.0 | Required for mason-lspconfig v2 and vim.lsp.config() |
| **Git** | >= 2.19.0 | Required for lazy.nvim partial clones |
| **Ghostty** | Latest | Uses `macos-option-as-alt` syntax |
| **Node.js** | LTS | For LSP servers via Mason |

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
```

## What Gets Installed

### Shell Setup (`shell_setup.sh install`)

- **Homebrew** + all packages from `Brewfile` (includes Ghostty, tmux, Nerd Fonts)
- **Oh My Zsh** with `agnoster` theme
- **zsh-syntax-highlighting** plugin
- **nvm** (Node Version Manager) via HTTPS
- **Configs copied**: `.zshrc`, `.zprofile`, `.zshenv`, `.gitconfig`, `ghostty/config` → `~/.config/ghostty/config`, `tmux/tmux.conf` → `~/.tmux.conf`, `nvim/` → `~/.config/nvim`

### npm Global Packages (`npm-global-packages.txt`)

- `@anthropic-ai/claude-code` - Claude Code CLI
- `@openai/codex` - OpenAI Codex CLI
- `vercel` - Vercel CLI

### MCP Setup (`mcp_setup.sh install`)

MCP (Model Context Protocol) configs for AI coding assistants:
- **Claude Desktop**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Codex**: `~/.codex/config.toml`

See `mcp/README.md` for setup instructions and API key configuration.

### Karabiner Elements (Keyboard Remapping)

Karabiner Elements is installed via Brewfile. To restore your keyboard settings:

```bash
# Copy config to Karabiner directory
mkdir -p ~/.config/karabiner
cp ~/dotfiles/karabiner/karabiner.json ~/.config/karabiner/
cp -r ~/dotfiles/karabiner/assets ~/.config/karabiner/
```

Current keybindings:
- **Caps Lock → Control** (system-level remap)
- **Tab + hjkl → Arrow keys** (vim-style navigation)
- **Fn + Tab → Toggle Caps Lock**

## Development Environment

### Primary Tools

| Tool | Purpose |
|------|---------|
| **Neovim** | Primary editor (lazy.nvim + Nord theme) |
| **OpenCode** | AI-assisted coding CLI |
| **Ghostty** | Terminal emulator |
| **tmux** | Terminal multiplexer |

### Neovim Plugins

| Plugin | Purpose |
|--------|---------|
| neo-tree | File explorer |
| oil.nvim | Buffer-based file editing |
| telescope | Fuzzy finder |
| nvim-cmp | Autocompletion |
| mason + lspconfig | LSP support |
| treesitter | Syntax highlighting |
| gitsigns | Git integration |
| lualine | Status line |
| bufferline | Buffer tabs |
| vim-test + vimux | Test runner |

### LSP Servers (auto-installed via Mason)

- `lua_ls` - Lua
- `ts_ls` - TypeScript/JavaScript
- `pyright` - Python
- `gopls` - Go
- `clangd` - C/C++

## Keybindings

### Neovim

| Keys | Action |
|------|--------|
| `Space` | Leader key |
| `jk` (insert) | Escape to Normal |
| `<C-n>` | Toggle neo-tree |
| `-` | Open oil.nvim (float) |
| `<C-p>` / `<leader>ff` | Find files |
| `<leader>fg` | Live grep |
| `<leader>fb` | Buffers |
| `<leader><leader>` | Recent files |
| `<C-h/j/k/l>` | Navigate windows/tmux panes |
| `<S-h>` / `<S-l>` | Previous/next buffer |
| `gd` / `gr` / `gi` | LSP: definition / references / implementation |
| `K` | LSP: hover documentation |
| `<leader>rn` / `<leader>ca` | LSP: rename / code action |
| `<leader>lf` | Format file |
| `gl` / `[d` / `]d` | Diagnostics: float / prev / next |
| `<leader>tt` / `<leader>tf` / `<leader>ts` | Test: nearest / file / suite |
| `<leader>gp` / `<leader>gt` | Git: preview hunk / toggle blame |
| `]h` / `[h` | Git: next/prev hunk |

### tmux

| Keys | Action |
|------|--------|
| `C-a` | Prefix |
| `C-a d` / `C-a s` | Detach / session list |
| `C-a "` / `C-a %` | Split vertical / horizontal |
| `<C-h/j/k/l>` | Navigate panes (vim-tmux-navigator) |
| `Alt-Arrow` | Resize panes |

### Ghostty

| Keys | Action |
|------|--------|
| `cmd+s>h` / `cmd+s>v` | Split left / down |
| `cmd+s>x` | Close split |
| `cmd+s>Arrow` | Move between splits |

## Shell Aliases

```bash
v       # nvim
vim     # nvim
oc      # opencode
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
├── ghostty/                # Ghostty terminal config
│   └── config
├── tmux/                   # tmux configuration (Nord theme)
│   └── tmux.conf
├── nvim/                   # Neovim config (lazy.nvim + Nord)
│   ├── init.lua
│   └── lua/
│       ├── vim-options.lua
│       └── plugins/
├── karabiner/              # Keyboard remapping
├── mcp/                    # MCP configs for AI tools
├── gitui/                  # GitUI terminal client
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

**Powerline symbols not showing?**
- Ensure terminal uses a Nerd Font (JetBrainsMono Nerd Font)
- Restart terminal after font installation

**tmux plugins not loading?**
- Run `~/.tmux/plugins/tpm/bin/install_plugins`

**nvm not found?**
- Restart terminal or `source ~/.zshrc`
