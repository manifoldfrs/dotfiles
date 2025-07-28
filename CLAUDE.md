# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This is a personal dotfiles repository containing configuration files for development environments and terminal applications. The configurations are organized by application:

- **Primary Terminals**: `cursor/` (Cursor IDE integrated terminal), `warp/` (Warp terminal themes)
- **Shell Configuration**: `.zshrc` (Oh My Zsh + agnoster theme)
- **Git**: `git/gitconfig.symlink`, `git/gitignore_global.symlink`
- **Editor**: `nvim/` (vim configuration), `nvim_lua_config/` (modern Lua configuration)
- **Keyboard**: `karabiner/` (macOS key remapping, caps lock → ctrl)
- **Package Management**: `Brewfile`, `brew_*.txt` (Homebrew package lists)
- **Fallback Terminals**: `kitty/`, `iterm2/iterm2.symlink` (optional)
- **Terminal UI**: `gitui/` (Git TUI configuration)

## Installation Commands

**Complete New Mac Setup:**
```bash
./setup_new_mac.sh        # Complete guided setup for new MacBook (recommended)
```

**Individual Setup Scripts:**
```bash
./install.sh              # Install dotfiles and create symlinks
./setup_fonts.sh          # Install Nerd Fonts + Oh My Zsh via Homebrew
./install_dev_tools.sh    # Install development tools (Python, Node, Ruby, AWS CLI, etc.)
./verify_fonts.sh         # Check if Nerd Fonts are installed correctly
```

**Cursor IDE Setup:**
```bash
./sync_cursor_settings.sh      # Sync current Cursor settings to dotfiles
./install_cursor_extensions.sh # Install extensions from extensions.txt
./setup_cursor_fonts.sh        # Configure Cursor IDE terminal fonts
```

**Package Management:**
```bash
./export_brew_packages.sh      # Export current Homebrew packages
brew bundle install            # Install from Brewfile
```

**Manual Sync (when dotfiles need updating):**
```bash
# Copy current configs back to repository
cp ~/.zshrc .
cp -r ~/.config/nvim .
cp -r ~/.config/karabiner .
cp -r ~/.warp/themes warp/
./sync_cursor_settings.sh
```

## Configuration Architecture

### Font & Prompt Strategy
- **Primary Font**: JetBrainsMonoNL Nerd Font (powerline symbols)
- **Shell**: Zsh with Oh My Zsh agnoster theme (requires powerline fonts)
- **Consistency**: Same font across Cursor IDE terminal, Warp, and editor
- **Auto-configuration**: Scripts handle font/Oh My Zsh installation and terminal setup

### Symlink Pattern
- Files ending in `.symlink` are linked to home directory without extension
- Example: `git/gitconfig.symlink` → `~/.gitconfig`
- Config files go to `~/.config/` directory

### Neovim Configuration
- **Structure**: Modular Lua configuration in `nvim/lua/user/`
- **Plugin Manager**: Packer (based on `init.lua` imports)
- **Key Modules**: LSP, telescope, treesitter, colorscheme, keymaps
- **Legacy Support**: Also includes vim-plug configuration

### Primary Terminal Integration
- **Cursor IDE**: Comprehensive `cursor/settings.json` with:
  - Language-specific formatters (Prettier, Black)
  - Vim keybindings and easymotion
  - Nord theme with custom terminal colors
  - JetBrainsMonoNL Nerd Font pre-configured
- **Warp Terminal**: `warp/themes/nord.yaml` provides consistent Nord theming
- **Backup System**: Settings are synced and backed up regularly

### Karabiner Configuration
- **Primary Function**: Caps Lock → Control modifier
- **Complex Rules**: Double-tap caps lock for actual caps lock
- **Assets**: Custom complex modifications in `assets/complex_modifications/`

## Development Tools Included

- **Languages**: Python (pyenv), Node.js (nvm), Ruby (rbenv)
- **CLI Tools**: AWS CLI, bat, exa, fd, fzf, jq, tree, tldr, diff-so-fancy
- **Databases**: PostgreSQL, Redis, SQLite
- **Dev Tools**: Git LFS, Exercism, Pulumi, Tesseract, Repomix
- **Package Managers**: Homebrew, npm/yarn, pip, gem

## Development Notes

- **No Build Process**: Pure configuration files, no compilation needed
- **Platform**: macOS-focused (Homebrew, Karabiner, Cursor paths)
- **Primary Workflow**: Cursor IDE integrated terminal + Warp terminal
- **Shell**: Zsh with Oh My Zsh agnoster theme (powerline symbols)
- **Font Dependency**: agnoster theme requires Nerd Fonts for proper display
- **Theme Consistency**: Nord theme across Cursor IDE, Warp, and terminal applications
- **Package Management**: Brewfile for reproducible environments