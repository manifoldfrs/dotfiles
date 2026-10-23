# MCP Configurations

Model Context Protocol (MCP) server configurations for AI coding assistants.

## Config Locations

| Tool | Config File |
|------|-------------|
| **Claude Code** | `~/.claude.json` (machine-local registrations imported from Pi) |
| **Codex** | `~/.codex/config.toml` → `stow/codex/.codex/config.toml` |
| **Pi** | `~/.pi/agent/mcp.json` → `stow/pi/.pi/agent/mcp.json` |

## Setup

### Codex

Codex is Stow-managed by the default dotfiles profile:

```bash
cd ~/dotfiles
./scripts/stow.sh apply
```

`mcp/codex_config.toml.example` remains as a standalone template, but the active tracked config is `stow/codex/.codex/config.toml`.

### Claude Code

After approving the live configuration change, register the seven servers from Pi's tracked MCP config:

```bash
./mcp_setup.sh install-claude
claude mcp list
```

The import removes Pi-only `exposure` and `timeout` fields and sets `type: "stdio"` for command servers.
It preserves `${ENV_VAR}` placeholders; real credentials stay in the shell environment, not in tracked files.
Registrations are user-scoped and unrelated Claude account connectors are left alone.
Re-running skips identical registrations.
If an existing registration differs, the import stops without replacing it; review that server before removing it with `claude mcp remove --scope user <name>` and re-running the import.
Restart Claude Code after registering servers.

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
`stow/pi/.pi/agent/mcp.json` uses Pi's native `mcpServers` schema for Ref, exa, Jev, Chrome DevTools, codex-chrome, HEY, and Superlogical.
Ref and exa remain directly exposed; the other servers use Codemode exposure.
The settings explicitly enable Codemode alongside the ordinary coding tools.
Jev reads `TYPESAFE_API_KEY` from the environment.
HEY runs `hey mcp` and needs no key in the config; it uses the keychain credentials from `hey auth login`.
Chrome DevTools launches isolated Chrome with usage statistics disabled.
The codex-chrome bridge uses the existing Chrome profile and requires the binary and native-host setup described in the root README.
Adding these entries does not install their packages or configure the browser bridge.

### API keys

Edit each file and replace placeholders:
- `YOUR_USERNAME` → your macOS username
- `REF_API_KEY` → environment variable containing your Ref API key
- `EXA_API_KEY` → environment variable containing your Exa API key

Restart Codex to apply changes.
Run `/reload` or restart Pi after changing `~/.pi/agent/mcp.json`.

## Backup

To capture your current Codex config (including any literal API keys):

```bash
./mcp_setup.sh backup
```

**Note:** Untracked template outputs containing literal API keys are gitignored. Stow-managed configs use environment interpolation and contain no secrets.
Codex MCP HTTP servers should use `env_http_headers` with `REF_API_KEY` and `EXA_API_KEY`, not API keys embedded in URLs.
Codex stdio servers should forward keys such as `TYPESAFE_API_KEY` with `env_vars`, not literal `env` values.
Export every key from machine-local `~/.config/bash/local.bash`; do not keep keys in loose files in the repository.
Pi MCP HTTP servers should use built-in header interpolation with `${REF_API_KEY}` and `${EXA_API_KEY}`, not embedded API keys.

## MCP Servers Used

- **Ref** - Documentation search
- **Exa** - Web search
- **Jev** - Typed judgments from TypeSafe's Jev model (Pi)
- **Chrome DevTools** - Browser testing, screenshots, console, and network inspection (Pi)
- **codex-chrome** - Existing-profile Chrome control (Pi)
- **Superlogical** - Rex Beta docs, changelog, and community feedback; OAuth via `/mcp` after registering (Claude Code and Pi)
- **Context7** - Library documentation
