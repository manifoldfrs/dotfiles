# MCP Configurations

Model Context Protocol (MCP) server configurations for AI coding assistants.

## Config Locations

| Tool | Config File |
|------|-------------|
| **Claude Desktop** | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| **Codex** | `~/.codex/config.toml` |

## Setup

### 1. Copy example files

```bash
cd ~/dotfiles/mcp
cp claude_desktop_config.json.example claude_desktop_config.json
cp codex_config.toml.example codex_config.toml
```

### 2. Add your API keys

Edit each file and replace placeholders:
- `YOUR_USERNAME` → your macOS username
- `YOUR_POSTHOG_TOKEN` → your PostHog API token
- `YOUR_REF_API_KEY` → your Ref API key
- `YOUR_EXA_API_KEY` → your Exa API key

### 3. Install configs

```bash
./mcp_setup.sh install
```

### 4. Restart applications

Restart Claude Desktop and Codex to apply changes.

## Backup

To backup your current MCP configs (with API keys):

```bash
./mcp_setup.sh backup
```

**Note:** The actual config files (with API keys) are gitignored. Only `.example` files are committed.

## MCP Servers Used

- **RepoPrompt** - Local file system access via RepoPrompt app
- **PostHog** - Product analytics MCP server
- **Ref** - Documentation search
- **Exa** - Web search
- **Context7** - Library documentation
