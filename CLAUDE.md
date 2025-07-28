# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This is a personal dotfiles repository containing configuration files for development environments and terminal applications. The configurations are organized by application:

- **Primary Terminals**: `cursor/` (Cursor IDE integrated terminal), `warp/` (Warp terminal themes)
- **Shell Configuration**: `.zshrc`, `.bashrc`, `.bash_profile` (symlinked from home)
- **Git**: `git/gitconfig.symlink` (symlinks to `~/.gitconfig`)
- **Editor**: `nvim/` (comprehensive Neovim Lua configuration), `vim/vimrc.symlink`
- **Keyboard**: `karabiner/` (macOS key remapping, caps lock → ctrl)
- **Shell Prompt**: `starship.toml` (custom prompt configuration)
- **Fallback Terminals**: `alacritty.yml`, `kitty/`, `iterm2/iterm2.symlink`
- **Terminal UI**: `gitui/` (Git TUI configuration)

## Installation Commands

**Primary Setup:**
```bash
./install.sh              # Creates symlinks and offers font installation
```

**Font & Prompt Management:**
```bash
./setup_fonts.sh          # Install Nerd Fonts + Starship via Homebrew
./verify_fonts.sh         # Check if Nerd Fonts are installed correctly
./setup_cursor_fonts.sh   # Configure Cursor IDE terminal fonts
```

**Cursor IDE Setup:**
```bash
./sync_cursor_settings.sh      # Sync current Cursor settings to dotfiles
./install_cursor_extensions.sh # Install extensions from extensions.txt
```

**Manual Sync (when dotfiles need updating):**
```bash
# Copy current configs back to repository
cp ~/.zshrc .
cp ~/.config/alacritty/alacritty.yml .
cp ~/.config/starship.toml .
cp -r ~/.config/nvim .
cp -r ~/.config/karabiner .
```

## Configuration Architecture

### Font & Prompt Strategy
- **Primary Font**: JetBrainsMonoNL Nerd Font (powerline symbols)
- **Prompt**: Starship cross-shell prompt (replaces Oh My Zsh themes)
- **Consistency**: Same font across Alacritty, Cursor IDE terminal, and editor
- **Auto-configuration**: Scripts handle font/prompt installation and terminal setup
- **Powerline Fix**: `.zshrc` loads Starship after Oh My Zsh to override agnoster theme

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

## Development Notes

- **No Build Process**: Pure configuration files, no compilation needed
- **Platform**: macOS-focused (Homebrew, Karabiner, Cursor paths)
- **Primary Workflow**: Cursor IDE integrated terminal + Warp terminal
- **Font Dependency**: Powerline symbols require Nerd Fonts installation
- **Theme Consistency**: Nord theme across Cursor IDE, Warp, and terminal applications