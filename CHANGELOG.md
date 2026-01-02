# Changelog

All notable changes to this dotfiles repository are documented here.

## January 2025

### Added

- **nvim**: Debugging support via nvim-dap ecosystem
  - `nvim-dap` + `nvim-dap-ui` + `nvim-dap-virtual-text`
  - `mason-nvim-dap` for auto-installing debug adapters
  - Go debugging via `nvim-dap-go` (delve)
  - Python debugging via `nvim-dap-python` (debugpy)
  - Keymaps under `<leader>d` prefix (dc=continue, db=breakpoint, etc.)
  - DAP UI auto-opens when debugging starts
  - See `nvim/lua/plugins/debugging.lua`

- **zshrc**: Added OpenCode to PATH (`export PATH="$HOME/.opencode/bin:$PATH"`)

### Changed

- **tmux**: Replaced `vim-tmux-navigator` TPM plugin with manual `is_vim` script
  - Removed: `set -g @plugin 'christoomey/vim-tmux-navigator'`
  - Added: Manual `is_vim` detection script (~15 lines in tmux.conf)
  - Benefits: Reduces dependencies, same functionality, transparent implementation
  - Still works seamlessly with `nvim-tmux-navigation` Neovim plugin
  - C-h/j/k/l switches between vim splits and tmux panes as before

- **Brewfile**: Added `ripgrep` (required for Telescope live grep)

- **Brewfile**: Removed `starship` prompt (deprecated, using oh-my-zsh agnoster theme)

- **zshrc**: Added `unsetopt autocd` to prevent directory name commands from triggering cd

### Removed

- **ghostty**: Removed split keybindings (`cmd+s>h/j/k/l/x`, `cmd+s>Arrow`, `shift+enter`)
  - Using tmux for all split/pane management instead
  - Simplifies config, avoids redundant functionality

### Documentation

- Updated `nvim/AGENTS.md` with debugging keybindings and touch points
- Removed deprecated `CLAUDE.md` files (replaced by `AGENTS.md`)
- Added this CHANGELOG

## Previous (Undated)

Initial dotfiles setup with:
- Neovim config (lazy.nvim, Nord theme, LSP, Treesitter, Telescope)
- tmux config (Nord theme, TPM plugins, session persistence)
- Ghostty terminal config
- Zsh with oh-my-zsh, nvm, syntax highlighting
- Karabiner keyboard remapping
- MCP configs for AI coding assistants
- Docker-based test suite
