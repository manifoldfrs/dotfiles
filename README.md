# dotfiles

Configuration files for Bash, Starship, Homebrew, Ghostty, Herdr, Neovim, OpenCode, Claude Code, Codex, and Pi. GNU Stow manages symlinks from `stow/*` into `$HOME`. Ghostty, Herdr, Neovim, Pi, OpenCode, and Codex use **Tokyo Night** with MonoLisaCode 14 pt.

## Theme and font status

- Ghostty, Herdr, Neovim, Pi, OpenCode, and Codex use Tokyo Night.
- Neovim uses the Tokyo Night `night` style with transparent editor, sidebar, float, statusline, and tab-fill surfaces.
- Ghostty uses `MonoLisaCode` at 14 pt with explicit regular, italic, bold, and bold-italic styles.
- Starship uses the intended Nerd Font glyphs through Ghostty's built-in `Symbols Nerd Font` fallback. See `plans/theme-font-glyph-followups.md`.
- Starship and FZF inherit the Tokyo Night terminal palette from Ghostty.
- Cursor and Zed are archived under `old/` and are not restored or rethemed.

## Requirements

| Tool | Minimum Version | Notes |
|------|-----------------|-------|
| **Neovim** | >= 0.11.0 | Required for mason-lspconfig v2 and vim.lsp.config() |
| **Git** | >= 2.19.0 | Required for lazy.nvim partial clones |
| **GNU Stow** | >= 2.4.0 | Symlink manager for tracked dotfiles |
| **Ghostty** | Latest | Uses `macos-option-as-alt` syntax |
| **Herdr** | Latest | Agent-aware terminal workspace manager |
| **Node.js** | LTS | For LSP servers via Mason |
| **tree-sitter-cli** | >= 0.26.1 | Required for nvim-treesitter `main` branch parser compilation |
| **lazygit** | >= 0.40 | Required for snacks.lazygit keymap (`<leader>gg`) |
| **ripgrep** | >= 13.0 | Required for nvim-spectre search backend |
| **gnu-sed** | Latest | Recommended on macOS for nvim-spectre replace engine (`brew install gnu-sed`) |
| **imagemagick** | >= 7.0 | Required for snacks.image preview support |

## Spotify Terminal Visualizer

`spotify-visualizer` is a standalone TypeScript command managed by the `bin` Stow package. It renders a procedural terminal dot matrix based on the website music visualizer colors, then uses Spotify only for the current track, artist, play state, and track-specific animation seed.

Setup:

```bash
# 1. Create or reuse a Spotify developer app.
# 2. Add this redirect URI to that app:
#    http://127.0.0.1:8974/callback
# 3. Export the client id before launching the visualizer:
export SPOTIFY_CLIENT_ID=your_spotify_client_id

spotify-visualizer
```

The command stores OAuth tokens under `~/.cache/dotfiles/spotify-visualizer/`. Run it in any Herdr pane or tab when you want a dedicated visualizer screen.

Controls:

| Key | Action |
|-----|--------|
| `Space` | Toggle Spotify play or pause |
| `n` | Skip to the next track |
| `p` | Skip to the previous track |
| `s` | Toggle shuffle |
| `r` | Cycle repeat off, context, and current track |
| `q` / `Ctrl-C` | Quit and restore the terminal |

The visualizer shows this key legend in the header. Short notices, such as pressing a playback key before Spotify has an active track, replace the legend for about 3 seconds.

Shuffle and repeat state use compact status tokens in the header. Shuffle uses `[S:-]` when inactive and yellow `[S:*]` when active. Repeat uses gray `[R:-]` when inactive, red `[R:all]` for repeat context, and red `[R:1]` for repeat current track.

If Spotify returns `401` after scopes change, remove the cached token and authorize again:

```bash
rm ~/.cache/dotfiles/spotify-visualizer/tokens.json
spotify-visualizer
```

## TypeSafe Jev

The TypeSafe skill defines when and how to request a Jev judgment.
Harness adapters expose that behavior as the `typesafe_evaluate` tool:

- Pi: `stow/pi/.pi/agent/extensions/typesafe-ai/`
- OpenCode: `stow/opencode/.config/opencode/plugins/typesafe-ai/`

The tool accepts Choice, Score, and Noul questions and returns typed answers with probabilities.
It sends the supplied state and questions to TypeSafe.
Do not include credentials, secrets, or unrelated private data.

Keep `TYPESAFE_API_KEY` as machine-local state in `~/.config/bash/local.bash`:

```bash
export TYPESAFE_API_KEY="YOUR_API_KEY"
```

`scripts/bootstrap.sh` installs the pinned runtime dependencies.
After an apply, reload Pi or OpenCode so that it loads the new adapter.

## OpenCode Configuration

The `opencode` Stow package owns the tracked sources under `stow/opencode/.config/opencode/`.

| Tracked source | Purpose |
| --- | --- |
| `opencode.jsonc` | Model defaults, permissions, MCP servers, providers, skills, and global instructions |
| `cli.json` | Tokyo Night, TUI layout, permission handling, and keybindings |
| `commands/` | Slash commands such as `/lg`, `/rp`, `/rp-plan`, `/rp-review`, `/rp-search`, and `/rp-tree` |
| `plugins/typesafe-ai/` | TypeSafe Jev tool |
| `plugins/tui-conveniences/` | `/copy-all`, skill-load confirmations, and the Git status footer |

New sessions use `openai/gpt-6-sol-fast` with medium reasoning effort and low response verbosity.
The TUI hides the session sidebar and persistent tab strip.
The TUI also provides Pi-style navigation shortcuts.

OpenCode can use the current user's filesystem, processes, and network without a permission prompt.
Review the tracked configuration before you apply it.

`REF_API_KEY`, `EXA_API_KEY`, and `TYPESAFE_API_KEY` are machine-local state.
Do not put real credentials in tracked sources.

Apply only the OpenCode Stow package with:

```bash
cd ~/dotfiles
./scripts/stow.sh apply opencode
```

Bootstrap installs plugin dependencies automatically.
Restart OpenCode after an apply.

### GPT-5 Response Verbosity

OpenAI GPT-5 models using the Responses API support `low`, `medium`, and `high` output verbosity.
The tracked configs currently use `low`.

- Pi sets verbosity for every GPT-5 model using `openai-responses` or `openai-codex-responses` in `stow/pi/.pi/agent/extensions/gpt-verbosity.ts`.
  Change the `VERBOSITY` constant, then run `/reload` in Pi.
- Codex sets verbosity with `model_verbosity` in `stow/codex/.codex/config.toml`.
  Change the value, then restart Codex.
- OpenCode sets `textVerbosity` per provider and model in `stow/opencode/.config/opencode/opencode.jsonc`.
  Update each GPT-5 model entry you use under `provider.openai.models` or `provider.opencode.models`, then restart OpenCode.

For example, an OpenCode model override uses this shape:

```jsonc
"providers": {
  "openai": {
    "models": {
      "gpt-5.6-sol-fast": {
        "settings": {
          "textVerbosity": "low",
        },
      },
    },
  },
}
```

## Claude provider request logger

Run `claude-log` from your regular shell instead of `claude` to start Claude Code through an opt-in local Anthropic request logger:

```bash
claude-log
```

The command starts a local proxy on a temporary loopback port, launches Claude Code against it, and stops the proxy when Claude exits.
Each `/v1/messages` request is written under `~/.claude/logs/requests/` as readable Markdown plus the raw JSON payload.
The Markdown includes request sizes, ranked tool schemas, redacted request headers, the full payload, and the streamed provider response.
This logger is inspired by [Matt Pocock's agent proxy](https://gist.github.com/mattpocock/5b3d76ea21f5f698aefded47a9cea3b1).
It does not capture direct MCP network traffic.

The directory and files use owner-only permissions.
The logs can contain sensitive source code, prompts, and connected-service data.
Review them before sharing, and remove them when finished:

```bash
rm -rf ~/.claude/logs/requests
```

Set `CLAUDE_REQUEST_LOG_DIR` to store logs somewhere else.
Normal `claude` sessions do not write request logs.

## Pi provider request logger

Run `pi-log` from your regular shell instead of `pi` when you need to inspect the exact payload Pi sends to its model provider:

```bash
pi-log
```

The command enables the tracked `request-logger.ts` extension for that Pi process only.
Each request is written as a readable Markdown file under `~/.pi/agent/logs/requests/`, including a size audit, ranked tool schemas, the complete provider payload, the normalized assistant response, and response status metadata when the active provider exposes it.
The directory and files use owner-only permissions.
These logs can contain source code, prompts, tool results, Gmail, Slack, or Drive data, so do not commit or share them without reviewing the contents.
Remove captured requests when finished:

```bash
rm -rf ~/.pi/agent/logs/requests
```

You can also run `pi --request-log` directly, or set `PI_REQUEST_LOG_DIR` to store logs somewhere else.
Normal `pi` sessions do not write request logs.

[![Test Dotfiles](https://github.com/manifoldfrs/dotfiles/actions/workflows/test.yml/badge.svg)](https://github.com/manifoldfrs/dotfiles/actions/workflows/test.yml)

## Quick Start (New Mac)

```bash
# 1. Clone the repo
git clone https://github.com/manifoldfrs/dotfiles.git ~/dotfiles

# 2. Run the installer
cd ~/dotfiles
./scripts/bootstrap.sh

# 3. Fully quit and reopen your terminal

# 4. Verify Node.js works
node --version

# 5. Verify OpenCode 2 (installed by bootstrap)
opencode --version
```

## Update an Existing Mac / Work Laptop

Use the daily Stow wrapper when the repo is already on the machine and you just want the latest dotfiles applied.

```bash
# 1. Get the latest committed dotfiles
cd ~/dotfiles
git pull

# 2. Validate, then reapply all tracked shell/editor/terminal and Herdr config
./scripts/validate-dotfiles.sh
./scripts/stow.sh apply

# First time on this machine? Install Bash, Starship, and the supporting tools:
brew bundle --file=Brewfile
# or only the packaged shell stack:
# brew install bash starship zoxide fzf mise ripgrep fd gawk

# 3. Fully quit and reopen your terminal

# 4. Install/update declared Herdr plugins and reload a running server
./scripts/sync_herdr_plugins.sh

# 5. Verify the basics
node --version
herdr --version
```

Use `./scripts/bootstrap.sh` instead when you also want to install or refresh Homebrew packages, Node.js, and Neovim plugins.

What this already handles for you:
- stows Bash, Starship, Git, Ghostty, Herdr, Neovim, OpenCode, Claude Code, Codex, Pi settings, and local bin config
- configures Herdr with Tokyo Night, Bash, tmux-style `Ctrl-a` bindings, persistence, and agent-aware workspaces
- avoids rerunning full-machine bootstrap tasks during normal dotfile updates

What `./scripts/bootstrap.sh` additionally handles for you:
- installs Homebrew packages from `Brewfile`
- runs Neovim headless plugin sync automatically
- installs Bun and Plannotator TUI, then syncs the declared Herdr plugins

What is still separate:
- `./mcp_setup.sh install` for the optional Claude Desktop MCP config
- Claude Code's user-scoped MCP config in `~/.claude.json`, which stays local because it contains credentials and account-specific state
- OpenCode install if you use it on that machine

## Herdr and Neovim integrations

The `herdr` Stow package also manages `~/.config/herdr/plugins.txt` and `~/.config/plannotator-tui/config.toml`.
The default profile includes it.
Stow only applies configuration, it does not install or update plugins.

```bash
# Existing machines: install the terminal review tool, then sync plugins.
# Requires herdr >= 0.8.0, Bun, and jq on PATH.
brew tap plannotator/tap
# On Homebrew versions that support trust:
# brew trust plannotator/tap
brew install plannotator/tap/plannotator-tui
./scripts/stow.sh apply
./scripts/sync_herdr_plugins.sh
```

The sync command installs or updates `plannotator/herdr-annotate` and `paulbkim-dev/vim-herdr-navigation`, checks the config, and reloads a running Herdr server.
Plannotator TUI opens in a full-tab overlay.
The agent sidebar prioritizes agents needing attention, uses distinct status symbols, and asks before closing workspaces.
Pane-history persistence remains disabled.

| Shortcut | Action |
| --- | --- |
| `Ctrl-h/j/k/l` | Navigate Neovim splits, then adjacent Herdr panes at the edge |
| `Ctrl-a a` | Annotate selected terminal text |
| `Ctrl-a Shift-a` | Copy annotations as agent context |
| `Ctrl-a m` | Manage annotations |
| `Ctrl-a Shift-o` | Review documents in the current folder |
| `Ctrl-a Shift-l` | Review the agent's last reply |
| Neovim visual `<leader>a` | Send the selection to Herdr Annotate |

Press `Ctrl-a`, release it, then press the shortcut's second key.

Launch Plannotator TUI directly from a shell:

```bash
plannotator-tui README.md       # Review a file
plannotator-tui docs/           # Browse a folder
plannotator-tui herdr open .    # Review this folder in a Herdr overlay
plannotator-tui herdr last      # Annotate the agent's last reply in Herdr
plannotator-tui last --host pi      # Review the latest Pi reply outside Herdr
plannotator-tui last --host claude  # Review the latest Claude reply outside Herdr
```

The `plannotator-tui` commands open the terminal interface.
The browser-based `plannotator` integration is installed alongside it.

Existing `Ctrl-a o` pane cycling and `Ctrl-a z` zoom bindings are unchanged.
Global `Ctrl-k` and `Ctrl-l` navigation takes precedence over shell line deletion and screen clearing inside Herdr.
Neovim outside Herdr retains ordinary split navigation.
The annotation handoff uses a private temporary file that the plugin consumes and deletes.

### Clickable links in terminal chat

In Ghostty on macOS, hold **Shift + Cmd** and click a link to open it, including inside Herdr.
This bypasses application mouse capture and lets Ghostty handle the link.
This gesture was verified in this setup, while Herdr's documented Ctrl-click gesture did not work.
Keep mouse capture enabled to preserve Herdr's mouse UI.
See [Herdr's mouse guide](https://herdr.dev/docs/quick-start/#use-the-mouse).

Pi renders Markdown links as terminal hyperlinks, but relative targets such as `docs/plan.md` remain unresolved relative paths.
The global Pi rules request absolute `file:///` URLs for local files in chat and full `https://` URLs for web links.
File labels can still show readable repository-relative paths and line numbers.
Line numbers are informational, not editor jump targets.
Links written inside repository documentation remain relative for portability.

Shift-Cmd-click uses the system opener rather than the Herdr Annotate plugin.
To review Markdown in Plannotator TUI, use `Ctrl-a Shift-o` or `plannotator-tui herdr open <file.md>`.
Existing messages are not rewritten by the rule change.
Start a new Pi session or use `/reload` to refresh the global instructions in an existing session.

### Neovim secret masking and TypeScript tools

- `cloak.nvim` visually masks values in `.env`, `.dev.vars`, selected shell configuration files, and TOML token assignments.
  Use `<leader>uC` to toggle masking.
  This only affects display, not file contents, clipboard access, or agent access.
- `:TSC` runs the project's TypeScript compiler with `--noEmit` and opens errors in quickfix.
  Install TypeScript in the project first.
- `ts-error-translator.nvim` improves the readability of TypeScript diagnostics.
- In TypeScript buffers, `:TwoslashQueriesEnable` enables inline type queries and `:TwoslashQueriesInspect` inspects the type at the cursor.
  `:TwoslashQueriesDisable` turns queries off.

Use `:Lazy install` to install missing plugins on an existing machine.
The TypeScript tools reuse the existing `ts_ls` setup.

## Planning and review

Planning and review can use ordinary chat, Plannotator TUI, or Plannotator's browser UI.
Plans are maintained as project Markdown, revised from feedback, and implemented only after explicit approval.

Pi provides `/plannotator-plan-mode`, `/plannotator-review`, `/plannotator-annotate`, and `/plannotator-last` through `@plannotator/pi-extension`; `Ctrl+Alt+P` toggles its plan mode.
Claude Code uses the `plannotator@plannotator` plugin to intercept plan approval and exposes the Plannotator commands after restart.
Codex uses its managed `Stop` hook for browser review.

## Stow How-To

GNU Stow is the source of truth for tracked dotfiles. Each folder under `stow/` is a package that mirrors paths under `$HOME`.

Example: `stow/nvim/.config/nvim/init.lua` becomes `~/.config/nvim/init.lua`.

### Apply Dotfiles

Use the wrapper for normal dotfile updates:

```bash
cd ~/dotfiles
./scripts/stow.sh dry-run
./scripts/stow.sh apply
```

With no action, the wrapper defaults to `dry-run` and does not change the live configuration.
An explicit `apply` runs the isolated preflight before making changes.
The equivalent unguarded direct Stow command is:

```bash
cd ~/dotfiles
stow --no-folding -R -v -t "$HOME" -d stow bash git ghostty herdr nvim bin opencode claude codex pi
```

### Run Stow Without Scripts

Use direct Stow commands when you want to bypass the shell wrappers. Direct Stow only creates or removes symlinks. Herdr integrations remain a separate per-machine installation step.

```bash
cd ~/dotfiles

# Personal machine: preview and apply the full shared profile
stow --no-folding -n -v -t "$HOME" -d stow bash git ghostty herdr nvim bin opencode claude codex pi
stow --no-folding -R -v -t "$HOME" -d stow bash git ghostty herdr nvim bin opencode claude codex pi

# Remove the personal shared profile symlinks
stow --no-folding -D -v -t "$HOME" -d stow bash git ghostty herdr nvim bin opencode claude codex pi

```

### Apply One Package

```bash
# Neovim only
stow --no-folding -R -v -t "$HOME" -d stow nvim

# Herdr only
stow --no-folding -R -v -t "$HOME" -d stow herdr

# Bash and Starship only
stow --no-folding -R -v -t "$HOME" -d stow bash

# OpenCode only
stow --no-folding -R -v -t "$HOME" -d stow opencode

# Claude Code settings only
stow --no-folding -R -v -t "$HOME" -d stow claude

# Pi settings only
stow --no-folding -R -v -t "$HOME" -d stow pi

```

### Bash + Starship setup

The `stow/bash` package provides Homebrew Bash 5, GNU Readline settings, Starship, FZF completion and keybindings, zoxide, mise, and personal tool paths.

Install and apply the default profile:

```bash
brew bundle --file=Brewfile
./scripts/bootstrap.sh
exec /opt/homebrew/bin/bash --login
```

Ghostty and Herdr launch `/opt/homebrew/bin/bash` explicitly. Bootstrap attempts to select Homebrew Bash as the macOS login shell. Machine-local secrets and overrides belong in `~/.config/bash/local.bash`.

#### Prompt and runtime behavior

Starship keeps non-truncated directories, 18-character Git branches, project-marker-only Node detection, and the existing Nerd Font glyphs. FZF supplies fuzzy completion and history/file keybindings, with `Ctrl-F` opening fuzzy history search. GNU Readline supplies history navigation and editable keybindings. Bash caches the generated FZF, Starship, Zoxide, and mise initialization scripts until their executables change. mise manages project runtime versions and environments.

#### Rollback

The former Fish package is preserved under `old/fish`. To roll back, remove the Bash profile with `./scripts/stow.sh delete`, Stow the archived package explicitly, and point Ghostty and Herdr back to Fish.

### Migrate An Existing Machine

Use this when a machine already has real config files or directories, such as an older `~/.config/nvim`, `~/.config/ghostty/config`, or `~/.config/herdr/config.toml`. Stow will not overwrite those automatically; move them aside first.

Check whether each target is already a Stow symlink:

```bash
readlink ~/.config/nvim
readlink ~/.config/ghostty/config
readlink ~/.config/herdr/config.toml
```

If a command prints a path into `~/dotfiles/stow/...`, that target is already managed by Stow and does not need to be moved. If it prints nothing, back up the real file or directory before stowing.

The guarded commands below only move targets that exist and are not already symlinks, so they are safe to paste on machines where some targets are already migrated:

```bash
cd ~/dotfiles
git pull

timestamp=$(date +%Y%m%d%H%M%S)

[ -e ~/.config/nvim ] && [ ! -L ~/.config/nvim ] && mv ~/.config/nvim ~/.config/nvim.backup.$timestamp
[ -e ~/.config/ghostty/config ] && [ ! -L ~/.config/ghostty/config ] && mv ~/.config/ghostty/config ~/.config/ghostty/config.backup.$timestamp
[ -e ~/.config/herdr/config.toml ] && [ ! -L ~/.config/herdr/config.toml ] && mv ~/.config/herdr/config.toml ~/.config/herdr/config.toml.backup.$timestamp

stow --no-folding -R -v -t "$HOME" -d stow nvim ghostty herdr
```

After migration, validate tracked configuration before applying it:

```bash
cd ~/dotfiles
git pull
./scripts/validate-dotfiles.sh
./scripts/stow.sh apply
```

`stow.sh apply` repeats the isolated preflight before changing the live configuration.
The preflight checks Bash syntax, sources every Bash startup path 100 times without losing or duplicating PATH entries, applies every package into a temporary home directory, and smoke-tests a clean Bash startup.
If any check fails, the live home directory is not changed.

### Preview Changes

```bash
./scripts/stow.sh dry-run
```

This shows what Stow would do without changing files.

### Remove Symlinks

```bash
# Unstow one package directly
stow --no-folding -D -v -t "$HOME" -d stow nvim

# Unstow all managed packages
./scripts/stow.sh delete
```

This removes Stow-managed symlinks only. It does not delete files inside this repo.

### Add A New Managed File

```bash
# Example: manage ~/.config/example/config.toml
mkdir -p stow/example/.config/example
mv ~/.config/example/config.toml stow/example/.config/example/config.toml
stow --no-folding -R -v -t "$HOME" -d stow example
```

Use one package per tool when possible. That keeps `stow nvim`, `stow herdr`, and `stow ghostty` independently manageable.

### Edit Managed Files

Edit either the `$HOME` path or the repo path. Because Stow creates symlinks, both point to the same file.

```bash
nvim ~/.bashrc
nvim ~/dotfiles/stow/bash/.bashrc
```

After editing, check repo changes:

```bash
cd ~/dotfiles
git status --short
git diff
```

### Backup Current Machine State

```bash
cd ~/dotfiles
./scripts/backup.sh
./mcp_setup.sh backup
```

`scripts/backup.sh` follows symlinks with `cp -L`, so it captures the configured shell/editor files into `stow/*`. It intentionally does not copy live OpenCode or Claude account/runtime state because those files can contain API keys, session data, or local machine history.

## Command Cheatsheet

| Task | Command |
|------|---------|
| Full install/update | `./scripts/bootstrap.sh` |
| Backup shell/editor config | `./scripts/backup.sh` |
| Validate without live changes | `./scripts/validate-dotfiles.sh` |
| Apply all Stow packages after preflight | `./scripts/stow.sh apply` |
| Preview all Stow changes | `./scripts/stow.sh dry-run` |
| Remove all Stow symlinks | `./scripts/stow.sh delete` |
| Restow Bash config | `stow --no-folding -R -v -t "$HOME" -d stow bash` |
| Restow OpenCode | `stow --no-folding -R -v -t "$HOME" -d stow opencode` |
| Restow Claude Code settings | `stow --no-folding -R -v -t "$HOME" -d stow claude` |
| Run Claude with request logging | `claude-log` |
| Restow Codex settings/skills/hooks | `./scripts/stow.sh apply` |
| Restow Pi settings | `stow --no-folding -R -v -t "$HOME" -d stow pi` |
| Run Pi with request logging | `pi-log` |
| Unstow Neovim | `stow --no-folding -D -v -t "$HOME" -d stow nvim` |
| Restow Neovim | `stow --no-folding -R -v -t "$HOME" -d stow nvim` |
| Restow Herdr config | `stow --no-folding -R -v -t "$HOME" -d stow herdr` |
| Reload Herdr config | `herdr server reload-config` |
| Check Herdr integrations | `herdr integration status` |
| Restore Neovim plugins | `nvim --headless -c "Lazy! restore" -c "qa"` |
| Open Lazy UI | `nvim +Lazy` |
| Open Mason UI | `nvim +Mason` |
| Shell syntax checks | `bash -n scripts/bootstrap.sh scripts/backup.sh scripts/stow.sh stow/bash/.bash_profile stow/bash/.bashrc stow/bash/.config/bash/*.bash` |
| Neovim safety check | `bash test/nvim_plugin_safety.sh --base-ref HEAD` |
| Docker test suite | `docker build -t dotfiles-test -f test/Dockerfile . && docker run --rm dotfiles-test` |

## What Gets Installed

### Bootstrap (`scripts/bootstrap.sh`)

- **Homebrew** + all packages from `Brewfile` (includes Bash 5, Starship, Zoxide, mise, Stow, Ghostty, and Herdr)
- **Starship** prompt with bounded project/runtime detection
- **FZF** completion and history/file keybindings through its native Bash integration
- **Node.js** from `Brewfile`
- **Configs stowed**: `stow/bash`, `stow/git`, `stow/ghostty`, `stow/herdr`, `stow/nvim`, `stow/bin`, `stow/opencode`, `stow/claude`, `stow/codex`, and `stow/pi` into `$HOME`
- **Herdr**: Stow-managed Tokyo Night config with Bash and preserved `Ctrl-a` workspace, tab, and pane controls
- **Neovim plugins restored** headlessly from `lazy-lock.json` via lazy.nvim (`nvim --headless -c "Lazy! restore" -c "qa"`)
- **fzf shell integration** when Homebrew fzf is available
- **Global npm packages** from `npm-global-packages.txt`

### npm Global Packages (`npm-global-packages.txt`)

- `@anthropic-ai/claude-code` - Claude Code CLI
- `@openai/codex` - OpenAI Codex CLI
- `vercel` - Vercel CLI
- `tree-sitter-cli` - Parser generator for nvim-treesitter

### MCP Setup (`mcp_setup.sh install`)

MCP (Model Context Protocol) configs for AI coding assistants:
- **Claude Desktop**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Claude Code**: user-scoped `~/.claude.json`, kept local and configured through `claude mcp`
- **Codex**: `~/.codex/config.toml`
- **Pi**: `~/.pi/agent/mcp.json`
- **OpenCode**: `~/.config/opencode/opencode.jsonc`

See `mcp/README.md` for setup instructions and API key configuration.

Preferred tool usage after setup:
- Use `RepoPromptCE_*` tools for repo discovery, file reads, selection management, planning, review, and git context whenever RepoPromptCE is available.
- Use Ref for documentation lookup: search with `ref_ref_search_documentation`, then read the result with `ref_ref_read_url`.
- Use exa for web search and page fetches when current web context is needed.

### AI Agent Configuration

#### Shared rules and skills

Global agent rules are tracked in [stow/pi/.pi/agent/AGENTS.md](stow/pi/.pi/agent/AGENTS.md).
The `pi` and `opencode` Stow packages expose this file to Pi and OpenCode.
Reload existing sessions after you change the rules.

The shared skill catalog is tracked once under `stow/agents/.agents/skills/`.
`scripts/stow.sh` links each complete skill directory into `~/.agents/skills/` and `~/.claude/skills/`.
Pi and OpenCode use `~/.agents/skills/`.
Claude Code uses `~/.claude/skills/`.

The catalog combines the baseline catalog, the personalization layer, and local skills.
Skill ownership is recorded in `stow/agents/.agents/skills/.skill-sources.tsv`.
Use `./scripts/update_agent_skills.sh --check` to check for drift.
Use `--review` to open a Plannotator review and `--sync` to update the tracked snapshot.
An update stays uncommitted for normal Git review.

Local language standards include `coding-standards-ts`, `coding-standards-go`, and [coding-standards-rails](stow/agents/.agents/skills/coding-standards-rails/SKILL.md).
[anti-slop-rails](stow/agents/.agents/skills/anti-slop-rails/SKILL.md) provides an evidence-based Rails review and cleanup workflow.
Ask it to review a diff for findings only, or ask it to clean up a diff to authorize edits.
[anti-slop-ts](stow/agents/.agents/skills/anti-slop-ts/SKILL.md) manages the vendored Oxlint anti-slop plugin and its update workflow.

#### Pi

The `pi` Stow package owns settings, MCP configuration, prompts, themes, and extensions under `stow/pi/.pi/agent/`.
Pi uses RepoPromptCE, Ref, and exa through `npm:pi-mcp-adapter`.
The MCP adapter reads `REF_API_KEY` and `EXA_API_KEY` from the environment.
Astra uses Pi's built-in `openai-codex` catalog in Pi 0.85.1 and newer.

`stow/pi/.pi/agent/extensions/request-logger.ts` is an opt-in request logger.
Run `pi-log` to enable it for one process.
Captured requests are machine-local state under `~/.pi/agent/logs/requests/`.

#### OpenCode

`scripts/bootstrap.sh` installs OpenCode 2.
The `opencode` Stow package owns server configuration, CLI settings, commands, global instructions, and plugins under `stow/opencode/.config/opencode/`.

OpenCode plugins are separate harness adapters with separate owners:

- `plugins/typesafe-ai/` exposes TypeSafe Jev.
- `plugins/tui-conveniences/` adds `/copy-all`, confirms successful skill loads, and shows the Git status footer.

OpenCode discovers the shared catalog under `~/.agents/skills/` as native skills.
OpenCode 2 does not derive slash entries from skills, so each skill also has a thin wrapper command under `stow/opencode/.config/opencode/commands/<skill-id>.md` that loads it through `/skill-id`, and the TUI conveniences plugin confirms native skill activation with a success toast.
The separate `stow/opencode/.config/opencode/commands/` directory is reserved for prompt macros such as `/lg` and the `/rp*` RepoPrompt commands.

#### Claude Code

The `claude` Stow package owns `settings.json`, `settings.local.json`, `statusline.sh`, hooks, and the opt-in request logger under `stow/claude/.claude/`.
Claude Code reads project `AGENTS.md` files directly.
It does not need a tracked `CLAUDE.md` pointer.

The status line shows the working directory, Git branch, active model, and context-window usage.
It turns yellow at 75 percent and red at 90 percent.
It uses `jq` and shows a short notice if `jq` is not available.
`CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` is `95`, so this status line provides the earlier warning.

Claude Code uses the native installer's latest release channel with automatic updates.
Commit and pull request attribution are disabled.
Run `claude-log` to enable the tracked request logger for one process.
Captured requests are machine-local state under `~/.claude/logs/requests/`.

Claude Code MCP servers are user-scoped in `~/.claude.json`.
This file is machine-local state and is not managed by Stow.

#### Codex

The `codex` Stow package owns personal defaults, MCP server definitions, hooks, and the Tokyo Night theme under `stow/codex/.codex/`.
The MCP configuration reads `REF_API_KEY` and `EXA_API_KEY` through `env_http_headers`.
Authentication, sessions, logs, plugin caches, and other runtime data are machine-local state under `~/.codex/`.

#### Guardrails and secrets

Claude Code and Codex use the shared guardrail scripts under `stow/bin/.local/share/agent-guardrails/`.
These scripts block dangerous shell commands and edits to generated files.

Keep credentials in machine-local state.
Do not copy live MCP URLs, API keys, tokens, auth files, sessions, logs, or telemetry into tracked sources.
Use environment interpolation for secrets when the harness supports it.

A new machine can apply the tracked skill snapshot with `./scripts/stow.sh apply`.
Bootstrap does not need to fetch the upstream skill catalogs.

### Karabiner Status

Karabiner is deprecated in this repo and no longer installed by `scripts/bootstrap.sh`/`Brewfile`.
Existing configs have been moved to `old/karabiner/` for historical reference.

## Development Environment

### Primary Tools

| Tool | Purpose |
|------|---------|
| **Neovim** | Primary editor (lazy.nvim) |
| **OpenCode** | AI-assisted coding CLI |
| **Ghostty** | Terminal emulator |
| **Herdr** | Agent-aware terminal workspace manager |

### Neovim Plugins

| Plugin | Purpose |
|--------|---------|
| snacks.nvim | Modern QoL plugins (replaces telescope, alpha, indent-blankline, nvim-surround, Comment.nvim) |
| neo-tree | File explorer |
| blink.cmp | High-performance autocompletion (Rust-based fuzzy matching) |
| flash.nvim | Motion/jump plugin (character, word, line jumps) |
| mason + lspconfig | LSP support |
| treesitter | Syntax highlighting + parser management |
| treesitter-context | Sticky one-line code context |
| noice.nvim | Command-line, message, and LSP UI |
| gitsigns | Git integration |
| diffview.nvim | Git diff review and file history UI |
| nvim-spectre | Project-wide search and replace panel |
| lualine | Status line |
| bufferline | Buffer tabs |
| vim-test | Test runner using Neovim terminal splits |

**Key plugins explained:**
- **snacks.nvim**: Collection of 15+ QoL plugins including `picker` (fuzzy finder), `dashboard` (startup screen), `lazygit`, `notifier`, `bufdelete`, `indent` (guides), `scope` (text objects), `scratch` (buffers), `words` (LSP navigation), `explorer`, `git`, `zen`, `toggle`, and more
- **blink.cmp**: Rust-based completion engine with 0.5-4ms response time, typo-resistant fuzzy matching, and native LuaSnip support
- **flash.nvim**: Fast motion plugin under the `<leader>j` group for jumping to characters (`<leader>jj`), words (`<leader>jw`), and lines (`<leader>jl`)

### LSP Servers (auto-installed via Mason)

- `lua_ls` - Lua
- `ts_ls` - TypeScript/JavaScript
- `gopls` - Go
- `clangd` - C/C++
- `ty` - Python (Beta type checker from Astral)

### Ruby on Rails in Neovim

- Ruby LSP provides completion, navigation, and project-configured RuboCop diagnostics and formatting.
- Ruby LSP is enabled outside Mason, and a separate RuboCop LSP is excluded to avoid duplicate diagnostics.
- Ruby and ERB use two-space indentation, with project EditorConfig settings taking precedence.
- Treesitter installs `ruby` and `embedded_template` alongside HTML and CSS.
- Ruby formats through Ruby LSP on save, while ERB uses the project's `bundle exec erb-format` through Conform.
- Existing vim-test mappings support the app's test runner: `<leader>tt` for nearest, `<leader>tf` for file, and `<leader>ts` for suite.

Bash puts Homebrew Ruby and Bundler ahead of inherited rbenv shims.
After changing shell paths, open a new terminal or run `exec /opt/homebrew/bin/bash --login` before launching Neovim.
From the Rails app directory, confirm that this Ruby matches the app's required version, then install Ruby LSP:

```bash
ruby --version
gem install ruby-lsp --bindir "$HOME/.local/bin" --no-document
```

Launch Neovim from that environment.
If a project requires another Ruby version, explicitly activate a version manager with that version installed rather than mixing its Bundler shim with Homebrew Ruby.
If Ruby LSP was previously installed through Mason, uninstall `ruby-lsp` there so its executable does not shadow your version-manager shim.
Ruby LSP automatically includes its Rails add-on when it detects a Rails app.
Do not add a separate Rails add-on dependency just for this configuration.

Keep the app's existing RuboCop rules.
For apps using Rails defaults, `rubocop-rails-omakase` supplies DHH's preferred style through `.rubocop.yml`.
Do not replace an existing team's style configuration.
For ERB formatting, add `erb-formatter` to the app's development bundle if it is not already present:

```bash
bundle add erb-formatter --group development --require=false
bundle exec erb-format --help
```

Restart Neovim and open a Ruby file to check `:LspInfo`, or an ERB file to check `:ConformInfo`.
Format-on-save allows three seconds for Ruby/ERB tooling, while other languages retain the 500 ms timeout.
Rails-specific navigation plugins such as `vim-rails` are optional and are not installed.

References: [Ruby LSP editor setup](https://shopify.github.io/ruby-lsp/editors.html), [Rails add-on](https://github.com/Shopify/ruby-lsp-rails), and [Rails Omakase style](https://github.com/rails/rubocop-rails-omakase).

### Neovim Editing Defaults

- Per-language indentation now lives in `stow/nvim/.config/nvim/ftplugin/*.lua` for simpler ownership and less global autocmd logic
- Go uses real tabs; Python, JavaScript, and TypeScript stay space-based
- Incremental search and autoread are enabled for faster search feedback and cleaner external file reloads
- Visible whitespace (`listchars`) and an 80-column guide (`colorcolumn`) are enabled globally

## Keybindings

### Neovim

Tiny which-key guide: `<leader>g` Git, `<leader>s` Search, `<leader>t` Test, `<leader>j` Jump, `<leader>u` Toggle.

VSpaceCode-style aliases are also available: `<leader>f` File, `<leader>b` Buffer, `<leader>p` Project, `<leader>w` Window, `<leader>q` Quit/Session, and `,` Major Mode.

| Keys | Action |
|------|--------|
| `Space` | Leader key |
| `jk` (insert) | Escape to Normal |
| `%%` (command) | Insert current file directory |
| `<C-n>` | Toggle neo-tree |
| `<leader>h` | Clear search highlight |
| **VSpaceCode-style File/Project** ||
| `<leader>ff` / `<leader>pf` | Find files / project files |
| `<leader>fr` / `<leader>pp` | Recent files |
| `<leader>fs` / `<leader>fS` | Save file / save all |
| `<leader>ft` / `<leader>pt` | File/project tree |
| `<leader>fT` | Reveal current file in tree |
| `<leader>fy` | Copy current file path |
| `<leader>fe` | Edit Neovim config |
| **VSpaceCode-style Buffer/Window** ||
| `<leader>bb` | Buffer picker |
| `<leader>bn` / `<leader>bN` | Next / previous buffer |
| `<leader>bu` | Alternate buffer |
| `<leader>wh/j/k/l` | Move between windows |
| `<leader>w/` / `<leader>w-` | Split right / below |
| `<leader>wd` / `<leader>w=` | Close / balance windows |
| `<leader>qq` / `<leader>qf` / `<leader>qr` | Quit all / close window / reload config |
| **Major Mode `,`** ||
| `,f` | Format buffer |
| `,t` / `,T` | Test nearest / test file |
| `,r` / `,a` | Rename symbol / code action |
| `,d` / `,s` | Line diagnostics / document symbols |
| **snacks.picker (Search)** ||
| `<C-p>` / `<leader>sf` | Find files |
| `<leader>sg` | Grep |
| `<leader>sb` | Buffers |
| `<leader>sr` | Recent files |
| `<leader>sh` | Help pages |
| `<leader>sk` | Keymaps |
| `<leader>sc` | Colorschemes |
| `<leader>sn` | Notification history |
| `<leader><space>` | Smart find files |
| `<leader>ss` | LSP symbols |
| `<leader>sS` | LSP workspace symbols |
| `<leader>sd` | Diagnostics |
| `<leader>sj` | Document symbols (VSpaceCode alias) |
| `<leader>sJ` | Jumps |
| `<leader>sm` | Marks |
| `<leader>sq` | Quickfix list |
| `<leader>su` | Undo history |
| `<leader>sR` | Spectre: replace in project |
| `<leader>sw` / visual `<leader>sw` | Spectre: search current word / selection |
| `<leader>sW` | Spectre: search current file |
| `gd` / `gr` / `gI` / `gy` | LSP: definition / references / implementation / type definition |
| **flash.nvim (Jump)** ||
| `<leader>jj` | Jump to character |
| `<leader>jw` | Jump to word |
| `<leader>jl` | Jump to line |
| **snacks (Utilities)** ||
| `<leader>bd` | Delete buffer |
| `<leader>e` | File explorer |
| `<leader>gg` | Lazygit |
| `<leader>z` | Zen mode |
| `<leader>.` | Toggle scratch buffer |
| `<leader>S` | Select scratch buffer |
| `<leader>cR` | Rename file |
| `]]` / `[[` | Next/prev LSP reference |
| **snacks (Git)** ||
| `<leader>gb` | Git branches |
| `<leader>gl` | Git log |
| `<leader>gs` | Git status |
| `<leader>gB` | Git browse (opens in browser) |
| **Navigation** ||
| `<C-h/j/k/l>` | Navigate Neovim windows |
| `<S-h>` / `<S-l>` | Previous/next buffer |
| **LSP** ||
| `K` | LSP: hover documentation |
| `<leader>rn` / `<leader>ca` | LSP: rename / code action |
| `<leader>lf` | Format file |
| `gl` / `[d` / `]d` | Diagnostics: float / prev / next |
| **Testing & Git** ||
| `<leader>tt` / `<leader>tf` / `<leader>ts` | Test: nearest / file / suite |
| `<leader>gp` / `<leader>gt` | Git: preview hunk / toggle blame |
| `<leader>gd` | Git: picker diff |
| `<leader>gD` / `<leader>gC` | Diffview: open / close |
| `<leader>gh` / `<leader>gH` | Diffview: file history (current/repo) |
| `]h` / `[h` | Git: next/prev hunk |
| **Markdown** ||
| `<leader>mp` / `,p` | Preview current Markdown file with `glow` |

Snacks file discovery includes hidden and ignored files by default, so local-only files such as `override.yml` still appear in `<C-p>`, `<leader>sf`, `<leader><space>`, `<leader>sg`, and the file explorer.

### Debugging

Use a terminal-first debugging flow instead of an in-editor DAP stack.

- Go: use `dlv debug`, `dlv test`, or `dlv attach` directly in a Herdr pane
- Python: use `python -m debugpy --listen localhost:5678 ...` when you need an attachable debugger
- Day to day: prefer tests, logs, and targeted print statements for fast iteration

### Herdr

Herdr runs inside Ghostty and organizes projects as workspaces, layouts as tabs, and terminals as panes. The persistent server keeps shells and agents alive after detaching.

| Keys | Action |
|------|--------|
| `C-a` | Prefix |
| `C-a r` | Reload Herdr config |
| `C-a q` | Detach while keeping panes running |
| `C-a s` / `C-a w` | Workspace picker |
| `C-a Shift-n` / `C-a $` / `C-a d` | Create / rename / close workspace |
| `C-a (` / `C-a )` | Previous / next workspace |
| `C-a c` | Create tab |
| `C-a p` / `C-a n` | Previous / next tab |
| `C-a 1..9` | Select tab |
| `C-a "` / `C-a %` | Split down / right |
| `C-a h/j/k/l` | Navigate Herdr panes |
| `C-a o` | Cycle panes |
| `C-a z` / `C-a x` | Zoom / close pane |
| `C-a [` | Copy mode |
| `C-a Shift-r` | Resize mode |

CLI cheat sheet:

| Task | Command |
|------|---------|
| Start Herdr | `herdr` |
| Show keyboard help | `C-a ?` |
| Show CLI help | `herdr --help` |
| List workspaces, tabs, or panes | `herdr workspace list`, `herdr tab list`, `herdr pane list` |
| Create a workspace | `herdr workspace create --cwd /path/to/project --label project` |
| Create a tab | `herdr tab create --workspace <workspace-id> --label logs` |
| Split the current pane | `herdr pane split --current --direction right` |
| Run a command in a pane | `herdr pane run <pane-id> "npm test"` |
| Read recent pane output | `herdr pane read <pane-id> --source recent-unwrapped --lines 100` |
| List managed agents | `herdr agent list` |
| Reload configuration | `herdr server reload-config` |
| Check agent integrations | `herdr integration status` |

Use `herdr <resource> --help`, such as `herdr pane --help`, for the complete command reference.

The active config is `stow/herdr/.config/herdr/config.toml` and uses its built-in Tokyo Night theme with Bash as the pane shell. `C-a s` replaces the former tmux-sessionizer workflow with Herdr's workspace picker.

Install agent integrations once per machine:

```bash
herdr integration install pi
herdr integration install codex
herdr integration install opencode
herdr integration install claude
herdr integration status
```

Generated integration files remain machine-managed. The shared `herdr` skill teaches Pi, Claude, Codex, and OpenCode to coordinate workspaces, tabs, panes, and sibling agents through the Herdr CLI.

## Shell Configuration

Bash stores interactive history in `~/.bash_history`. FZF provides fuzzy completion and history/file keybindings; GNU Readline uses the tracked `.inputrc`; Starship renders the prompt; zoxide handles directory jumping; and mise activates project runtime versions and environments. Generated initialization scripts for FZF, Starship, Zoxide, and mise are cached under `${XDG_CACHE_HOME:-~/.cache}/bash/init/` and regenerated after their executables change.

Cursor and Zed are intentionally archived under `old/cursor/current-archive/` and `old/zed/`. They are not Stow packages and are not restored or rethemed by this migration.

## File Structure

```
dotfiles/
├── scripts/                # Bootstrap, backup, and Stow wrappers
│   ├── bootstrap.sh        # Full machine bootstrap for non-Stow setup
│   ├── backup.sh           # Backup current machine config into repo
│   ├── stow.sh             # Apply/delete/dry-run GNU Stow packages
│   └── validate-dotfiles.sh # Isolated preflight before live Stow apply
├── mcp_setup.sh            # MCP config backup/install
├── Brewfile                # Homebrew packages
├── npm-global-packages.txt # Global npm packages
├── CHANGELOG.md            # Change history
├── stow/                   # GNU Stow packages, each mirroring $HOME
│   ├── bash/               # Bash, Readline, FZF integration, Starship, functions
│   ├── git/                # .gitconfig, .gitignore_global
│   ├── ghostty/            # .config/ghostty/config
│   ├── herdr/              # .config/herdr/config.toml
│   ├── bin/                # .local/bin tools and shared agent guardrail scripts
│   ├── opencode/           # .config/opencode/: V2 config, CLI settings, commands, rules, plugins
│   ├── agents/             # Shared Agent Skills catalog used by Pi, OpenCode, and Claude Code
│   ├── claude/             # .claude/: settings, statusline, hooks, request logger
│   ├── codex/              # .codex/: config, hooks, themes
│   ├── pi/                 # .pi/agent/: settings, MCP, prompts, themes, extensions
│   └── nvim/               # .config/nvim (lazy.nvim + Tokyo Night)
│       └── .config/nvim/
│           ├── init.lua
│           ├── lazy-lock.json
│           ├── ftplugin/
│           └── lua/plugins/
├── old/tmux/                # Archived tmux config and tmux-sessionizer
├── old/karabiner/           # Deprecated keyboard remapping archive
├── mcp/                    # MCP configs for AI tools
└── old/                    # Archived/deprecated configs
```

## Neovim Plugin Safety Harness

Use this before and after plugin edits to catch startup regressions without touching your live `~/.config/nvim`.

```bash
# Full safety pass with an isolated profile and one-by-one plugin rollout
bash test/nvim_plugin_safety.sh --base-ref HEAD
```

What it enforces:
- no explicit lockfile-changing lazy commands (`sync`/`update`/`restore`) inside the harness
- `stow/nvim/.config/nvim/lazy-lock.json` checksum must stay unchanged unless `--allow-lockfile-change` is explicitly passed
- isolated startup checks in a throwaway XDG profile
- one-by-one rollout for changed plugin files under `stow/nvim/.config/nvim/lua/plugins/*.lua`
- guardrails against known `background`/`OptionSet` loop traps
- high-risk plugin lazy-loading checks (`noice.lua`)

## Backup Your Current Mac

```bash
cd ~/dotfiles

# Backup shell configs and Brewfile
./scripts/backup.sh

# Backup MCP configs
./mcp_setup.sh backup

# Commit and push
git add -A
git commit -m "Backup configs"
git push
```

## Recent Neovim Incident Log (Feb 2026)

- Plugin update happened during aesthetic changes and introduced startup instability.
- `opencode.nvim` changed API (`provider` removed), which caused blocking startup prompts.
- Background toggle/autocmd interactions (`OptionSet background`) created startup loop risk in some plugin combinations.
- Markdown crashes were traced to stale parser artifacts under `~/.local/share/nvim/site/parser` named `markdown.so.disabled` and `markdown_inline.so.disabled`.
  - Even with `.disabled` suffix, Neovim runtime parser discovery still picked them up.
  - macOS killed Neovim with `CODESIGNING Invalid Page` while loading parser via `uv_dlopen`.
- Recovery that restored stability:
  - removed stale parser artifacts from runtime path
  - rolled back recent visual plugins
  - kept only `noice.nvim` from recent additions
  - retained the safety harness (`test/nvim_plugin_safety.sh`) for one-by-one rollout checks
- Post-recovery history: switched theme from Nord to Catppuccin Macchiato across Neovim, Ghostty, and tmux, then later returned the active stack to Tokyo Night. Added `flash.nvim` for motion/jump support.

## Troubleshooting

**Stow says `WARNING! stowing ... would cause conflicts`**
- A real file already exists at the target path, for example `~/.bashrc` or `~/.config/nvim`.
- If you trust the repo version, move the existing file aside and restow:

```bash
mv ~/.bashrc ~/.bashrc.backup.$(date +%Y%m%d%H%M%S)
stow --no-folding -R -v -t "$HOME" -d ~/dotfiles/stow bash
```

For a full migration, prefer `./scripts/bootstrap.sh`; it backs up known target paths before stowing.

**A Stow symlink points to the wrong place**
- Check the symlink target:

```bash
readlink ~/.bashrc
readlink ~/.config/nvim
```

- Recreate links from the repo:

```bash
cd ~/dotfiles
stow --no-folding -R -v -t "$HOME" -d stow bash nvim
```

**I edited `~/.config/nvim`, but Git does not show changes**
- Confirm `~/.config/nvim` is a symlink into this repo:

```bash
readlink ~/.config/nvim
```

- If it is not linked into `~/dotfiles/stow/nvim`, restow it:

```bash
cd ~/dotfiles
mv ~/.config/nvim ~/.config/nvim.backup.$(date +%Y%m%d%H%M%S)
stow --no-folding -R -v -t "$HOME" -d stow nvim
```

**`stow: command not found`**
- Install it with Homebrew or run the full installer:

```bash
brew install stow
# or
cd ~/dotfiles && ./scripts/bootstrap.sh
```

**Need to undo the Stow migration temporarily?**
- Unstow packages, then restore a backup if needed:

```bash
cd ~/dotfiles
stow --no-folding -D -v -t "$HOME" -d stow bash git ghostty herdr nvim bin opencode claude pi
```

Backups created by the installer use the suffix `.backup.YYYYMMDDhhmmss`.

**Neovim LSP not working?**
- Requires Neovim >= 0.11.0 for mason-lspconfig v2
- Run `:Mason` to check installed servers
- Run `:LspInfo` to verify attachment

**Treesitter parsers not compiling?**
- Requires `tree-sitter-cli` >= 0.26.1 for nvim-treesitter `main` branch
- Run `:checkhealth nvim-treesitter` to verify CLI is found
- Install via: `npm install -g tree-sitter-cli`

**Markdown preview with glow not working?**
- Ensure `glow` is installed: `brew install glow`
- Save the Markdown file before previewing; the keymap previews the current file path
- Use `<leader>mp` or `,p` inside a Markdown buffer

**Markdown files crash Neovim with `CODESIGNING Invalid Page`?**
- Check for stale parser files in `~/.local/share/nvim/site/parser`:
  - `markdown.so.disabled`
  - `markdown_inline.so.disabled`
- Move those files out of parser runtime path (for example to `/tmp`) and retry.
- Confirm active runtime parser paths with:
  - `nvim --noplugin --headless "+lua for _,f in ipairs(vim.api.nvim_get_runtime_file('parser/markdown*', true)) do print(f) end" +qa`

**Seeing `module 'nvim-treesitter.configs' not found`?**
- This usually means old treesitter `master`-style config is mixed with `main`-branch plugin files
- Re-stow your dotfiles Neovim config and rerun setup: `./scripts/bootstrap.sh`
- The setup script runs headless `Lazy! restore` to install plugin files from `lazy-lock.json`

**Prompt is plain or Bash highlighting is missing after an update?**
- Check `brew list --versions bash starship zoxide fzf mise` and run `brew bundle --file=~/dotfiles/Brewfile` for anything missing.
- Reapply the Bash package with `./scripts/stow.sh apply`, then run `exec /opt/homebrew/bin/bash --login`.
- Verify `fzf` is available and `~/.config/starship.toml` exists.
- Private-use prompt glyphs use Ghostty's built-in `Symbols Nerd Font` fallback; see `plans/theme-font-glyph-followups.md`.

**Herdr config not loading?**
- Confirm `~/.config/herdr/config.toml` points into `stow/herdr/` with `readlink ~/.config/herdr/config.toml`.
- Reapply the Stow profile with `./scripts/stow.sh apply`, then run `herdr server reload-config`.
- Herdr keeps the previous keymap if keybindings are invalid. Check `~/.config/herdr/herdr-server.log` for startup or reload warnings.

**Herdr agent state is missing or stale?**
- Run `herdr integration status`.
- Reinstall the affected integration with `herdr integration install pi`, `codex`, `opencode`, or `claude`.
- Generated integration files are machine-managed and should not be copied into Stow.

**Herdr and Neovim navigation**
- Bare `C-h/j/k/l` navigate Neovim windows, including moving between Neo-tree and editor splits.
- Use prefixed `C-a h/j/k/l` to navigate Herdr panes.

**A project runtime is missing?**
- `scripts/bootstrap.sh` installs Node.js from `Brewfile` and activates mise in interactive Bash sessions.
- Add the project runtime with `mise use`, then open a new shell or run `mise install`.

**Terminal debugging workflow**
- Go: run `dlv debug` or `dlv test` in a Herdr pane
- Python: run `python -m debugpy --listen localhost:5678 --wait-for-client myfile.py`
- Prefer tests and print/log debugging first; reach for `dlv` or `debugpy` when the bug is stubborn

## Zoxide

Zoxide is installed from `Brewfile` and initialized for interactive Bash sessions. Use `z dotfiles` to jump to frequently used directories.
