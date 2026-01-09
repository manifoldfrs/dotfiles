# AGENTS.md - Dotfiles Repository

## Project Snapshot

Personal **macOS dotfiles** repository. Single project (not a monorepo).
Tech: Bash scripts, Lua (Neovim), Zsh, config files (JSON/TOML/YAML).
Sub-configs: `nvim/`, `test/`, and `mcp/` have their own AGENTS.md files.

## Root Commands

```bash
# Install everything on a new Mac
./shell_setup.sh install

# Backup current system configs to this repo
./shell_setup.sh backup

# MCP (AI assistant) configs
./mcp_setup.sh install    # Install to system
./mcp_setup.sh backup     # Backup from system

# Validate all scripts
bash -n shell_setup.sh && bash -n mcp_setup.sh

# Run full test suite (Docker)
docker build -t dotfiles-test -f test/Dockerfile . && docker run --rm dotfiles-test
```

## Universal Conventions

### Bash Scripts
- Always start with `#!/bin/bash` and `set -e`
- Define colors + helpers before main logic (see `shell_setup.sh:10-18`)
- Use `command -v` to check program existence
- Quote all variables: `"$VAR"` not `$VAR`
- End with case statement for subcommands

### Lua (Neovim)
- 2-space indentation, double quotes
- One plugin per file in `nvim/lua/plugins/`
- Keymaps must include `{ desc = "..." }` for which-key

### Config Files
- Use `.example` suffix for templates with API key placeholders
- Never commit real secrets

### Commits
- **NEVER commit without explicit user permission** - always ask first
- No enforced format, but prefer descriptive messages
- Run `bash -n <script>.sh` before committing shell changes

## Security & Secrets

- **Never commit API keys** - use `.example` files with placeholders
- Secrets go in: `mcp/*.json` (gitignored), `~/.zshenv` (not committed)
- CI checks for SSH URL rewrites in `.gitconfig`

## JIT Index

### Directory Map
| Path | Purpose | Details |
|------|---------|---------|
| `nvim/` | Neovim config (lazy.nvim) | [nvim/AGENTS.md](nvim/AGENTS.md) |
| `test/` | Docker tests, CI | [test/AGENTS.md](test/AGENTS.md) |
| `mcp/` | AI tool configs (MCP servers) | [mcp/AGENTS.md](mcp/AGENTS.md) |
| `karabiner/` | Keyboard remapping | Complex JSON, see `karabiner/karabiner.json` |
| `tmux/tmux.conf` | tmux config | Single file, Catppuccin Mocha theme |
| `ghostty/config` | Terminal config | Single file, Catppuccin Mocha theme |
| `opencode/` | OpenCode AI config | Catppuccin theme, MCP servers |
| `bin/` | Custom scripts | `tmux-sessionizer` (C-a f) |
| `old/` | Archived configs | **Do not reference** |

### Quick Find Commands
```bash
# Find a Neovim plugin config
rg -l "return {" nvim/lua/plugins/

# Find a keymap
rg "vim.keymap.set" nvim/lua/

# Find a shell function
rg "^[a-z_]+\(\)" shell_setup.sh mcp_setup.sh

# Find Homebrew packages
rg "brew" Brewfile

# Check what CI tests
cat .github/workflows/test.yml

# Find all test assertions
rg "\[TEST|\[PASS|\[FAIL" test/run_tests.sh

# Find MCP servers configured
rg "mcpServers" mcp/*.json.example
```

### Key Files (Good Examples)
| Purpose | File |
|---------|------|
| Bash script pattern | `shell_setup.sh` |
| Lua plugin pattern | `nvim/lua/plugins/telescope.lua` |
| LSP with keymaps | `nvim/lua/plugins/lsp-config.lua` |
| Debugging (DAP) | `nvim/lua/plugins/debugging.lua` |
| Vim options | `nvim/lua/vim-options.lua` |
| tmux config | `tmux/tmux.conf` |
| Test pattern | `test/run_tests.sh` |
| MCP setup | `mcp/README.md` |
| Change history | `CHANGELOG.md` |

## Common Workflows

### Adding a New Homebrew Package
```bash
# 1. Add to Brewfile manually, OR:
brew install <package>
./shell_setup.sh backup  # Updates Brewfile
git diff Brewfile        # Review changes
```

### Adding a New Neovim Plugin
```bash
# 1. Create lua/plugins/<plugin-name>.lua
# 2. Follow pattern from telescope.lua
# 3. Open nvim, run :Lazy to install
# See nvim/AGENTS.md for details
```

### Setting up MCP Servers
```bash
# 1. Copy example files
cd mcp/
cp claude_desktop_config.json.example claude_desktop_config.json

# 2. Add API keys (NEVER commit these)
# 3. Install configs
../mcp_setup.sh install

# See mcp/AGENTS.md for details
```

## Definition of Done

Before creating a PR:
1. `bash -n *.sh` passes for any modified scripts
2. No secrets/API keys in committed files
3. Docker test passes: `docker build -t dotfiles-test -f test/Dockerfile .`
4. Update CHANGELOG.md if adding features

## Version Requirements

| Tool | Minimum | Reason |
|------|---------|--------|
| Neovim | >= 0.11.0 | `vim.lsp.config()` API |
| Git | >= 2.19.0 | lazy.nvim partial clones |
| Node.js | LTS | Mason LSP servers |
| tree-sitter-cli | >= 0.26.1 | nvim-treesitter main branch |
