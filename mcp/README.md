# MCP Configurations

Model Context Protocol (MCP) server configurations shared across coding-agent harnesses.

## Source of truth and sync

[`shared/servers.json`](shared/servers.json) defines the shared MCP servers.
Codex owns its Jev and xAI Search entries in [`stow/codex/.codex/config.toml`](../stow/codex/.codex/config.toml).
Edit shared servers there, then sync the other harnesses:

- **Codex:** run `./scripts/harness_sync.sh` to regenerate the shared server blocks in the Codex template (`scripts/validate-dotfiles.sh` fails if they drift).
- **Claude Code:** run `./mcp_setup.sh install-claude` to import the shared servers into machine-local `~/.claude.json`.

| Harness | Config file | How it stays in sync |
| --- | --- | --- |
| **Codex** | Machine-local `~/.codex/config.toml` | First setup copies the tracked template. Apply desired MCP changes to existing local files explicitly. |
| **Claude Code** | `~/.claude.json` | Machine-local registrations imported by `./mcp_setup.sh install-claude` |

## Configured servers

The Exposure column describes Codex.

| Server | Purpose | Exposure | Auth / notes |
| --- | --- | --- | --- |
| **Ref** | Library and framework documentation search | Direct (and Code Mode) | `REF_API_KEY` |
| **Exa** | General web search and page fetching | Direct (and Code Mode) | `EXA_API_KEY` |
| **Jev** | Typed judgments from TypeSafe's Jev model | Code Mode | `TYPESAFE_API_KEY`; Codex pins the MCP package |
| **Chrome DevTools** | Isolated browser inspection, console, network, screenshots | Code Mode | Isolated Chrome with usage statistics disabled; never attaches to your personal browser profile |
| **Superlogical** | Rex Beta docs, changelog, and community feedback | Code Mode | OAuth via `/mcp` after registering |
| **xai-search** (Codex) | Live X posts and web search | Direct (and Code Mode) | Grok Build sign-in or `XAI_API_KEY` |

## API keys

Export API keys from machine-local `~/.config/bash/local.bash` (never tracked):

```bash
export REF_API_KEY="..."
export EXA_API_KEY="..."
export TYPESAFE_API_KEY="..."
```

Leave `${ENV_VAR}` placeholders, `env_http_headers`, and `env_vars` references unchanged in tracked files.
Never embed API keys in URLs or literal `env` tables in tracked configs.

## Per-harness setup

### Codex

On macOS and Linux, Stow's apply script seeds a missing Codex config from `stow/codex/.codex/config.toml`.

```bash
cd ~/code/personal/dotfiles
./scripts/stow.sh apply
codex mcp list
```

For existing installations, copy the desired server changes from the template into the local file, then restart Codex.

- **Code Mode:** Codex enables native Code Mode (`features.code_mode`).
  Ref and Exa are exposed both directly and in Code Mode.
  Jev, Chrome DevTools, and Superlogical are exposed only in Code Mode.
  Do not disable Codex Code Mode and expect Code-Mode-only MCP tools to remain callable.
- **Jev:** To update the pinned package, edit the Codex-owned server entry in the template and copy its `args` to the existing local entry.
  Fetch and screen external text in one Code Mode call before returning screened content to the model.
  `jev_screen` and `jev_verify` have explicit `approval_mode = "approve"` overrides.
  Other Jev tools, including `jev_gate` and `jev_review`, follow Codex's normal MCP approval behavior.
  Send only the evidence the judgment needs and follow the Jev skill's data handling rules.
- **`xai-search`:** Make `node` available on Codex's launch PATH, install [Grok Build](https://x.ai/build), and run `grok login` to use the signed-in CLI from Codex.
  The signed-in CLI uses the default reported by `grok models` unless the caller supplies a model.
  The Grok Build route requires a completed search event for every requested source.
  For exact date, handle, media, or domain filters and output-token caps, set `XAI_API_KEY` in Codex's launch environment to select the direct [xAI Responses API](https://docs.x.ai/developers/tools/x-search) route.
  The API route defaults to `grok-4.7` and uses API billing.
- **ChatGPT app servers:** The app manages its `node_repl` and `computer-use` entries in the local config.

### Claude Code

After approving a live configuration change, import the six shared servers from the tracked shared config:

```bash
./mcp_setup.sh install-claude
claude mcp list
```

The import strips the shared `exposure` and `timeout` fields, sets `type: "stdio"` for command servers, and preserves `${ENV_VAR}` placeholders.
Registrations are user-scoped and leave unrelated Claude account connectors untouched.
Re-running skips identical registrations; if an existing registration differs, the import stops without overwriting it.
Review any conflicting server before removing it with `claude mcp remove --scope user <name>` and re-running the import.
Restart Claude Code after registering servers.

## Backup

To capture your current machine-local Codex config (including any literal API keys) into gitignored `mcp/codex_config.toml`:

```bash
./mcp_setup.sh backup
```

Stow-managed configs use environment interpolation and contain no secrets.
