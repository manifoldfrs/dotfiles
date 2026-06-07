# AGENTS.md - Neovim Configuration

## Package Identity
Neovim config using lazy.nvim with Tokyo Night.
Requires Neovim >= 0.11.0 for `vim.lsp.config()`.

## Setup & Run
```bash
./scripts/bootstrap.sh
stow --no-folding -R -t "$HOME" -d stow nvim
nvim
:Lazy sync
:Mason
:LspInfo
```

## Patterns & Conventions

### File Organization
```
nvim/
├── .config/
│   └── nvim/
│       ├── init.lua
│       └── lua/
│           ├── vim-options.lua
│           └── plugins/
│               ├── snacks.lua
│               ├── lsp-config.lua
│               └── ...
```

### Examples
- ✅ DO: Add plugin specs like `stow/nvim/.config/nvim/lua/plugins/snacks.lua`
- ✅ DO: Keep base options in `stow/nvim/.config/nvim/lua/vim-options.lua`
- ✅ DO: LSP servers + keymaps in `stow/nvim/.config/nvim/lua/plugins/lsp-config.lua`
- ✅ DO: Keymaps with `{ desc = "..." }`
- ✅ DO: Keep leader namespaces consistent: `<leader>g` Git, `<leader>s` Search, `<leader>t` Test, `<leader>j` Jump, `<leader>u` Toggle
- ❌ DON'T: Use legacy Vimscript from `old/iterm2/nvim/init.vim`
- ❌ DON'T: Put multiple unrelated plugins in one file (use `stow/nvim/.config/nvim/lua/plugins/*.lua`)
- ❌ DON'T: Omit keymap descriptions

## Touch Points / Key Files
- Entry point: `stow/nvim/.config/nvim/init.lua`
- Options + leader: `stow/nvim/.config/nvim/lua/vim-options.lua`
- LSP config: `stow/nvim/.config/nvim/lua/plugins/lsp-config.lua`
- Snacks picker: `stow/nvim/.config/nvim/lua/plugins/snacks.lua`
- Treesitter: `stow/nvim/.config/nvim/lua/plugins/treesitter.lua`

## JIT Index Hints
```bash
rg --files -g 'stow/nvim/.config/nvim/lua/plugins/*.lua'
rg 'vim.keymap.set' stow/nvim/.config/nvim/lua
rg 'servers' stow/nvim/.config/nvim/lua/plugins/lsp-config.lua
```

## Common Gotchas
- Neovim must be >= 0.11.0
- Missing `{ desc = "..." }` hides keymaps in which-key
- Mason installs LSP servers; ensure Node.js LTS is installed

## Pre-PR Checks
```bash
(cd stow/nvim/.config/nvim && nvim --headless -c "luafile init.lua" -c "qa") 2>&1 | rg -i "error"
```
