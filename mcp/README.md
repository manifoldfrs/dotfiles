# MCP Configurations

Model Context Protocol (MCP) server configurations for AI coding assistants.

## Config Locations

| Tool | Config File |
|------|-------------|
| **Claude Desktop** | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| **Codex** | `~/.codex/config.toml` → `stow/codex/.codex/config.toml` |
| **Pi** | `~/.pi/agent/mcp.json` → `stow/pi/.pi/agent/mcp.json` |
| **OpenCode** | `~/.config/opencode/opencode.jsonc` → `stow/opencode/.config/opencode/opencode.jsonc` |

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

### Claude Code

Claude Code stores user-scoped MCP servers in the untracked `~/.claude.json`.
Register Jev once per machine:

```bash
claude mcp add -s user jev -- npx -y @jkudish/jev-mcp
claude mcp list
```

The server reads `TYPESAFE_API_KEY` from the shell environment.
`stow/claude/.claude/settings.json` allows `mcp__jev__*`, and the vendored `jev` skill in `stow/agents/.agents/skills/jev` tells agents when to call each tool.

### Pi

Pi is Stow-managed by the default dotfiles profile:

```bash
cd ~/dotfiles
./scripts/stow.sh apply
pi list
pi mcp list
pi
/mcp
```

`stow/pi/.pi/agent/settings.json` leaves Pi's built-in MCP support enabled.
`stow/pi/.pi/agent/mcp.json` uses Pi's native `mcpServers` schema for Ref, exa, Jev, Chrome DevTools, codex-chrome, Sonar, and HEY.
Ref and exa remain directly exposed; the other servers use Codemode exposure.
The settings explicitly enable Codemode alongside the ordinary coding tools.
Jev reads `TYPESAFE_API_KEY` from the environment; Sonar passes `${SONAR_API_KEY}` through `env`.
HEY runs `hey mcp` and needs no key in the config; it uses the keychain credentials from `hey auth login`.
Chrome DevTools launches isolated Chrome with usage statistics disabled.
The codex-chrome bridge uses the existing Chrome profile and requires the binary and native-host setup described in the root README.
Adding these entries does not install their packages or configure the browser bridge.

### OpenCode

OpenCode is Stow-managed by the default dotfiles profile:

```bash
cd ~/dotfiles
./scripts/stow.sh apply
opencode mcp list
```

`stow/opencode/.config/opencode/opencode.jsonc` configures Ref, exa, Chrome DevTools, and Jev using the native OpenCode 2 `mcp.servers` schema.
Chrome DevTools launches a separate Chrome with a temporary profile (`--isolated`) for app testing and screenshots.

### API keys

Edit each file and replace placeholders:
- `YOUR_USERNAME` → your macOS username
- `REF_API_KEY` → environment variable containing your Ref API key
- `EXA_API_KEY` → environment variable containing your Exa API key

Restart Claude Desktop and Codex to apply changes.
Run `/reload` or restart Pi after changing `~/.pi/agent/mcp.json`.
Reload OpenCode after changing `~/.config/opencode/opencode.jsonc`.

## Backup

To backup your current MCP configs (with API keys):

```bash
./mcp_setup.sh backup
```

**Note:** Untracked template outputs containing literal API keys are gitignored. Stow-managed configs use environment interpolation and contain no secrets.
Codex MCP HTTP servers should use `env_http_headers` with `REF_API_KEY` and `EXA_API_KEY`, not API keys embedded in URLs.
Codex stdio servers should forward keys such as `TYPESAFE_API_KEY` and `SONAR_API_KEY` with `env_vars`, not literal `env` values.
Claude Code's user-scope servers in `~/.claude.json` should use `${EXA_API_KEY}`-style expansion in headers and `env`.
Export every key from machine-local `~/.config/bash/local.bash`; do not keep keys in loose files in the repository.
Pi MCP HTTP servers should use built-in header interpolation with `${REF_API_KEY}` and `${EXA_API_KEY}`, not embedded API keys.
OpenCode MCP servers should use `{env:REF_API_KEY}` and `{env:EXA_API_KEY}` interpolation, not embedded API keys.

## MCP Servers Used

- **Ref** - Documentation search
- **Exa** - Web search
- **Jev** - Typed judgments from TypeSafe's Jev model (Claude Code, OpenCode, and Pi)
- **Chrome DevTools** - Browser testing, screenshots, console, and network inspection (OpenCode and Pi)
- **codex-chrome** - Existing-profile Chrome control (OpenCode and Pi)
- **Sonar** - App Store optimization data (Claude Code, Codex, and Pi)
- **Context7** - Library documentation
