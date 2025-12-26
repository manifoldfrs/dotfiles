# nvim/AGENTS.md

> Neovim configuration guidance for AI agents.

## Package Identity

- **Purpose**: Modern Neovim config with LSP, Telescope, Treesitter
- **Plugin Manager**: lazy.nvim (auto-bootstrapped)
- **Leader Key**: `Space`

## Setup & Run

```bash
# Install (via shell_setup.sh)
./shell_setup.sh install  # Copies nvim/ → ~/.config/nvim/

# Manual copy
cp -r nvim/ ~/.config/nvim/

# Launch and install plugins
nvim  # lazy.nvim auto-installs on first launch

# Health check
nvim +checkhealth
```

## File Structure

```
nvim/
├── init.lua                 # Entry point (loads user modules)
└── lua/user/
    ├── options.lua          # Vim options (line numbers, tabs, etc.)
    ├── keymaps.lua          # Custom keybindings
    ├── lazy.lua             # lazy.nvim bootstrap + plugin loader
    └── plugins/
        ├── colorscheme.lua  # Nord theme
        ├── ui.lua           # Lualine, bufferline, nvim-tree
        ├── editor.lua       # Telescope, toggleterm, autopairs
        ├── cmp.lua          # Completion (nvim-cmp)
        ├── lsp.lua          # LSP config + Mason + formatters
        ├── treesitter.lua   # Syntax highlighting
        └── git.lua          # Fugitive, gitsigns
```

## Patterns & Conventions

### Adding a New Plugin
```lua
-- In nvim/lua/user/plugins/<category>.lua
return {
  {
    "author/plugin-name",
    event = "VeryLazy",  -- or "BufReadPre", "InsertEnter", etc.
    dependencies = { "required/dep" },
    config = function()
      require("plugin-name").setup({
        -- options
      })
    end,
  },
}
```

**DO:**
- Copy pattern from `nvim/lua/user/plugins/editor.lua` (Telescope setup)
- Use lazy loading (`event`, `cmd`, `ft`, `keys`)
- Group related plugins in same file

**DON'T:**
- Add plugins directly to `init.lua`
- Use Packer syntax (this config uses lazy.nvim)

### Adding a Keymap
```lua
-- In nvim/lua/user/keymaps.lua
vim.keymap.set("n", "<leader>xx", "<cmd>SomeCommand<CR>", { desc = "Description" })
```

### LSP Configuration
- Mason manages LSP server installation: `nvim/lua/user/plugins/lsp.lua`
- Add servers to `ensure_installed` table
- Formatters configured via conform.nvim (not null-ls)

## Key Files Reference

| Purpose | File |
|---------|------|
| All keymaps | `lua/user/keymaps.lua` |
| Vim options | `lua/user/options.lua` |
| Telescope setup | `lua/user/plugins/editor.lua` |
| LSP/Mason | `lua/user/plugins/lsp.lua` |
| Completion | `lua/user/plugins/cmp.lua` |
| Git integration | `lua/user/plugins/git.lua` |

## JIT Index Hints

```bash
# Find all keymaps
grep -n "vim.keymap.set" nvim/lua/user/*.lua

# Find plugin configs
grep -n "require.*setup" nvim/lua/user/plugins/*.lua

# Find LSP servers
grep -n "ensure_installed" nvim/lua/user/plugins/lsp.lua

# Check lazy.nvim plugin spec
grep -rn "return {" nvim/lua/user/plugins/
```

## Common Gotchas

- **Leader key is Space** - Don't use `<leader>` before `vim.g.mapleader` is set
- **Requires Neovim >= 0.10.0** - For treesitter and lazy.nvim compatibility
- **Nerd Font required** - Icons won't display without JetBrainsMono Nerd Font
- **Mason needs Node.js** - Run `nvm install --lts` first for LSP servers

## Pre-Commit Check

```bash
# Validate Lua syntax
nvim --headless -c "lua print('syntax ok')" -c "q" nvim/init.lua
```
