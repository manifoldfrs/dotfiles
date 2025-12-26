# mcp/AGENTS.md

> MCP (Model Context Protocol) configuration guidance for AI agents.

## Package Identity

- **Purpose**: MCP server configs for AI coding assistants (Claude, Cursor, Codex, Droid)
- **Security**: Contains API keys - actual configs are gitignored
- **Pattern**: `.example` files committed, real configs local-only

## Setup & Run

```bash
# 1. Copy example files
cd ~/dotfiles/mcp
cp claude_desktop_config.json.example claude_desktop_config.json
cp cursor_mcp.json.example cursor_mcp.json
cp codex_config.toml.example codex_config.toml
cp factory_mcp.json.example factory_mcp.json

# 2. Edit and add API keys (see placeholders in files)

# 3. Install to system locations
./mcp_setup.sh install

# 4. Restart AI applications
```

## File Structure

```
mcp/
├── README.md                            # Setup instructions
├── claude_desktop_config.json.example   # Claude Desktop template
├── cursor_mcp.json.example              # Cursor MCP template
├── codex_config.toml.example            # OpenAI Codex template
├── factory_mcp.json.example             # Droid/Factory template
├── claude_desktop_config.json           # (gitignored) actual config
├── cursor_mcp.json                      # (gitignored) actual config
├── codex_config.toml                    # (gitignored) actual config
└── factory_mcp.json                     # (gitignored) actual config
```

## Target Locations After Install

| Config | System Location |
|--------|-----------------|
| Claude Desktop | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Cursor | `~/.cursor/mcp.json` |
| Codex | `~/.codex/config.toml` |
| Droid/Factory | `~/.factory/mcp.json` |

## Patterns & Conventions

### Adding a New MCP Server

1. Add to `.example` file (no real API keys):
```json
{
  "mcpServers": {
    "new-server": {
      "command": "npx",
      "args": ["-y", "@scope/mcp-server"],
      "env": {
        "API_KEY": "YOUR_API_KEY_HERE"
      }
    }
  }
}
```

2. Document in `mcp/README.md`
3. Add placeholder to all relevant `.example` files

### Placeholder Convention
Use `YOUR_*` prefix for secrets:
- `YOUR_USERNAME` - macOS username
- `YOUR_POSTHOG_TOKEN` - PostHog API token
- `YOUR_REF_API_KEY` - Ref API key
- `YOUR_EXA_API_KEY` - Exa API key

## Security Rules

**CRITICAL - NEVER:**
- Commit files without `.example` suffix that contain API keys
- Add real API keys to `.example` files
- Log or print API key values

**ALWAYS:**
- Use `.example` suffix for committed templates
- Keep actual configs in gitignore
- Use `YOUR_*` placeholders in examples

## JIT Index Hints

```bash
# Find all MCP server definitions
grep -n "mcpServers" mcp/*.example

# Find all placeholder API keys
grep -rn "YOUR_" mcp/

# Check what's gitignored
cat ../.gitignore | grep mcp

# Verify no secrets committed
git diff --cached -- mcp/ | grep -i "key\|token\|secret"
```

## Common Gotchas

- **Restart required** - Apps must be restarted after config changes
- **Path escaping** - Use full paths in configs, not `~`
- **Node.js required** - Most MCP servers need `npx`

## Pre-Commit Check

```bash
# Verify no API keys in staged files
git diff --cached -- mcp/ | grep -E "(sk-|xoxb-|ghp_|YOUR_)" && echo "WARNING: Possible secret!" || echo "OK"

# Validate JSON syntax
python3 -m json.tool mcp/*.example > /dev/null && echo "JSON valid"
```
