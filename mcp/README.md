# MCP Configurations

Model Context Protocol (MCP) server configurations for AI coding assistants.

## Config Locations

| Tool | Config File |
|------|-------------|
| **Claude Desktop** | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| **Codex** | `~/.codex/config.toml` → `stow/codex/.codex/config.toml` |
| **Pi** | `~/.pi/agent/mcp.json` → `stow/pi/.pi/agent/mcp.json` |

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

### Pi

Pi is Stow-managed by the default and Coinbase dotfiles profiles:

```bash
cd ~/dotfiles
./scripts/stow.sh apply
pi list
pi
/mcp
```

`stow/pi/.pi/agent/settings.json` installs `npm:pi-mcp-adapter`.
`stow/pi/.pi/agent/mcp.json` mirrors the tracked Codex/OpenCode MCP set: RepoPromptCE, Ref, and exa.

### API keys

Edit each file and replace placeholders:
- `YOUR_USERNAME` → your macOS username
- `REF_API_KEY` → environment variable containing your Ref API key
- `EXA_API_KEY` → environment variable containing your Exa API key

Restart Claude Desktop and Codex to apply changes.
Restart Pi after changing `~/.pi/agent/mcp.json`.

## Backup

To backup your current MCP configs (with API keys):

```bash
./mcp_setup.sh backup
```

**Note:** The actual config files (with API keys) are gitignored. Only `.example` files are committed.
Codex MCP HTTP servers should use `env_http_headers` with `REF_API_KEY` and `EXA_API_KEY`, not API keys embedded in URLs.
Pi MCP HTTP servers should use adapter header interpolation with `${REF_API_KEY}` and `${EXA_API_KEY}`, not embedded API keys.

## MCP Servers Used

- **RepoPromptCE** - Local file system access via the RepoPrompt CE app
- **Ref** - Documentation search
- **Exa** - Web search
- **Context7** - Library documentation
