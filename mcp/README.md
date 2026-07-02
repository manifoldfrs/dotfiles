# MCP Configurations

Model Context Protocol (MCP) server configurations for AI coding assistants.

## Config Locations

| Tool | Config File |
|------|-------------|
| **Claude Desktop** | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| **Codex** | `~/.codex/config.toml` → `stow/codex/.codex/config.toml` |

## Setup

### Claude Desktop

```bash
cd ~/dotfiles/mcp
cp claude_desktop_config.json.example claude_desktop_config.json
../mcp_setup.sh install
```

### Codex

Codex is Stow-managed by the default dotfiles profile:

```bash
cd ~/dotfiles
./scripts/stow.sh apply
```

`mcp/codex_config.toml.example` remains as a standalone template, but the active tracked config is `stow/codex/.codex/config.toml`.

### API keys

Edit each file and replace placeholders:
- `YOUR_USERNAME` → your macOS username
- `YOUR_POSTHOG_TOKEN` → your PostHog API token
- `REF_API_KEY` → environment variable containing your Ref API key
- `EXA_API_KEY` → environment variable containing your Exa API key

Restart Claude Desktop and Codex to apply changes.

## Backup

To backup your current MCP configs (with API keys):

```bash
./mcp_setup.sh backup
```

**Note:** The actual config files (with API keys) are gitignored. Only `.example` files are committed.
Codex MCP HTTP servers should use `env_http_headers` with `REF_API_KEY` and `EXA_API_KEY`, not API keys embedded in URLs.

## MCP Servers Used

- **RepoPromptCE** - Local file system access via the RepoPrompt CE app
- **PostHog** - Product analytics MCP server
- **Ref** - Documentation search
- **Exa** - Web search
- **Context7** - Library documentation
