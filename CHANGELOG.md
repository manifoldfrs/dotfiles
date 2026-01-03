# Changelog

All notable changes to this dotfiles repository are documented here.

## January 2025

### Added

- **npm-global-packages.txt**: Added `tree-sitter-cli` as a required dependency

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

- **nvim/telescope**: Migrated telescope.nvim from `0.1.x` to `master` branch
  - The `0.1.x` branch is incompatible with nvim-treesitter `main` branch
  - `0.1.x` uses deprecated `nvim-treesitter.parsers.ft_to_lang()` which no longer exists
  - `master` branch uses built-in `vim.treesitter.language.get_lang()` (requires Neovim >= 0.9)
  - Fix for error: `attempt to call field 'ft_to_lang' (a nil value)`

- **nvim/treesitter**: Disabled folding by default (`vim.opt.foldenable = false`)
  - Treesitter-based folding was collapsing all code blocks on file open
  - Users can still use `zR` to open all folds or toggle with `:set foldenable`

- **nvim**: Migrated nvim-treesitter to `main` branch (breaking change from `master`)
  - `master` branch is now frozen; `main` branch is a complete rewrite
  - Replaced `require("nvim-treesitter.configs").setup()` with new API
  - Now uses `require("nvim-treesitter").install()` for parser installation
  - Highlighting/indentation enabled via `FileType` autocmd (`vim.treesitter.start()`)
  - Added treesitter-based folding (`vim.opt.foldexpr`)
  - Requires `tree-sitter-cli` >= 0.26.1 (install via `npm install -g tree-sitter-cli`)
  - See `nvim/lua/plugins/treesitter.lua`

- **Brewfile**: Added `ripgrep` (required for Telescope live grep)

- **Brewfile**: Removed `starship` prompt (deprecated, using oh-my-zsh agnoster theme)

- **zshrc**: Added `unsetopt autocd` to prevent directory name commands from triggering cd

- **tmux**: Replaced manual Nord theme styles with `nordtheme/tmux` TPM plugin
  - Removed: 12 lines of hand-coded status bar styles
  - Added: `set -g @plugin 'nordtheme/tmux'`
  - Benefits: Official theme, powerline-style status bar, maintained upstream

- **tmux**: Added reload keybind (`C-a r` to source ~/.tmux.conf)

- **tmux**: Status bar positioned at top (`status-position top`)

- **zshrc**: Enhanced history settings
  - `HISTSIZE=10000`, `SAVEHIST=50000`
  - `inc_append_history` - save immediately, not on exit
  - `share_history` - share between terminal sessions

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
