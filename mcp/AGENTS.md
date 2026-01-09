# AGENTS.md - MCP Configurations

## Package Identity

Model Context Protocol (MCP) server configurations for AI coding assistants.
Stores configs for **Claude Desktop** and **Codex** with API key management.

## Setup & Run

```bash
# 1. Copy example files (from mcp/ directory)
cp claude_desktop_config.json.example claude_desktop_config.json
cp codex_config.toml.example codex_config.toml

# 2. Add your API keys (edit files manually)
# Replace: YOUR_USERNAME, YOUR_POSTHOG_TOKEN, YOUR_REF_API_KEY, YOUR_EXA_API_KEY

# 3. Install configs to system locations (from repo root)
./mcp_setup.sh install

# 4. Backup system configs back to repo (preserves API keys locally)
./mcp_setup.sh backup

# 5. Restart Claude Desktop and Codex
```

## Patterns & Conventions

### File Organization
```
mcp/
├── README.md                            # Setup instructions
├── claude_desktop_config.json.example   # Template with placeholders
├── claude_desktop_config.json           # Real config (gitignored)
├── codex_config.toml.example            # Template with placeholders
└── codex_config.toml                    # Real config (gitignored)
```

### Config File Structure

**Claude Desktop (JSON)**:
```json
// ✅ DO: Follow this pattern (claude_desktop_config.json.example)
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-name"],
      "env": {
        "API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

**Codex (TOML)**:
```toml
# ✅ DO: Follow this pattern (codex_config.toml.example)
[[mcpServers]]
name = "server-name"
command = ["npx", "-y", "@modelcontextprotocol/server-name"]
env = { API_KEY = "YOUR_API_KEY" }
```

### Security Rules
- ✅ **DO**: Use `.example` suffix for templates
- ✅ **DO**: Replace placeholders before installing
- ❌ **DON'T**: Commit files without `.example` suffix
- ❌ **DON'T**: Commit real API keys (`.gitignore` blocks `*.json` and `*.toml`)
- ⚠️  **IMPORTANT**: Always review `./mcp_setup.sh backup` output before committing

## Touch Points / Key Files

| Purpose | File |
|---------|------|
| Setup docs | `README.md` |
| Install script | `../mcp_setup.sh` |
| Claude Desktop template | `claude_desktop_config.json.example` |
| Codex template | `codex_config.toml.example` |
| System config locations | See table below |

### System Config Locations

| Tool | Config File |
|------|-------------|
| **Claude Desktop** | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| **Codex** | `~/.codex/config.toml` |

## MCP Servers Used

| Server | Purpose | API Key Required? |
|--------|---------|-------------------|
| **RepoPrompt** | Local file system access | No |
| **PostHog** | Product analytics | Yes |
| **Ref** | Documentation search | Yes |
| **Exa** | Web search | Yes |
| **Context7** | Library documentation | No |

## JIT Index Hints

```bash
# Find all MCP servers configured
rg "mcpServers" *.json.example

# Find API key placeholders
rg "YOUR_" *.example

# Check if real configs exist (should be gitignored)
ls -la *.json *.toml 2>/dev/null

# Verify gitignore blocks real configs
git status --ignored
```

## Common Gotchas

1. **Claude Desktop not loading MCP?** Restart the app, check logs: `~/Library/Logs/Claude/`
2. **Codex MCP not working?** Ensure `~/.codex/config.toml` exists
3. **API key not working?** Check for trailing spaces, ensure no quotes in TOML env vars
4. **npx command fails?** Ensure Node.js LTS installed (`nvm install --lts`)
5. **Accidentally committed API keys?** Use `git filter-branch` or BFG Repo-Cleaner to remove

## Pre-PR Checks

```bash
# 1. Verify no real configs are staged
git status | grep -E "claude_desktop_config.json|codex_config.toml" && echo "✗ Real configs staged!" || echo "✓ Safe"

# 2. Check .gitignore blocks them
git check-ignore mcp/*.json mcp/*.toml && echo "✓ Gitignore working" || echo "✗ Update .gitignore"

# 3. Verify examples have placeholders
rg "YOUR_" mcp/*.example && echo "✓ Placeholders present"
```

## Adding a New MCP Server

### To Claude Desktop:
1. Edit `claude_desktop_config.json.example`
2. Add server block following existing pattern
3. Document API key source in `README.md`
4. Update this AGENTS.md "MCP Servers Used" table
5. Test: `./mcp_setup.sh install` then restart Claude Desktop

### To Codex:
1. Edit `codex_config.toml.example`
2. Add `[[mcpServers]]` block
3. Follow TOML syntax (arrays with brackets)
4. Test: `./mcp_setup.sh install` then restart Codex

### Example:
```json
// Claude Desktop addition
"new-server": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-new"],
  "env": {
    "API_KEY": "YOUR_NEW_API_KEY"
  }
}
```

```toml
# Codex addition
[[mcpServers]]
name = "new-server"
command = ["npx", "-y", "@modelcontextprotocol/server-new"]
env = { API_KEY = "YOUR_NEW_API_KEY" }
```
