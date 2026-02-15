# AGENTS.md - Neovim Configuration

## Package Identity
Neovim config using lazy.nvim with Nord.
Requires Neovim >= 0.11.0 for `vim.lsp.config()`.

## Setup & Run
```bash
./shell_setup.sh install
cp -r nvim/ ~/.config/nvim/
nvim
:Lazy sync
:Mason
:LspInfo
```

## Patterns & Conventions

### File Organization
```
nvim/
├── init.lua
└── lua/
    ├── vim-options.lua
    └── plugins/
        ├── telescope.lua
        ├── lsp-config.lua
        └── ...
```

### Examples
- ✅ DO: Add plugin specs like `nvim/lua/plugins/telescope.lua`
- ✅ DO: Keep base options in `nvim/lua/vim-options.lua`
- ✅ DO: LSP servers + keymaps in `nvim/lua/plugins/lsp-config.lua`
- ✅ DO: Keymaps with `{ desc = "..." }` (see `nvim/lua/plugins/telescope.lua`)
- ✅ DO: Keep leader namespaces consistent: `<leader>g` Git, `<leader>s` Search, `<leader>t` Test, `<leader>d` Debug, `<leader>o` opencode, `<leader>u` Toggle
- ❌ DON'T: Use legacy Vimscript from `old/iterm2/nvim/init.vim`
- ❌ DON'T: Put multiple unrelated plugins in one file (use `nvim/lua/plugins/*.lua`)
- ❌ DON'T: Omit keymap descriptions (reference `nvim/lua/plugins/telescope.lua`)

## Touch Points / Key Files
- Entry point: `nvim/init.lua`
- Options + leader: `nvim/lua/vim-options.lua`
- LSP config: `nvim/lua/plugins/lsp-config.lua`
- Telescope: `nvim/lua/plugins/telescope.lua`
- Treesitter: `nvim/lua/plugins/treesitter.lua`
- Debugging: `nvim/lua/plugins/debugging.lua`

## JIT Index Hints
```bash
rg --files -g 'nvim/lua/plugins/*.lua'
rg 'vim.keymap.set' nvim/lua
rg 'servers' nvim/lua/plugins/lsp-config.lua
rg 'dap' nvim/lua/plugins/debugging.lua
```

## Common Gotchas
- Neovim must be >= 0.11.0
- Missing `{ desc = "..." }` hides keymaps in which-key
- Mason installs LSP servers; ensure Node.js LTS is installed

## Pre-PR Checks
```bash
nvim --headless -c "luafile init.lua" -c "qa" 2>&1 | rg -i "error"
```
