# AGENTS.md - Dotfiles Repository

## Scope and Intent
This repository manages personal macOS dotfiles and setup automation.
It includes shell bootstrap scripts, Neovim Lua config, MCP templates, and Docker-based validation.
This file is the top-level guide for coding agents working in `/Users/frshbb/github/dotfiles`.

## Rule File Discovery (Cursor/Copilot)
Checked locations:
- `.cursor/rules/`
- `.cursorrules`
- `.github/copilot-instructions.md`

Current status:
- No Cursor rule files found.
- No Copilot instruction file found.

Agent behavior:
- If any of these files are added later, treat them as high-priority local instructions.
- Keep this AGENTS.md in sync with those rule files.

## Repository Layout
- `shell_setup.sh` - main shell/dev environment install + backup script
- `mcp_setup.sh` - MCP config install + backup script
- `nvim/` - Neovim config (lazy.nvim + Lua plugins)
- `mcp/` - MCP template configs (`*.example`) and docs
- `test/` - Docker test harness + shell test runner
- `tmux/`, `ghostty/`, `.zsh*`, `.gitconfig` - user config files
- `old/`, `karabiner/` - archived or legacy areas (avoid unless explicitly requested)

Subdirectory guides:
- `nvim/AGENTS.md`
- `mcp/AGENTS.md`
- `test/AGENTS.md`

## Build, Lint, and Test Commands

### Fast Preflight (recommended before PR)
```bash
bash -n shell_setup.sh
bash -n mcp_setup.sh
bash -n test/run_tests.sh
(cd nvim && nvim --headless -c "luafile init.lua" -c "qa") 2>&1 | rg -i "error"
```

### Full Test Suite (closest to CI behavior)
```bash
# local CI-like sequence
bash -n shell_setup.sh && bash -n mcp_setup.sh && docker build -t dotfiles-test -f test/Dockerfile . && docker run --rm dotfiles-test

# test script only
bash test/run_tests.sh
```

### Run a Single Test/Check (important)
`test/run_tests.sh` is sequential and not parameterized. For one check, run the equivalent command directly:

```bash
# TEST 1 equivalent: shell syntax
bash -n shell_setup.sh

# MCP script syntax gate
bash -n mcp_setup.sh

# TEST 2 equivalent: ensure no active SSH rewrite in .gitconfig
if grep -E '^\s*insteadOf\s*=' .gitconfig || grep -E '^\s*sshCommand\s*=' .gitconfig; then
  echo "FAIL: active SSH rewrite present"
  exit 1
fi

# nvim config loads without Lua errors
(cd nvim && nvim --headless -c "luafile init.lua" -c "qa") 2>&1 | rg -i "error"
```

To run a single check in the Docker test environment:
```bash
docker build -t dotfiles-test -f test/Dockerfile .
docker run --rm dotfiles-test bash -lc 'cd ~/dotfiles && bash -n shell_setup.sh'
```

## Code Style Guidelines

### General
- Keep changes minimal and scoped; do not refactor unrelated areas.
- Match existing file style before introducing new patterns.
- Prefer explicit, readable code over clever shortcuts.
- Do not introduce secrets in tracked files.

### Bash Style (`shell_setup.sh`, `mcp_setup.sh`, `test/*.sh`)
- Shebang: `#!/bin/bash` at line 1.
- Strict mode: keep `set -e` near top-level.
- Constants: uppercase (`DOTFILES_DIR`, `MCP_DIR`).
- Locals: lowercase (`src`, `dest`).
- Quote variable expansions: `"$VAR"`.
- Use `command -v` for tool checks.
- Keep helper functions (`info`, `warn`, `error`) consistent.
- Preserve color constants: `RED`, `GREEN`, `YELLOW`, `NC`.
- Use early failure (`exit 1`) for critical checks.
- For optional installs, warn and continue rather than hard-fail.

### Lua Style (`nvim/**/*.lua`)
- Indentation: 2 spaces, no tabs.
- Prefer double quotes for strings in new code.
- Keep one plugin spec per file under `nvim/lua/plugins/`.
- Keymaps should include `desc` for which-key discoverability.
- Use local imports: `local mod = require("mod")`.
- Keep plugin setup in `config = function()` or `opts = {}` patterns.
- Use trailing commas in multiline tables.
- Preserve existing lazy-loading triggers (`event`, `cmd`, `keys`, `ft`).
- Optional: use EmmyLua type annotations where useful (for complex opts tables).

### JSON / TOML / YAML / Markdown
- JSON: 2-space indent, double-quoted keys/values, no comments.
- TOML: use native TOML structures (`[[mcpServers]]`), not JSON-like arrays.
- YAML: keep key ordering logical and avoid noisy reformatting.
- Markdown: concise sections, runnable code blocks, avoid stale examples.

## Naming and File Conventions
- Shell scripts: `snake_case.sh`.
- Neovim plugin files: kebab-case or existing repo convention (`nvim/lua/plugins/*.lua`).
- Templates with placeholders: `.example` suffix.
- Backup filenames: `.backup.YYYYMMDDhhmmss`.
- Keep user/runtime files out of git unless explicitly intended.

## Error Handling and Safety
- Bash: fail fast for critical operations, warn for optional operations.
- Validate paths and command availability before destructive actions.
- Prefer idempotent setup logic (safe to rerun).
- In Lua, avoid crashing startup for optional integrations; guard risky calls when needed.

## Security and Secrets
- Never commit API keys/tokens or real local credentials.
- Real MCP configs (`mcp/*.json`, `mcp/*.toml`) are local; keep templates in `mcp/*.example`.
- Preserve placeholders like `YOUR_*` in examples.
- Treat `~/.zshenv` as sensitive content.

## Change Management Expectations
- Update `README.md` when user-facing commands/keymaps/setup behavior changes.
- Update `CHANGELOG.md` for notable features or workflow changes.
- Do not commit unless explicitly asked.
- Do not revert unrelated local changes you did not author.

## Known Gotchas
- Docker tests run on Ubuntu; macOS-only assumptions can break CI parity.
- Oh My Zsh install must remain unattended in automated contexts.
- Legacy references to `cursor_setup.sh` may appear in older test/workflow paths; verify current intended script before changing CI logic.

## Agent Checklist Before Hand-off
1. Syntax-check modified shell scripts with `bash -n`.
2. Run targeted validation for touched area (nvim/mcp/test).
3. Confirm no secrets or real credentials are staged.
4. Update docs/changelog when behavior changes.
5. Report exactly what was changed and where.

## Quick Search Commands
```bash
rg '^[a-z_]+\(\)' shell_setup.sh mcp_setup.sh
rg 'vim.keymap.set|desc\s*=\s*"' nvim/lua
rg 'mcpServers|YOUR_' mcp/*.example
rg '\[TEST|\[PASS|\[FAIL' test/run_tests.sh
```
