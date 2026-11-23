# AGENTS.md - MCP Configurations

## Package Identity
MCP setup and configuration guidance for Claude Code and Codex.
Document server changes in `mcp/README.md` and keep machine-local config copies untracked.

## Touch Points / Key Files
- Setup docs: `mcp/README.md`
- Canonical server list: `mcp/shared/servers.json`
- Shared Jev logic: `mcp/shared/jev.ts` (synced to `stow/claude/.claude/mods/jev-checks/hooks/jev-shared.ts`)
- Claude Code import: `mcp_setup.sh install-claude`
- Codex config template: `stow/codex/.codex/config.toml`

## Common Gotchas
- Apply desired MCP changes from the template to existing local Codex configs and restart Codex.
- `install-claude` imports shared definitions (`mcp/shared/servers.json`) into user-scoped Claude registrations, skips identical entries, and refuses conflicting entries.
- Restart Claude Code after importing MCP definitions.
- `mcp/shared/servers.json` owns shared server registrations and `mcp/shared/jev.ts` owns the active shared Jev logic; the Codex package owns its pinned `jev` and `xai-search` registrations. For shared changes, run `./scripts/harness_sync.sh` to regenerate Codex's shared servers and Claude Code's `jev-shared.ts` copy, and run `./mcp_setup.sh install-claude` for Claude Code MCP servers.

## Pre-PR Checks
```bash
./scripts/harness_sync.sh --check
bash test/claude_mcp_setup_test.sh
```
