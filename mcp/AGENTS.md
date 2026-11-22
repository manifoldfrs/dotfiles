# AGENTS.md - MCP Configurations

## Package Identity
MCP setup and configuration guidance for Pi, Claude Code, Codex, and OpenCode.
Document server changes in `mcp/README.md` and keep machine-local config copies untracked.

## Touch Points / Key Files
- Setup docs: `mcp/README.md`
- Canonical server list: `stow/pi/.pi/agent/mcp.json`
- Claude Code import: `mcp_setup.sh install-claude`
- Stow-managed Codex config: `stow/codex/.codex/config.toml`

## Common Gotchas
- Restart Codex after `./scripts/harness_sync.sh` and `./scripts/stow.sh apply`
- `install-claude` imports Pi's definitions (`stow/pi/.pi/agent/mcp.json`) into user-scoped Claude registrations, skips identical entries, and refuses conflicting entries.
- Restart Claude Code after importing MCP definitions.
- Pi's `stow/pi/.pi/agent/mcp.json` owns shared server registrations. Codex's direct `xai-search` server is configured in the Codex package. For shared changes, run `./scripts/harness_sync.sh` to regenerate OpenCode's and Codex's servers, and `./mcp_setup.sh install-claude` for Claude Code.
- Run `/reload` or restart Pi after Stowing `stow/pi/.pi/agent/mcp.json`

## Pre-PR Checks
```bash
./scripts/harness_sync.sh --check
bash test/claude_mcp_setup_test.sh
```
