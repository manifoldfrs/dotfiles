# AGENTS.md - Neovim Configuration

## Package Identity

Neovim configuration using **lazy.nvim** plugin manager with **Nord** theme.
Requires Neovim >= 0.11.0 for `vim.lsp.config()` API.

## Setup & Run

```bash
# Install Neovim config (from repo root)
./shell_setup.sh install

# Or copy manually
cp -r nvim/ ~/.config/nvim/

# Launch and let lazy.nvim install plugins
nvim

# Check LSP status
:LspInfo

# Install/update LSP servers
:Mason
```

## Patterns & Conventions

### File Organization
```
nvim/
├── init.lua              # Entry point (loads lazy.nvim + plugins)
└── lua/
    ├── vim-options.lua   # Core settings, basic keymaps
    └── plugins/          # One file per plugin
        ├── lsp-config.lua
        ├── telescope.lua
        └── ...
```

### Plugin File Format
Every plugin file must return a table following lazy.nvim spec:

```lua
-- ✅ DO: Follow this pattern (see plugins/telescope.lua)
return {
  "author/plugin-name",
  dependencies = { "dep/name" },
  config = function()
    require("plugin").setup({
      option = "value",
    })
    
    -- Keymaps inside config function
    vim.keymap.set("n", "<leader>xx", function_ref, { desc = "Description" })
  end,
}
```

```lua
-- ❌ DON'T: Use old Vimscript patterns (see old/iterm2/nvim/)
-- ❌ DON'T: Forget desc in keymaps
-- ❌ DON'T: Put multiple plugins in one file (except related like mason + lspconfig)
```

### Keymaps
- **Always include `{ desc = "..." }`** for which-key integration
- Leader key is `<Space>` (set in `vim-options.lua:2`)
- Buffer-local keymaps use `{ buffer = args.buf }` (see `lsp-config.lua:73`)

```lua
-- ✅ DO: Include description
vim.keymap.set("n", "<leader>ff", builtin.find_files, { desc = "Find files" })

-- ❌ DON'T: Omit description
vim.keymap.set("n", "<leader>ff", builtin.find_files, {})
```

### Code Style
- **2-space indentation** (not tabs)
- **Double quotes** for strings
- **Comments** use `--`
- Group related options with comment headers (see `vim-options.lua`)

## Touch Points / Key Files

| Purpose | File | Line |
|---------|------|------|
| Entry point | `init.lua` | - |
| Core vim options | `lua/vim-options.lua` | All |
| Leader key | `lua/vim-options.lua` | 2 |
| LSP keymaps | `lua/plugins/lsp-config.lua` | 71-85 |
| LSP servers list | `lua/plugins/lsp-config.lua` | 28-34 |
| Telescope keymaps | `lua/plugins/telescope.lua` | 24-32 |
| Colorscheme | `lua/plugins/colorscheme.lua` | - |
| File explorer | `lua/plugins/neo-tree.lua` | - |
| Git integration | `lua/plugins/git.lua` | - |
| Debugging (DAP) | `lua/plugins/debugging.lua` | - |
| Debug keymaps | `lua/plugins/debugging.lua` | 91-103 |

## JIT Index Hints

```bash
# Find all plugins
ls lua/plugins/

# Find keymaps in a plugin
rg "vim.keymap.set" lua/plugins/telescope.lua

# Find all keymaps
rg "vim.keymap.set" lua/

# Find LSP-related code
rg -l "lsp" lua/

# Find where an option is set
rg "vim.opt\." lua/vim-options.lua

# Find a specific leader keymap
rg "<leader>f" lua/

# Find debugging config
rg "dap" lua/plugins/debugging.lua
```

## Debugging Keybindings (nvim-dap)

| Keys | Action |
|------|--------|
| `<leader>dc` | Continue / Start |
| `<leader>db` | Toggle breakpoint |
| `<leader>dB` | Conditional breakpoint |
| `<leader>di` | Step into |
| `<leader>do` | Step over |
| `<leader>dO` | Step out |
| `<leader>dr` | Toggle REPL |
| `<leader>dl` | Run last |
| `<leader>du` | Toggle DAP UI |
| `<leader>dx` | Terminate |
| `<leader>de` | Eval expression |

**Supported:** Go (delve), Python (debugpy). Auto-installed via Mason.

## Common Gotchas

1. **LSP not attaching?** Check Neovim version >= 0.11.0 (`:version`)
2. **Mason servers not installing?** Ensure Node.js is installed (`nvm install --lts`)
3. **Keymaps not showing in which-key?** Add `{ desc = "..." }` to keymap
4. **Plugin not loading?** Check lazy.nvim output (`:Lazy`)
5. **Debugging not working?** Run `:MasonInstall delve debugpy` and check `:checkhealth dap`

## Pre-PR Checks

```bash
# Validate Lua syntax (from nvim/ directory)
nvim --headless -c "luafile init.lua" -c "qa" 2>&1 | grep -i error

# Or just open nvim and check for errors
nvim
```

## Adding a New Plugin

1. Create `lua/plugins/<plugin-name>.lua`
2. Follow the lazy.nvim spec pattern from `telescope.lua`
3. Include keymaps with descriptions
4. Test: `nvim` then `:Lazy` to verify installation
