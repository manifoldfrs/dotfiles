# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This is a personal dotfiles repository containing configuration files for development environments and terminal applications. The configurations are organized by application:

- **Terminal**: `ghostty/` (Ghostty terminal)
- **Terminal Multiplexer**: `tmux/` (tmux configuration with TPM plugins)
- **Shell Configuration**: `.zshrc`, `.zprofile`, `.zshenv` (Oh My Zsh + agnoster theme)
- **Git**: `git/gitconfig.symlink`, `git/gitignore_global.symlink`, `.gitconfig`
- **Editor**: `nvim/` (Neovim with lazy.nvim + Nord theme)
- **Keyboard**: `karabiner/` (macOS key remapping, device-specific configs)
- **Package Management**: `Brewfile`, `npm-global-packages.txt`
- **MCP Configuration**: `mcp/` (Model Context Protocol configs for Claude/Codex)
- **Legacy/Optional**: `old/` (archived setup scripts and deprecated configs)

## Primary Development Tools

| Tool | Purpose |
|------|---------|
| **Neovim** | Primary editor (lazy.nvim + Nord theme) |
| **OpenCode** | AI-assisted coding CLI |
| **Ghostty** | Terminal emulator |
| **tmux** | Terminal multiplexer |

## Installation Commands

**Shell & Development Environment:**
```bash
./shell_setup.sh install    # Full install: Homebrew, packages, fonts, Oh My Zsh, tmux, nvim, nvm
./shell_setup.sh backup     # Backup current shell configs to repository
```

**MCP (AI Assistant Tools):**
```bash
./mcp_setup.sh install      # Install MCP configs for Claude Desktop, Codex
./mcp_setup.sh backup       # Backup MCP configs (remember to sanitize API keys!)
```

**Package Management:**
```bash
brew bundle install         # Install from Brewfile
```

## Configuration Architecture

### Font & Prompt Strategy
- **Primary Font**: JetBrainsMono Nerd Font (powerline symbols)
- **Shell**: Zsh with Oh My Zsh agnoster theme (requires Nerd Fonts)
- **Consistency**: Same font across Ghostty, tmux, and Neovim
- **Auto-configuration**: `shell_setup.sh` handles font/Oh My Zsh installation

### Configuration Strategy
- **Shell configs** (`.zshrc`, `.zprofile`, `.zshenv`): COPIED to home directory (not symlinked)
- **Git config**: Uses either `.gitconfig` or `git/gitconfig.symlink`
- **Application configs**: COPIED to respective locations (`~/.config/`, `~/Library/Application Support/`)
- **Design decision**: Copies allow independent local modifications without affecting repository

### Neovim Configuration
- **Structure**: Typecraft-style flat plugin structure in `nvim/lua/plugins/`
- **Plugin Manager**: lazy.nvim (modern, lazy-loading)
- **Key Plugins**: neo-tree, oil.nvim, telescope, nvim-cmp, mason + lspconfig, treesitter, gitsigns, vim-test + vimux
- **Leader Key**: Space
- **Theme**: Nord

### LSP Servers (auto-installed via Mason)
- `lua_ls` - Lua
- `ts_ls` - TypeScript/JavaScript
- `pyright` - Python
- `gopls` - Go
- `clangd` - C/C++

### Ghostty Terminal
- **Config**: `ghostty/config` → `~/.config/ghostty/config`
- **Font**: JetBrainsMono Nerd Font 14pt
- **Theme**: Nord color palette
- **Split Keybindings**: `cmd+s` prefix for split management (h/l/k/j for direction)
- **Shell Integration**: Enabled for zsh

### tmux Configuration
- **Prefix**: `Ctrl-A` (instead of default Ctrl-B)
- **Navigation**: Vim-style with `C-hjkl` for pane movement
- **Plugins** (via TPM):
  - tmux-sensible, tmux-yank
  - vim-tmux-navigator (seamless nvim/tmux navigation)
  - tmux-resurrect, tmux-continuum (session persistence)
- **Theme**: Nord with custom status bar
- **Session Persistence**: Auto-save every 15 minutes, auto-restore on startup

### Karabiner Configuration
- **Primary Function**: Caps Lock → Control modifier
- **Complex Rules**: Tab+hjkl for arrow keys, Fn+Tab for actual caps lock
- **Device-Specific**: Custom mappings for different keyboards
- **Layout Remapping**: Command/Option swaps for external keyboards

### MCP Configuration
Supports Model Context Protocol for AI assistants:
- **Claude Desktop**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Codex**: `~/.codex/config.toml`

## Neovim Keybindings

| Keys | Action |
|------|--------|
| `Space` | Leader key |
| `jk` (insert) | Escape to Normal |
| `<C-n>` | Toggle neo-tree |
| `-` | Open oil.nvim (float) |
| `<C-p>` / `<leader>ff` | Find files |
| `<leader>fg` | Live grep |
| `<leader><leader>` | Recent files |
| `<C-h/j/k/l>` | Navigate windows/tmux panes |
| `<S-h>` / `<S-l>` | Previous/next buffer |
| `gd` / `gr` / `gi` | LSP: definition / references / implementation |
| `K` | LSP: hover documentation |
| `<leader>rn` / `<leader>ca` | LSP: rename / code action |
| `<leader>lf` | Format file |
| `<leader>tt` / `<leader>tf` / `<leader>ts` | Test: nearest / file / suite |

## Shell Aliases

```bash
v       # nvim
vim     # nvim
oc      # opencode
```

## Development Tools Included

- **Languages**: Python (pyenv), Node.js (nvm), Ruby (rbenv)
- **CLI Tools**: AWS CLI, bat, eza, fd, fzf, jq, tree, tldr, diff-so-fancy, repomix
- **Terminals**: Ghostty, tmux
- **Databases**: PostgreSQL@14, Redis, SQLite
- **Dev Tools**: Neovim, Git LFS, Pulumi
- **AI Tools**: OpenCode, Claude Code, Codex
- **Package Managers**: Homebrew, npm/yarn, pip, gem

## Development Notes

- **No Build Process**: Pure configuration files, no compilation needed
- **Platform**: macOS-focused (Homebrew, Karabiner, Ghostty, Darwin checks)
- **Primary Workflow**: Ghostty + tmux + Neovim + OpenCode
- **Shell**: Zsh with Oh My Zsh agnoster theme (powerline symbols)
- **Font Dependency**: agnoster theme requires Nerd Fonts for proper display
- **Theme Consistency**: Nord theme across Ghostty, tmux, and Neovim
- **Package Management**: Brewfile for reproducible environments
- **Copy vs Symlink**: Shell configs are copied (not symlinked) for easier local customization
