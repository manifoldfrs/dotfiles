# Changelog

All notable changes to this dotfiles repository are documented here.

## February 2026

### tmux: smart pane switching and improved UX

- **tmux/tmux.conf**: Added Vim-aware pane navigation and usability improvements
  - Smart pane switching: C-h/j/k/l detects if pane is running vim/nvim and sends keys appropriately
  - Copy-mode navigation: C-h/j/k/l works in copy-mode without vim detection
  - Pane resize: M-Arrow keys for quick resizing (5px horizontal, 2px vertical)
  - Utilities: C-k clears history, C-a R toggles switch-client
  - Copy-mode selection styling: Nord-themed yellow highlight for better visibility
  - Files: `tmux/tmux.conf`

### Neovim: migrated nvim-treesitter to `main` rewrite

- **nvim/treesitter**: Migrated from frozen `master` API to `main` API
  - Replaced `require("nvim-treesitter.configs").setup(...)` with `require("nvim-treesitter").setup({})`
  - Added parser bootstrap via `require("nvim-treesitter").install(...)`
  - Enabled highlighting + indentation via `FileType` autocmd (`vim.treesitter.start()` + `indentexpr`)
  - Set plugin spec to `branch = "main"` and `lazy = false` per upstream `main` guidance
  - Files: `nvim/lua/plugins/treesitter.lua`, `nvim/lazy-lock.json`

### Setup: auto-sync Neovim plugins during install

- **shell setup**: Added headless Lazy sync after copying Neovim config
  - Runs: `nvim --headless -c "Lazy! sync" -c "qa"`
  - Prevents startup errors on fresh machines where plugin modules are not installed yet
  - File: `shell_setup.sh`

### Neovim: added markdown rendering plugin

- **nvim/markdown**: Added `MeanderingProgrammer/render-markdown.nvim` for in-buffer markdown rendering
  - Lazy-loads for markdown buffers
  - File: `nvim/lua/plugins/render-markdown.lua`

### Neovim: added Diffview + Spectre workflows

- **nvim/git review**: Added `sindrets/diffview.nvim` for tabbed diff review and file history
  - Keymaps: `<leader>gD`, `<leader>gC`, `<leader>gh`, `<leader>gH`
  - File: `nvim/lua/plugins/diffview.lua`

- **nvim/search + replace**: Added `nvim-pack/nvim-spectre` for project and file-scoped search/replace
  - Keymaps: `<leader>sR`, `<leader>sw` (normal + visual), `<leader>sW`
  - File: `nvim/lua/plugins/spectre.lua`

- **nvim/which-key**: Added labels for new Diffview and Spectre keymaps
  - File: `nvim/lua/plugins/which-key.lua`

- **docs**: Updated Neovim plugin list, requirements, and keybindings
  - File: `README.md`

### Theme update: switched back to Nord (Neovim + Ghostty)

- **nvim**: Switched colorscheme from Catppuccin back to Nord
  - Replaced `catppuccin/nvim` with `shaunsingh/nord.nvim`
  - Updated lualine theme from `catppuccin` to `nord`
  - Files: `nvim/lua/plugins/colorscheme.lua`, `nvim/lua/plugins/lualine.lua`

- **ghostty**: Switched terminal theme from Catppuccin Mocha to Nord
  - Updated `theme = Nord`
  - File: `ghostty/config`

- **docs**: Updated theme references to match current configuration
  - Updated Neovim and Ghostty theme labels in `README.md`
  - Updated Neovim package identity in `nvim/AGENTS.md`

### Deprecated: Karabiner

- **Brewfile**: Removed `karabiner-elements` cask from managed installs
- **README**: Replaced Karabiner setup instructions with deprecation note
- **AGENTS docs**: Removed Karabiner from active root guidance; kept `karabiner/` as archive reference

### Documentation + which-key label corrections

- **nvim/which-key**: Corrected label accuracy for active keymaps
  - Removed stale groups with no active mappings: `<leader>f` (Find), `<leader>l` (LSP)
  - Fixed incorrect label: `<leader>sg` changed from "Git Search" to "Grep"
  - Converted leaf entries from `group` to `desc` for proper which-key rendering:
    - `<leader>sn` -> "Notification History"
    - `<leader>ss` -> "LSP Symbols"
  - File: `nvim/lua/plugins/which-key.lua`

- **nvim/vim-options**: Added keymap description for search highlight clear
  - `<leader>h` now has `desc = "Clear search highlight"`
  - File: `nvim/lua/vim-options.lua`

- **README**: Updated keybinding docs to match current mappings
  - `<leader>sg` documented as "Grep" (instead of "Live grep")
  - Added `<leader>h` -> "Clear search highlight"

### Major Neovim Migration: snacks.nvim + blink.cmp + opencode.nvim

- **nvim**: Complete plugin ecosystem overhaul
  - **ADDED** `folke/snacks.nvim` - Modern QoL plugin collection
    - Replaces: `alpha.nvim`, `nvim-bbye`, `indent-blankline.nvim`, `nvim-surround`, `Comment.nvim`
    - New features: `dashboard`, `bufdelete`, `indent`, `scope`, `notifier`, `lazygit`, `scratch`, `words`, `git`, `zen`, `toggle`, `quickfile`, `bigfile`
    - Enabled `input` and `picker` for opencode.nvim integration
    - Keymaps: `<leader>s` prefix for search/picker, `<leader>u` for toggles, `<leader>bd` for buffer delete
    - File: `nvim/lua/plugins/snacks.lua`
  
  - **ADDED** `saghen/blink.cmp` - High-performance completion engine
    - Replaces: `nvim-cmp`, `cmp-nvim-lsp`, `cmp-buffer`, `cmp-path`, `cmp_luasnip`
    - Rust-based fuzzy matching (0.5-4ms response time)
    - Native LuaSnip integration maintained
    - `super-tab` preset for Tab-to-accept behavior
    - File: `nvim/lua/plugins/blink.lua`
  
  - **ADDED** `NickvanDyke/opencode.nvim` - AI coding assistant integration
    - New plugin for opencode CLI integration within Neovim
    - Uses tmux provider (horizontal split, focus stays in Neovim)
    - Keymaps: `<leader>o` prefix (oa=ask, os=select, ot=toggle, oo=operator, og=line)
    - blink.cmp completion support in ask() input
    - File: `nvim/lua/plugins/opencode.lua`
  
  - **REMOVED** deprecated plugins:
    - `alpha.nvim` → replaced by snacks dashboard
    - `nvim-cmp` ecosystem → replaced by blink.cmp
    - `telescope.nvim` → replaced by snacks.picker
    - `editor.lua` (vim-bbye, indent-blankline, surround, comment) → replaced by snacks
  
  - **UPDATED** `nvim/lua/plugins/lsp-config.lua`
    - Changed dependency from `cmp-nvim-lsp` to `saghen/blink.cmp`
    - Updated LSP capabilities to use `blink.cmp.get_lsp_capabilities()`
  
  - **UPDATED** `nvim/lua/plugins/which-key.lua`
    - Added keymap groups: `<leader>o` (opencode), `<leader>s` (Search), `<leader>u` (Toggle)
    - Added labels for `<leader>sn` (Notifications), `<leader>ss` (LSP Symbols), `<leader>sg` (Grep)

- **Brewfile**: Added new dependencies
  - `lazygit` - Terminal UI for git (required for snacks.lazygit keymap `<leader>gg`)
  - `imagemagick` - Image manipulation (required for snacks.image preview support)

### Synced (Historical snapshot)

- **nvim**: Synced live config from `~/.config/nvim` to dotfiles repo
  - Added `lazy-lock.json` for plugin version locking
  - At that time, `treesitter.lua` used the frozen `master` API:
    - `nvim-treesitter/nvim-treesitter` on `master` branch (v0.10-era)
    - `require("nvim-treesitter.configs").setup()`
  - At that time, `telescope.lua` was on `0.1.x`
  - Minor formatting fix in `git.lua`

**Historical note**: The January 2025 migration to treesitter `main` was attempted and reverted at that time. As of February 2026, treesitter is migrated to `main` with the new API (see entries above).

## January 2025

### Changed

- **nvim/lsp-config**: Replaced deprecated `sign_define()` with `vim.diagnostic.config()`
  - Diagnostic signs now configured via `signs.text` table in `vim.diagnostic.config()`
  - Fixes deprecation warning: "Defining diagnostic signs with :sign-define or sign_define() is deprecated"
  - See `nvim/lua/plugins/lsp-config.lua`

- **nvim/lsp-config**: Added `virtual_lines` for inline diagnostic messages
  - Shows full diagnostic message below the error line when cursor is on it
  - Configured with `virtual_lines = { current_line = true }`
  - Requires Neovim 0.11+

- **nvim/lsp-config**: Added descriptions to all LSP keymaps
  - `gd` → "Go to definition", `gD` → "Go to declaration", etc.
  - Descriptions now appear in which-key popup
  - See `nvim/lua/plugins/lsp-config.lua`

- **nvim/which-key**: Disabled icon rules to fix blue square glyphs
  - Added `icons = { rules = false }` to which-key setup
  - Prevents filetype icon fallback that caused rendering issues
  - See `nvim/lua/plugins/which-key.lua`

- **nvim/vim-options**: Enabled relative line numbers
  - Changed `vim.opt.relativenumber` from `false` to `true`
  - See `nvim/lua/vim-options.lua`

### Added

- **Brewfile**: Added `btop` system monitor for performance monitoring

- **opencode**: Added opencode.jsonc configuration
  - Catppuccin theme
  - MCP server configs (RepoPrompt, Ref, Exa)
  - API keys redacted with `****` - replace with your own

- **bin/tmux-sessionizer**: New fzf-based project switcher script
  - Fuzzy find and switch between project directories
  - Creates named tmux sessions for each project
  - Session name visible in status bar provides project context
  - Bound to `C-a f` in tmux
  - Inspired by ThePrimeagen's workflow

- **nvim**: Git merge conflict resolution via `git-conflict.nvim`
  - VSCode-like visual highlighting of conflict regions
  - Keymaps: `co` (ours), `ct` (theirs), `cb` (both), `c0` (none)
  - Navigation: `]x` / `[x` to jump between conflicts
  - `:GitConflictListQf` to list all conflicts in quickfix
  - See `nvim/lua/plugins/git.lua`

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

- **nvim**: Switched colorscheme from Nord to Catppuccin Mocha
  - Replaced `shaunsingh/nord.nvim` with `catppuccin/nvim`
  - Updated lualine theme from `nord` to `catppuccin`
  - See `nvim/lua/plugins/colorscheme.lua` and `nvim/lua/plugins/lualine.lua`

- **ghostty**: Switched from manual Nord palette to Catppuccin Mocha
  - Replaced 20+ lines of manual color definitions with `theme = Catppuccin Mocha`
  - Uses Ghostty's built-in theme support for cleaner config

- **tmux**: Switched from Nord theme to Catppuccin Mocha
  - Replaced: `set -g @plugin 'nordtheme/tmux'`
  - Added: `set -g @plugin 'catppuccin/tmux'` with mocha flavor
  - Status bar shows directory + session name for project context
  - Rounded window status style

- **zshrc**: Switched from `agnoster` to `robbyrussell` theme
  - Faster prompt rendering (no powerline overhead)
  - Project context now provided by tmux session name instead of prompt
  - Part of "speed-focused" terminal setup

- **tmux**: Replaced `vim-tmux-navigator` TPM plugin with manual `is_vim` script
  - Removed: `set -g @plugin 'christoomey/vim-tmux-navigator'`
  - Added: Manual `is_vim` detection script (~15 lines in tmux.conf)
  - Benefits: Reduces dependencies, same functionality, transparent implementation
  - Still works seamlessly with `nvim-tmux-navigation` Neovim plugin
  - C-h/j/k/l switches between vim splits and tmux panes as before

- **nvim/telescope**: [ATTEMPTED, REVERTED] Migrated telescope.nvim from `0.1.x` to `master` branch
  - The `0.1.x` branch is incompatible with nvim-treesitter `main` branch
  - `0.1.x` uses deprecated `nvim-treesitter.parsers.ft_to_lang()` which no longer exists
  - `master` branch uses built-in `vim.treesitter.language.get_lang()` (requires Neovim >= 0.9)
  - Fix for error: `attempt to call field 'ft_to_lang' (a nil value)`
  - **REVERTED**: Back to `0.1.x` for stability (see February 2026)

- **nvim/treesitter**: Disabled folding by default (`vim.opt.foldenable = false`)
  - Treesitter-based folding was collapsing all code blocks on file open
  - Users can still use `zR` to open all folds or toggle with `:set foldenable`

- **nvim**: [ATTEMPTED, REVERTED] Migrated nvim-treesitter to `main` branch (breaking change from `master`)
  - `master` branch is now frozen; `main` branch is a complete rewrite
  - Replaced `require("nvim-treesitter.configs").setup()` with new API
  - Now uses `require("nvim-treesitter").install()` for parser installation
  - Highlighting/indentation enabled via `FileType` autocmd (`vim.treesitter.start()`)
  - Added treesitter-based folding (`vim.opt.foldexpr`)
  - Requires `tree-sitter-cli` >= 0.26.1 (install via `npm install -g tree-sitter-cli`)
  - See `nvim/lua/plugins/treesitter.lua`
  - **REVERTED**: Back to `master` branch with old API for stability (see February 2026)

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

- **warp**: Removed `themes/nord.yaml` (deprecated, switched to Catppuccin)

- **ghostty**: Removed split keybindings (`cmd+s>h/j/k/l/x`, `cmd+s>Arrow`, `shift+enter`)
  - Using tmux for all split/pane management instead
  - Simplifies config, avoids redundant functionality

### Documentation

- Updated `nvim/AGENTS.md` with debugging keybindings and touch points
- Removed deprecated `CLAUDE.md` files (replaced by `AGENTS.md`)
- Added this CHANGELOG

## January 2026

### Changed

- **nvim**: Migrated from none-ls to modern conform.nvim + nvim-lint architecture
  - **BREAKING**: Removed `nvim/lua/plugins/none-ls.lua` (none-ls deprecated)
  - **NEW**: Added `nvim/lua/plugins/conform.lua` for formatting (format-on-save)
  - **NEW**: Added `nvim/lua/plugins/nvim-lint.lua` for linting (async, non-blocking)
  - Separates formatting and linting concerns for better performance and maintainability
  - Community-standard approach used by LazyVim, AstroNvim
  - See migration details below

- **nvim/Python stack**: Switched to Astral's unified Python toolchain (Ruff + ty)
  - **Linting**: Replaced flake8 with Ruff (~100x faster, < 10ms)
  - **Formatting**: Replaced black + isort with Ruff (drop-in compatible, < 20ms)
  - **Type checking**: Replaced mypy on-save with ty LSP (10-100x faster than mypy/Pyright)
  - **ty v0.0.11 (Beta)**: Production-ready per Astral, stable release planned 2026
  - **NOTE**: ty installed via `uv tool install ty@latest` (not in Mason yet)
  - Pyright installed as fallback option if needed

- **nvim/performance**: Disabled legacy providers for 5x faster Python file loading
  - Added `vim.g.loaded_python3_provider = 0` (saves ~1.2s per Python file)
  - Also disabled: `loaded_ruby_provider`, `loaded_perl_provider`, `loaded_node_provider`
  - **Performance improvement**: Python files load in ~287ms (down from ~1400ms)
  - **Caveat**: If you use Python-based nvim plugins (rare), remove this line
  - Modern Lua-based plugins unaffected

- **nvim/lsp-config**: Disabled pyright auto-enable to prevent LSP conflicts
  - Commented out `"pyright"` in mason-lspconfig ensure_installed
  - ty is now the primary Python LSP, pyright available as fallback
  - Prevents double LSP attachment (both ty and pyright attaching to same file)

- **nvim/completions**: Prevented Enter from auto-accepting first completion
  - `cmp.mapping.confirm({ select = false })` now requires explicit selection
  - See `nvim/lua/plugins/completions.lua`

- **nvim/vim-options**: Added language-specific indentation rules
  - **Python/Go**: 4 spaces (shiftwidth, tabstop, softtabstop = 4)
  - **JavaScript/TypeScript**: 2 spaces (shiftwidth, tabstop, softtabstop = 2)
  - Uses FileType autocmds for per-language configuration
  - Removed global hardcoded 2-space indent settings

- **nvim/nvim-lint**: Optimized linting triggers for better performance
  - Runs on BufWritePost only (after save, not on file open)
  - Changed event trigger from BufReadPre to BufReadPost (delayed load)
  - Removed BufEnter autocmd to prevent linting on every buffer switch
  - Async execution prevents blocking editor

### Performance Summary

**Before migration:**
- Python file load: ~1400ms
- Python file save: ~2-5s (mypy + flake8 + black + isort)

**After migration:**
- Python file load: ~287ms (5x faster)
- Python file save: < 50ms (100x faster)
- Type checking: Real-time via ty LSP (< 10ms incremental updates)

### Installation Notes

**New dependencies:**
```bash
# uv (Astral package manager) - auto-installed during setup
curl -LsSf https://astral.sh/uv/install.sh | sh

# ty (Type checker) - install via uv
uv tool install ty@latest

# Mason tools (install via :MasonInstall in nvim)
:MasonInstall ruff pyright
```

**PATH configuration:**
Added to ~/.zshrc: `export PATH="$HOME/.local/bin:$PATH"`

### Toolchain Summary

**Python:**
- Indent: 4 spaces
- Linting: Ruff (replaces flake8)
- Formatting: Ruff (replaces black + isort)
- Type checking: ty LSP (replaces mypy/pyright)

**Go:**
- Indent: 4 spaces
- Linting: golangci-lint
- Formatting: goimports + gofmt
- Type checking: gopls

**JavaScript/TypeScript:**
- Indent: 2 spaces
- Linting: biome
- Formatting: biome
- Type checking: ts_ls

**Lua:**
- Formatting: stylua

### Rollback Instructions

If you need to revert these changes:
```bash
# Restore from backup
rm -rf ~/.config/nvim
cp -r ~/.config/nvim.backup.20260109140837 ~/.config/nvim
```

Or switch to Pyright instead of ty:
1. Uncomment `"pyright"` in lsp-config.lua line 31
2. Comment out ty configuration (lines 54-67)
3. Restart nvim

---

- **opencode**: Switched MCP web search tool from Exa to Tavily

## Previous (Undated)

Initial dotfiles setup with:
- Neovim config (lazy.nvim, Nord theme, LSP, Treesitter, Telescope)
- tmux config (Nord theme, TPM plugins, session persistence)
- Ghostty terminal config
- Zsh with oh-my-zsh, nvm, syntax highlighting
- Karabiner keyboard remapping
- MCP configs for AI coding assistants
- Docker-based test suite
