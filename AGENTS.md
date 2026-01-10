# AGENTS.md - Dotfiles Repository

## Project Snapshot
Personal macOS dotfiles repository (single project, not monorepo).
Primary tech: Bash/Zsh scripts, Lua (Neovim), JSON/TOML/YAML configs, Docker tests.
Sub-areas with their own AGENTS.md: `nvim/`, `mcp/`, `test/`, `karabiner/`.

## Root Setup Commands
```bash
./shell_setup.sh install
./shell_setup.sh backup
./mcp_setup.sh install
./mcp_setup.sh backup
bash -n shell_setup.sh && bash -n mcp_setup.sh
docker build -t dotfiles-test -f test/Dockerfile . && docker run --rm dotfiles-test
```

## Universal Conventions
- Bash: `#!/bin/bash` + `set -e`, helpers before main logic
- Use `command -v` checks and quote variables (`"$VAR"`)
- Lua: 2-space indent, double quotes, one plugin per file in `nvim/lua/plugins/`
- Keymaps must include `{ desc = "..." }`
- Secret templates use `.example` suffix
- Commits: descriptive messages, never commit without explicit user permission

## Security & Secrets
- Never commit API keys or tokens
- Real configs live in `mcp/*.json` and `mcp/*.toml` (gitignored)
- Secrets stored in `~/.zshenv` or `.example` placeholders
- CI blocks SSH URL rewrites in `.gitconfig`

## JIT Index (what to open, not what to paste)

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
rg '^[a-z_]+\\(\\)' shell_setup.sh mcp_setup.sh
rg 'vim.keymap.set' nvim/lua
rg 'mcpServers' mcp/*.json.example
rg '"description"' karabiner/karabiner.json
rg '\\[TEST|\\[PASS|\\[FAIL' test/run_tests.sh
```

## Definition of Done
1. `bash -n` passes for modified scripts
2. Docker tests pass
3. No secrets or real configs staged
4. `CHANGELOG.md` updated for new features
