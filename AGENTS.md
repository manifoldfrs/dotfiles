# AGENTS.md - Dotfiles Repository

## Scope and Intent
This repository manages personal macOS dotfiles and setup automation.
It includes shell bootstrap scripts, Neovim Lua config, MCP configuration, and Docker-based validation.
This file is the top-level guide for coding agents working in `/Users/frshbb/code/personal/dotfiles`.
Read `CONTEXT.md` when work changes the tracked-to-live configuration lifecycle, skill ownership, or cross-harness agent setup.

## Working in this repository

- See the [repository layout](README.md#repository-layout) and [agent harness guide](docs/agents.md) for ownership and entry points.
- Follow the scoped instructions in [Neovim](stow/nvim/AGENTS.md), [MCP](mcp/AGENTS.md), and [tests](test/AGENTS.md). Root safety and approval rules apply throughout.
- Treat `old/` as an archive. Work there only when explicitly requested.

## Build, Lint, and Test Commands

- Run `./scripts/validate-dotfiles.sh` for isolated preflight.
- Run `bash test/run_tests.sh` for the shell suite. See [Validation](README.md#validation) for the Ubuntu Docker sequence and per-area checks.
- Run `bash -n` once per modified Bash file. For a single test, use its equivalent command from the [test guide](test/AGENTS.md).

## Code Style Guidelines

### General
- Keep changes minimal and scoped; do not refactor unrelated areas.
- Match existing file style before introducing new patterns.
- Prefer explicit, readable code over clever shortcuts.
- Do not introduce secrets in tracked files.
- When writing commit messages, never add your agent name as a co-author.
- Never manually modify `CHANGELOG.md` files or files marked as auto-generated.
- When writing or substantially editing long Markdown files, put each full sentence on its own physical line.
- Preserve normal Markdown structure, but avoid wrapping multiple sentences onto one physical line.
- When making technical decisions, prioritize quality, simplicity, robustness, scalability, and long-term maintainability over development cost.
- When doing bug fixes, start by reproducing the bug in an end-to-end setting that is as close as practical to how an end user experiences it.
- When end-to-end testing a product, be picky about the UI and call out anything that clearly looks wrong, even when it is not directly related to the current task.
- Apply the same standard to engineering excellence: lint failures, test failures, and test flakiness should be fixed when you encounter them, even when they were not caused by your current change.

### Bash Style (`scripts/*.sh`, `mcp_setup.sh`, `test/*.sh`)
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

### Interactive Bash Style (`stow/bash/`)
- Target Homebrew Bash 5 while keeping ordinary shell functions readable and portable where practical.
- Keep environment setup in `.config/bash/environment.bash`, aliases in `aliases.bash`, and functions in `functions.bash`.
- Keep interactive-only initialization after the `.bashrc` interactive-shell guard.
- Validate every tracked Bash file with `bash -n`.

### Lua Style (`stow/nvim/.config/nvim/**/*.lua`)
- Indentation: 2 spaces, no tabs.
- Prefer double quotes for strings in new code.
- Keep one plugin spec per file under `stow/nvim/.config/nvim/lua/plugins/`.
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
- Neovim plugin files: kebab-case or existing repo convention (`stow/nvim/.config/nvim/lua/plugins/*.lua`).
- Templates with placeholders: `.example` suffix.
- Backup filenames: `.backup.YYYYMMDDhhmmss`.
- Keep user/runtime files out of git unless explicitly intended.

## Error Handling and Safety
- Bash: fail fast for critical operations, warn for optional operations.
- Validate paths and command availability before destructive actions.
- Prefer idempotent setup logic (safe to rerun).
- In Lua, avoid crashing startup for optional integrations; guard risky calls when needed.

### Live Configuration Approval Gate
- Treat the live home directory and running terminal applications as production infrastructure.
- Editing tracked sources does not authorize applying them to the live configuration.
- Do not run `scripts/stow.sh apply`, `scripts/bootstrap.sh`, package installation or removal, shell changes, service reloads, or edits to live config under `$HOME` unless the user explicitly asks for that live change.
- A direct request such as "install X" or "apply the config" is that approval; do not ask again.
- Work confined to `$TMPDIR`, throwaway copies, or temporary home directories is not a live mutation and needs no approval.
- Use `scripts/stow.sh dry-run`, `scripts/validate-dotfiles.sh`, and temporary home directories for validation before applying.
- Never run `chsh` or modify `/etc/shells` for the user.
- When applying, run the smallest live mutation necessary and immediately verify the affected public behavior.

## Security and Secrets
- Never commit API keys/tokens or real local credentials.
- Keep machine-local MCP configs (`mcp/*.json`, `mcp/*.toml`) untracked.
- Preserve placeholders like `YOUR_*` in examples.
- Treat `~/.config/bash/local.bash` as sensitive, machine-local content.

## Change Management Expectations
- Update `README.md` and the relevant `docs/` guide when user-facing commands/keymaps/setup behavior changes.
- For notable features or workflow changes, follow the project changelog process without manually editing generated changelog files.
- Do not commit unless explicitly asked.
- Do not revert unrelated local changes you did not author.

## Known Gotchas
- Docker tests run on Ubuntu; macOS-only assumptions can break CI parity.
- Fish is the interactive shell; Bash remains the login entry point and runs scripts and agent commands. Archived shell configs under `old/` are rollback-only.
- Legacy references to `cursor_setup.sh` may appear in older test/workflow paths; verify current intended script before changing CI logic.

## Agent Checklist Before Hand-off
1. Syntax-check modified shell scripts with `bash -n`.
2. Run targeted validation for touched area (nvim/mcp/test).
3. Confirm no secrets or real credentials are staged.
4. Update docs/changelog when behavior changes.
5. Report exactly what was changed and where.
