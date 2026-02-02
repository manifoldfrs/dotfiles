# AGENTS.md - Dotfiles Repository

## Project Snapshot
Personal macOS dotfiles repository (single project, not monorepo).
Primary tech: Bash/Zsh scripts, Lua (Neovim), JSON/TOML/YAML configs, Docker tests.
Sub-areas with their own AGENTS.md: `nvim/`, `mcp/`, `test/`, `karabiner/`.

## Build/Lint/Test Commands

### All Tests
```bash
# Full test suite (syntax + Docker)
bash -n shell_setup.sh && bash -n mcp_setup.sh && docker build -t dotfiles-test -f test/Dockerfile . && docker run --rm dotfiles-test

# CI equivalent
bash test/run_tests.sh
```

### Single Test
```bash
# Run specific test by editing test/run_tests.sh temporarily:
# Comment out unwanted tests, keep [TEST N] you want
bash test/run_tests.sh

# Or run specific checks directly:
bash -n shell_setup.sh                    # Test 1: Syntax check
rg 'insteadOf\s*=' .gitconfig             # Test 2: SSH rewrite check
```

### Linting
```bash
# Bash syntax validation
bash -n shell_setup.sh
bash -n mcp_setup.sh
bash -n test/run_tests.sh

# JSON validation
python -m json.tool karabiner/karabiner.json > /dev/null

# Lua syntax (via nvim)
nvim --headless -c "luafile init.lua" -c "qa" 2>&1 | rg -i "error"
```

## Root Setup Commands
```bash
./shell_setup.sh install
./shell_setup.sh backup
./mcp_setup.sh install
./mcp_setup.sh backup
```

## Code Style Guidelines

### Bash Scripts
- **Shebang**: `#!/bin/bash` at line 1
- **Strict mode**: `set -e` immediately after shebang
- **Variable naming**: `UPPERCASE` for constants, `lowercase` for locals
- **Quote variables**: Always use `"$VAR"` (see `shell_setup.sh:35`)
- **Command checks**: Use `command -v` not `which` (see `shell_setup.sh:76`)
- **Function order**: Helpers before main logic, `usage()` last
- **Error handling**: `error()` function exits 1 with red prefix
- **Colors**: Use `RED`, `GREEN`, `YELLOW`, `NC` constants
- **Logging**: `info()`, `warn()`, `error()` helper functions

**Example pattern from shell_setup.sh:**
```bash
info() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }
```

### Lua (Neovim)
- **Indent**: 2 spaces (no tabs)
- **Quotes**: Double quotes for strings
- **Function calls**: No space between function name and `(`
- **Trailing commas**: Required in tables
- **Plugin files**: One plugin per file in `nvim/lua/plugins/`
- **Keymaps**: Must include `{ desc = "..." }` for which-key
- **Requires**: Local variables for requires (see `telescope.lua:15`)

**Example from telescope.lua:**
```lua
local telescope = require("telescope")
telescope.setup({ defaults = { ... } })
vim.keymap.set("n", "<leader>ff", builtin.find_files, { desc = "Find files" })
```

### JSON/TOML/YAML
- **Indent**: 2 spaces
- **Quotes**: Double quotes for JSON keys and string values
- **TOML arrays**: Use `[[mcpServers]]` format, not JSON-style
- **Comments**: JSON = none (or use .example templates), TOML = use `#`

### File Naming
- **Shell scripts**: `snake_case.sh` with `.sh` extension
- **Lua modules**: `kebab-case.lua` for plugin configs
- **Config files**: Use symlinks (`.symlink` suffix) or direct names
- **Templates**: `.example` suffix for files with placeholders
- **Backups**: `.backup.YYYYMMDDhhmmss` format

## Universal Conventions

### Security & Secrets
- **Never commit**: API keys, tokens, real configs
- **Real configs**: Live in `mcp/*.json` and `mcp/*.toml` (gitignored)
- **Templates**: Use `.example` suffix with `YOUR_*` placeholders
- **Secrets storage**: `~/.zshenv` for shell, `.example` for templates
- **CI check**: Blocks SSH URL rewrites in `.gitconfig`

### Git Workflow
- **Commits**: Descriptive messages, never commit without explicit user permission
- **CI**: Runs on push/PR to master via `.github/workflows/test.yml`
- **Definition of Done**:
  1. `bash -n` passes for modified scripts
  2. Docker tests pass
  3. No secrets or real configs staged
  4. `CHANGELOG.md` updated for new features

## JIT Index

### Directory Map
- Neovim config: `nvim/` → [nvim/AGENTS.md](nvim/AGENTS.md)
- MCP configs: `mcp/` → [mcp/AGENTS.md](mcp/AGENTS.md)
- Tests/CI: `test/` → [test/AGENTS.md](test/AGENTS.md)
- Karabiner mappings: `karabiner/` → [karabiner/AGENTS.md](karabiner/AGENTS.md)
- Tmux config: `tmux/tmux.conf`
- Ghostty config: `ghostty/config`
- OpenCode config: `opencode/opencode.jsonc`
- Archive (avoid): `old/`

### Quick Find Commands
```bash
rg '^[a-z_]+\(\)' shell_setup.sh mcp_setup.sh
rg 'vim.keymap.set' nvim/lua
rg 'mcpServers' mcp/*.json.example
rg '"description"' karabiner/karabiner.json
rg '\[TEST|\[PASS|\[FAIL' test/run_tests.sh
```

### Key File Patterns
```bash
# Find all plugin configs
rg --files -g 'nvim/lua/plugins/*.lua'

# Find all keymaps with descriptions
rg 'desc = "' nvim/lua

# Check for unquoted variables
rg -v '^\s*#' shell_setup.sh | rg '\$[A-Z]' | head -20
```

## Common Gotchas

- Docker tests run on Ubuntu; macOS-only assumptions can fail
- Oh My Zsh install must stay `--unattended` to avoid hanging tests
- `~/.zshenv` may contain real secrets; never copy actual content to repo
- JSON in Karabiner must be valid or Karabiner ignores changes entirely
- Neovim requires >= 0.11.0 for mason-lspconfig v2 compatibility
