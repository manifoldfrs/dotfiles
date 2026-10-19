# AGENTS.md - MCP Configurations

## Package Identity
MCP configuration templates for Codex plus tracked MCP guidance for Codex, Pi, and OpenCode.
Templates stored as `.example` files with placeholders.

## Setup & Run
```bash
cp codex_config.toml.example codex_config.toml
../mcp_setup.sh install
../mcp_setup.sh backup
```

## Patterns & Conventions

### File Organization
```
mcp/
├── README.md
└── codex_config.toml.example
```

### Examples
- ✅ DO: Use `[[mcpServers]]` blocks in `mcp/codex_config.toml.example`
- ✅ DO: Keep placeholders like `YOUR_REF_API_KEY` in `.example` templates
- ✅ DO: Document server changes in `mcp/README.md`
- ❌ DON'T: Copy archived setup logic from `old/install.sh`

## Touch Points / Key Files
- Setup docs: `mcp/README.md`
- Install script: `mcp_setup.sh`
- Codex template: `mcp/codex_config.toml.example`

## JIT Index Hints
```bash
rg 'mcpServers' mcp/*.toml.example
rg 'YOUR_' mcp/*.example
rg 'command' mcp/*.example
```

## Common Gotchas
- Restart Codex after `./mcp_setup.sh install`
- Run `/reload` or restart Pi after Stowing `stow/pi/.pi/agent/mcp.json`
- TOML syntax is strict; keep `command` arrays
- Templates must keep `.example` suffix to avoid commits

## Pre-PR Checks
```bash
rg 'YOUR_' mcp/*.example
```
