# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This is a personal dotfiles repository containing configuration files for development environments and terminal applications. The configurations are organized by application:

- **Primary Terminals**: `ghostty/` (Ghostty terminal), `warp/` (Warp terminal themes)
- **Terminal Multiplexer**: `tmux/` (tmux configuration with TPM plugins)
- **Shell Configuration**: `.zshrc`, `.zprofile`, `.zshenv` (Oh My Zsh + agnoster theme)
- **Git**: `git/gitconfig.symlink`, `git/gitignore_global.symlink`, `.gitconfig`
- **Editor**: `nvim/` (Neovim with lazy.nvim + Lua configuration)
- **IDE Configurations**:
  - `cursor/settings.json`, `cursor/keybindings.json` (current Cursor config)
  - `cursor/settings_nvim_config.json`, `cursor/keybindings_nvim_config.json` (nvim-based config with whichkey)
  - `cursor/extensions.txt` (installed extensions list)
- **Keyboard**: `karabiner/` (macOS key remapping, device-specific configs)
- **Package Management**: `Brewfile`, `npm-global-packages.txt`
- **MCP Configuration**: `mcp/` (Model Context Protocol configs for Claude/Cursor/Codex/Droid)
- **Legacy/Optional**: `old/` (archived setup scripts), `kitty/`, `iterm2/`, `gitui/`

## Installation Commands

**Shell & Development Environment:**
```bash
./shell_setup.sh install    # Full install: Homebrew, packages, fonts, Oh My Zsh, tmux, nvim, nvm
./shell_setup.sh backup     # Backup current shell configs to repository
```

**Cursor IDE:**
```bash
./cursor_setup.sh install   # Install Cursor settings, keybindings, extensions
./cursor_setup.sh backup    # Backup current Cursor config to repository
```

**MCP (AI Assistant Tools):**
```bash
./mcp_setup.sh install      # Install MCP configs for Claude Desktop, Cursor, Codex, Droid
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
- **Consistency**: Same font across Ghostty, Cursor IDE, Warp, and editor
- **Auto-configuration**: `shell_setup.sh` handles font/Oh My Zsh installation

### Configuration Strategy
- **Shell configs** (`.zshrc`, `.zprofile`, `.zshenv`): COPIED to home directory (not symlinked)
- **Git config**: Uses either `.gitconfig` or `git/gitconfig.symlink`
- **Application configs**: COPIED to respective locations (`~/.config/`, `~/Library/Application Support/`)
- **Design decision**: Copies allow independent local modifications without affecting repository

### Neovim Configuration
- **Structure**: Modular Lua configuration in `nvim/lua/user/`
- **Plugin Manager**: lazy.nvim (modern, lazy-loading)
- **Key Modules**: LSP (Mason), telescope, treesitter, nvim-cmp, gitsigns
- **Leader Key**: Space
- **Theme**: Nord

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

### Cursor IDE Integration
- **Theme**: Nord with custom terminal colors
- **Font**: JetBrainsMonoNL Nerd Font
- **Vim Features**: Easymotion, surround, relative line numbers
- **Formatters**: Prettier (JS/HTML/CSS), Biome (TSX/JSON), Black (Python)
- **Extensions**: 36 extensions including GitLens, Magit, Claude Code

### Karabiner Configuration
- **Primary Function**: Caps Lock → Control modifier
- **Complex Rules**: Tab+hjkl for arrow keys, Fn+Tab for actual caps lock
- **Device-Specific**: Custom mappings for 9 different keyboards
- **Layout Remapping**: Command/Option swaps for external keyboards

### MCP Configuration
Supports Model Context Protocol for AI assistants:
- **Claude Desktop**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Cursor**: `~/.cursor/mcp.json`
- **Codex**: `~/.codex/config.toml`
- **Droid/Factory**: `~/.factory/mcp.json`

## Development Tools Included

- **Languages**: Python (pyenv), Node.js (nvm), Ruby (rbenv)
- **CLI Tools**: AWS CLI, bat, eza, fd, fzf, jq, tree, tldr, diff-so-fancy, repomix
- **Terminals**: Ghostty, tmux
- **Databases**: PostgreSQL@14, Redis, SQLite
- **Dev Tools**: Neovim, Git LFS, Exercism, Pulumi, Tesseract
- **AI Tools**: Claude Code, Codex, Droid
- **Package Managers**: Homebrew, npm/yarn, pip, gem

## Development Notes

- **No Build Process**: Pure configuration files, no compilation needed
- **Platform**: macOS-focused (Homebrew, Karabiner, Ghostty, Darwin checks)
- **Primary Workflow**: Ghostty + tmux + Neovim / Cursor IDE
- **Shell**: Zsh with Oh My Zsh agnoster theme (powerline symbols)
- **Font Dependency**: agnoster theme requires Nerd Fonts for proper display
- **Theme Consistency**: Nord theme across all terminals and editors
- **Package Management**: Brewfile for reproducible environments
- **Copy vs Symlink**: Shell configs are copied (not symlinked) for easier local customization
