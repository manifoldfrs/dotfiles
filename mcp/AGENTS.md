# AGENTS.md - MCP Configurations

## Package Identity
MCP server configs for Claude Desktop and Codex.
Templates stored as `.example` files with placeholders.

## Setup & Run
```bash
cp claude_desktop_config.json.example claude_desktop_config.json
cp codex_config.toml.example codex_config.toml
../mcp_setup.sh install
../mcp_setup.sh backup
```

## Patterns & Conventions

### File Organization
```
mcp/
├── README.md
├── claude_desktop_config.json.example
└── codex_config.toml.example
```

### Examples
- ✅ DO: Add servers under `mcpServers` in `mcp/claude_desktop_config.json.example`
- ✅ DO: Use `[[mcpServers]]` blocks in `mcp/codex_config.toml.example`
- ✅ DO: Keep placeholders like `YOUR_REF_API_KEY` in `.example` templates
- ✅ DO: Document server changes in `mcp/README.md`
- ❌ DON'T: Copy archived setup logic from `old/install.sh`

## Touch Points / Key Files
- Setup docs: `mcp/README.md`
- Install script: `mcp_setup.sh`
- Claude template: `mcp/claude_desktop_config.json.example`
- Codex template: `mcp/codex_config.toml.example`

## JIT Index Hints
```bash
rg 'mcpServers' mcp/*.json.example
rg 'YOUR_' mcp/*.example
rg 'command' mcp/*.example
```

## Common Gotchas
- Restart Claude Desktop/Codex after `./mcp_setup.sh install`
- TOML syntax is strict; keep `command` arrays
- Templates must keep `.example` suffix to avoid commits

## Pre-PR Checks
```bash
rg 'YOUR_' mcp/*.example
```
