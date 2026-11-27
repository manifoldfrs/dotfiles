# dotfiles

My macOS and Ubuntu (`agentbox`) development setup, managed with [GNU Stow](https://www.gnu.org/software/stow/).
Each folder under `stow/` is a package that mirrors `$HOME`, so `stow/nvim/.config/nvim/init.lua` links to `~/.config/nvim/init.lua`.

[![Test Dotfiles](https://github.com/manifoldfrs/dotfiles/actions/workflows/test.yml/badge.svg)](https://github.com/manifoldfrs/dotfiles/actions/workflows/test.yml)

## Documentation map

| Guide | What it covers |
| --- | --- |
| [docs/macos-preferences.md](docs/macos-preferences.md) | Personal macOS settings and Mac App Store utilities to restore on a new Mac. |
| [docs/rex.md](docs/rex.md) | Rex keybindings, app settings, `agentbox` remote server, `agentbox-auth`, iOS setup, and beta gaps. |
| [docs/agents.md](docs/agents.md) | Codex, Council, Claude Code, Antigravity, shared rules and skills, and guardrails. |
| [docs/skills.md](docs/skills.md) | Generated catalog of shared agent skills and ownership. |
| [mcp/README.md](mcp/README.md) | Shared MCP servers, Codex-owned Jev and X search, harness sync, Claude Code import, and API keys. |
| [CONTEXT.md](CONTEXT.md) | Glossary for the configuration lifecycle (*tracked source*, *live configuration*, *apply*, *capture*) and agent terms. |
| [AGENTS.md](AGENTS.md) | Repository guide and validation checks for coding agents working in this repo. |

## The stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Terminal + multiplexer | [Rex](https://www.superlogical.com/rex/docs/installation) (beta) | Default on macOS and iOS (Ghostty fallback on Mac) |
| Editor / IDE | Neovim, Cursor | `lazy.nvim` + Lua plugins in `stow/nvim/.config/nvim/`, Cursor user config in `stow/cursor/`, retired Zed archived under `old/` |
| Shell | Fish + FZF + Atuin + zoxide | Interactive Bash login starts Fish; Bash still runs scripts and agent commands |
| Primary agent harness | Codex | Owns global rules and guardrail hooks in `stow/codex/.codex/` and shared skills in `stow/codex/skills/shared/` |
| Council reviewers | Codex CLI, Claude Code, Antigravity CLI | Codex runs each model through its own command-line tool |

Rex, Neovim, Codex, Claude Code and Antigravity CLI use **Heliotrope Haze** colors.
Antigravity CLI inherits the Rex palette with its **Terminal** color scheme.
The terminal font is **MonoLisaCode 14 pt** where the app allows it.
Rex is the exception because its theme and font live in app settings rather than `init.lua` (see [docs/rex.md](docs/rex.md#app-settings-one-time-per-machine)).

## Quick start

### New Mac

1. Install [Rex](https://www.superlogical.com/rex/docs/installation) from its DMG first (it self-updates outside Homebrew) so bootstrap can run `rex skill setup --agent codex --agent claude --session-naming` automatically.
2. Clone to `~/code/personal/dotfiles` (use the HTTPS URL on a fresh Mac before GitHub SSH keys are set up, or `git@github.com:manifoldfrs/dotfiles.git` once SSH is configured) and run bootstrap:

```bash
git clone https://github.com/manifoldfrs/dotfiles.git ~/code/personal/dotfiles
cd ~/code/personal/dotfiles
./scripts/bootstrap.sh
```

What `bootstrap.sh` does:

- Installs Homebrew, `Brewfile` packages/casks (including `pnpm`), global npm packages, the `anti-slop` runtime, and Plannotator.
- Installs Claude Code with its native installer.
- Backs up conflicting live files (`.backup.YYYYMMDDhhmmss`) and applies all Stow packages.
- Registers Claude Code's MCP servers, installs the Herdr annotation plugin used by Rex, restores Neovim plugins from `lazy-lock.json`, and runs `rex skill setup --agent codex --agent claude --session-naming` when Rex is present.

Remaining one-time steps on a new Mac:

1. Quit Rex and run `./scripts/rex_prefs.sh load` to restore tracked app settings (see [docs/rex.md](docs/rex.md#local-setup)); if you installed Rex after running `bootstrap.sh`, then reopen Rex in a Bash login pane and run `rex skill setup --agent codex --agent claude --session-naming`.
2. Put machine-local API keys in `~/.config/bash/local.bash` (never tracked) so the next login shell loads them:

```bash
export REF_API_KEY="..."
export EXA_API_KEY="..."
export TYPESAFE_API_KEY="..."
```

3. Open a new Bash login pane, sign in to Codex, Claude Code, and Antigravity, and review the Codex hooks with `/hooks`.
4. Restore personal system preferences from the [macOS preferences checklist](docs/macos-preferences.md).

### `agentbox` (Ubuntu)

Do not run the macOS `scripts/bootstrap.sh` on `agentbox`.
Instead, install Stow's prerequisites as `root`, then clone and apply as `frshbb`:

1. As `root`, ensure the preflight tools are installed (`apt update && apt install -y git stow jq ripgrep`); if you will install Linuxbrew in Phase 5, also complete the build prerequisites and `/home/linuxbrew` prefix setup in [Phase 2](docs/plans/remote-agent-server.md#phase-2-base-server-setup).
2. As `frshbb`, clone to `~/code/personal/dotfiles` (keep this exact path so `CLAUDE_CODE_PLUGIN_DIRS` and the root `rex_server_setup.sh` commands in `docs/rex.md` resolve) and apply with Stow:

```bash
git clone https://github.com/manifoldfrs/dotfiles.git ~/code/personal/dotfiles
cd ~/code/personal/dotfiles
./scripts/stow.sh dry-run   # previews raw Stow conflicts; apply auto-backs up default ~/.bashrc and managed harness files
./scripts/stow.sh apply
```

`dry-run` runs plain `stow -n`, so it may flag files like Ubuntu's default `~/.bashrc` that `apply` backs up automatically.

3. Create machine-local `~/.config/bash/local.bash` with your API keys (same exports as macOS), then open a new login shell (`exec bash --login`).

How `scripts/stow.sh` adapts automatically on Linux:

- Keeps Codex's config machine-local, the same as on macOS.
  On first setup, `apply` seeds a missing `~/.codex/config.toml` with GPT-6.2 Sol at medium reasoning.
  It converts legacy Stow links to local copies and still links `AGENTS.md`, skills, hooks, and themes.
- Creates `~/.local/bin/bash` pointing to `/bin/bash` (instead of Homebrew Bash 4+ on macOS) for scripts that use the local Bash link.

After applying dotfiles as `frshbb`, follow [docs/plans/remote-agent-server.md](docs/plans/remote-agent-server.md#phase-5-toolchain-on-the-server) (Phases 5–8; skip Phase 6's clone and Stow steps, which you just did) for Linuxbrew, the server toolchain, and harness installs (run `brew install fish` as `frshbb` after Phase 5 if desired), and see [docs/rex.md](docs/rex.md#remote-server-on-agentbox) for the root Rex login server setup and `agentbox-auth` sign-in flow.

### Day-to-day updates

Standalone `./scripts/stow.sh apply` requires `stow` and `jq`.
On macOS, Homebrew `bash` (`brew install bash`) is also needed so `~/.local/bin/bash` links to Bash 4+ for agent and shell scripts (otherwise `apply` warns and skips the link).

```bash
cd ~/code/personal/dotfiles
git pull
./scripts/stow.sh dry-run   # preview changes (also the default with no argument)
./scripts/stow.sh apply     # validates in an isolated temporary home first, then restows into $HOME
```

`apply` runs `scripts/validate-dotfiles.sh` against a temporary home before touching `$HOME`; if validation fails, nothing changes.
It also moves known conflicting files (Bash, Codex, Claude Code, Cursor, and shared skill folders) aside as `.backup.YYYYMMDDhhmmss` and restores them if Stow fails.
`dry-run` runs plain `stow -n` without those backups, so it may flag auto-backed-up files alongside unexpected conflicts; only conflicts outside the auto-backup list need manual moves (see [Troubleshooting](#troubleshooting)).
Use `./scripts/stow.sh delete` to remove managed symlinks, and `./scripts/bootstrap.sh` only on macOS when you want packages, plugins, and tooling refreshed.

The default `STOW_PACKAGES` list in `scripts/stow.sh` is `bash git ghostty rex nvim bin antigravity claude codex cursor`.

To restow a single simple leaf package (`nvim`, `git`, `ghostty`, or `rex`) by hand:

```bash
stow --no-folding -R -v -t "$HOME" -d stow nvim
```

Use `./scripts/stow.sh apply` for `codex` and `bash` so local Codex config setup, shared skills, and `~/.local/bin/bash` are handled.

Because Stow uses symlinks, editing either `$HOME` or the repo edits the same file.
To capture live config back into tracked sources, run `./scripts/backup.sh` and review `git diff` before committing (agent account and runtime state are skipped).

## Repository layout

```text
stow/                     Stow packages, each mirroring $HOME
  bash/                   Bash and Fish startup, Readline (.inputrc), Atuin, functions, aliases
  git/                    .gitconfig and global gitignore
  rex/                    Rex init.lua and required Lua modules
  ghostty/                Fallback terminal config
  nvim/                   Neovim config (see stow/nvim/AGENTS.md)
  bin/                    ~/.local/bin helpers (anti-slop, artifact-review, rex-annotate, agentbox-auth, spotify-visualizer)
  codex/                  Primary harness config, theme, global AGENTS.md, hooks, and shared skills
  claude/                 Standalone Claude Code settings and mods; links rules and hooks to codex/
  antigravity/            Antigravity PreToolUse guardrail hooks adapter; links shared scripts to codex/
  cursor/                 Cursor settings, keybindings, tasks (Library/Application Support/Cursor/User)
cursor/extensions.txt     Cursor extension IDs; install with the app's bundled CLI
scripts/
  bootstrap.sh            Full machine setup
  stow.sh                 apply / dry-run / delete with isolated preflight
  validate-dotfiles.sh    Isolated validation without live changes
  backup.sh               Capture live config into tracked sources
  update_agent_skills.sh  Check or sync the shared skill catalog
  skill_catalog.sh        Generate docs/skills.md
  harness_sync.sh         Generate Codex MCP registrations and the Claude Jev mod copy
  rex_server_setup.sh     Root-only Rex login server setup for agentbox
  rex_prefs.sh            Save, load, or watch Rex app settings
rex/                      Tracked Rex app settings (not stowed)
server/rex/               Files installed under /etc on agentbox (not stowed)
mcp/                      MCP setup guide (see mcp/README.md)
test/                     Shell and TypeScript tests, Docker harness
docs/                     Deep-dive guides (rex.md, agents.md, skills.md), plans, and research notes
old/                      Archived Fish, Zsh, tmux, Karabiner, Zed, and older Cursor config
Brewfile                  Homebrew packages and casks
npm-global-packages.txt   Global npm packages (@openai/codex, vercel, tree-sitter-cli, agent-browser)
```

## Core tools

### Rex and `agentbox`

Rex (`stow/rex/.config/rex/init.lua`) uses `Ctrl-a` as its prefix (`Ctrl-a Ctrl-a` sends a literal `Ctrl-a`) and hands off `Ctrl-h/j/k/l` seamlessly with Neovim via `vim-rex-navigator`.
After applying Stow, verify the config with `rex config reload && rex keymap`.

Daily remote sessions on `agentbox`:

```bash
rexbox                                  # list sessions on agentbox
rexbox opto2 code/optoai/opto2          # open or create opto2 in ~/code/optoai/opto2
rex -S agentbox kill opto2              # end a session
```

See [docs/rex.md](docs/rex.md) for the full keymap table, `rex_prefs.sh` app settings, `agentbox` server setup, `agentbox-auth` sign-ins, iOS setup, troubleshooting, and known beta gaps.

### Neovim

Neovim (>= 0.11) uses one plugin spec per file under `stow/nvim/.config/nvim/lua/plugins/`, pinned in `lazy-lock.json`, with per-language indentation in `ftplugin/*.lua`.
Core plugins: `snacks.nvim` (picker, explorer, dashboard, lazygit), `fff` (`Cmd-P` file finder), `blink.cmp`, `mason` + `lspconfig`, `treesitter`, `flash.nvim`, `gitsigns`, `diffview`, and `nvim-spectre`.
See [stow/nvim/AGENTS.md](stow/nvim/AGENTS.md) for editing conventions.

Leader is `Space` (press `Space` and wait for `which-key`).
Common keymaps:

| Keys | Action |
| --- | --- |
| `<C-p>`, `<leader>sf` | Find files (includes hidden and gitignored files) |
| `<leader>sg` | Grep across project |
| `<C-n>`, `<leader>e` | File explorer |
| `<C-h/j/k/l>` | Move between splits, then Rex/Herdr panes at the edge |
| `gd`, `gr`, `gI`, `gy` | Definition, references, implementation, type definition |
| `K`, `<leader>rn`, `<leader>ca` | Hover, rename, code action |
| `gl`, `[d`, `]d` | Diagnostics float, previous, next |
| `<leader>gg`, `<leader>gD` | Lazygit, Diffview |
| `]h`, `[h` | Next, previous git hunk |
| `<leader>tt`, `<leader>tf`, `<leader>ts` | Test nearest, file, suite |
| `<leader>a` (visual) | Annotate selection (Rex/Herdr) |
| `<leader>uC` | Toggle secret masking for `.env`-style files (display only) |

In Rex, Neovim also supports Cursor-style `Cmd` keys: `Cmd-P` find files, `Cmd-Shift-F` search in files, `Cmd-B` explorer, `Cmd-Shift-O` symbols, `Cmd-S` save, `Cmd-/` comment.

- **LSPs:** Mason installs `lua_ls`, `ts_ls`, `gopls`, `clangd`, and `ty` (Python).
  Install Ruby LSP outside Mason so it uses the project Ruby: `gem install ruby-lsp --bindir "$HOME/.local/bin" --no-document`.
- **TypeScript extras:** `:TSC` populates quickfix, `ts-error-translator` clarifies diagnostics, and `:TwoslashQueriesEnable` shows inline types.
- **Markdown preview:** run `:MarkdownPreview` in a Markdown buffer to open a live preview in your browser.
  Run `:MarkdownPreviewStop` to close it.
- **Debugging:** no in-editor debugger; use tests and logs first, then `dlv` (Go) or `debugpy` (Python) in a terminal pane.
- **Plugin safety check:** run `bash test/nvim_plugin_safety.sh --base-ref HEAD` before changing plugins; it checks startup in an isolated profile without touching live config or `lazy-lock.json`.

### Cursor

The `cursor` Stow package links `settings.json`, `keybindings.json`, and `tasks.json` into `~/Library/Application Support/Cursor/User/`, so UI edits show up in `git diff`.
Extensions live outside the package in `cursor/extensions.txt` so Stow does not link that file into `$HOME`; install them with Cursor's bundled CLI:

```bash
CURSOR_BIN="/Applications/Cursor.app/Contents/Resources/app/bin/cursor"
while IFS= read -r ext; do "$CURSOR_BIN" --install-extension "$ext"; done < cursor/extensions.txt
./scripts/stow.sh apply
```

### Shell

An interactive Bash login loads the shared `PATH` and `~/.config/bash/local.bash`, then launches Fish for completions and suggestions without changing the system login shell.
Scripts and agent shell commands still use Bash; stay in Bash for a pane with `DOTFILES_KEEP_BASH=1 bash --login` (or run `bash` from Fish).

- **Prompt:** Tokyo Night colors, short path, Git branch or detached commit, clock, and non-zero exit code only (no username or hostname).
- **Navigation & history:** `Ctrl-T` opens FZF file search, `Ctrl-R` and `Ctrl-F` search Atuin history in FZF (`Ctrl-D` filters to the current directory), Up Arrow uses native Fish history, and `z` uses zoxide.
- **Wrappers:** `claude` resumes sessions through its Bash wrapper, `agy` passes `--dangerously-skip-permissions` for interactive sessions (unless a subcommand, `--mode`, or `--sandbox` is given), and `rexbox` calls the shared Bash function.
- **Local overrides:** put environment variables in untracked `~/.config/bash/local.bash` and Fish-specific tweaks in `~/.config/fish/conf.d/`.
  On an existing Mac or `agentbox` without Fish, run `brew install fish`, restow, and open a new login pane.

### AI agents

Codex is the primary harness and runs Council reviews through Codex CLI, Claude Code, and Antigravity CLI.
Codex hosts pstack directly through the Open Pstack plugin ([docs/agents.md](docs/agents.md#pstack-in-codex)).
The [pstack PR watcher launcher](docs/agents.md#pstack-in-codex) keeps its dependencies outside the plugin directory.
It pairs GPT-6.2 Sol High and Opus 5.5 High for Arena candidate work, Architect, and Interrogate with read-only Gemini 4 Neon High through Antigravity CLI.
Pstack also uses Gemini 4 Neon High for its `judgment and prose` role in multi-phase planning.
Use [`$bro-neon`](docs/agents.md#shared-skill-catalog) for a paste-ready Antigravity prompt when you want Neon to rewrite a reply.
The tracked macOS Codex config disables routine command approvals and the filesystem sandbox while keeping guardrail hooks enabled.
Codex and Claude Code share the global `AGENTS.md`, shell guardrails, skill catalog, and MCP definitions.
[Antigravity runs Neon through its own CLI](docs/agents.md#harness-roles).

To resume a Codex session from the terminal:

| Command | Behavior |
| --- | --- |
| `codex resume --last` | Resume the most recent interactive session for the current directory. |
| `codex resume --last --all` | Resume the most recent interactive session across directories. |
| `codex resume` | Open the session picker for the current directory. |

Common cross-harness commands:

```bash
codex -a on-request -s workspace-write     # restore Codex approval prompts and workspace sandbox
./scripts/update_agent_skills.sh --check   # check shared skills for upstream drift
./scripts/skill_catalog.sh                 # regenerate docs/skills.md
./scripts/harness_sync.sh                  # sync Codex MCP registrations and the Claude Jev mod
```

See [docs/agents.md](docs/agents.md) for Council setup, Gemini 4 Neon, pstack, PR drafting, extensions/mods, guardrails, and Plannotator.

### Extra tools in `bin/`

- **`artifact-review`:** opens an HTML plan, design comparison, walkthrough, or document for anchored comments that return to Codex. Codex cleans up the temporary workspace when the session ends after queued feedback is handled. See [HTML artifact reviews](docs/agents.md#html-artifact-reviews).
- **`anti-slop`:** runs a vendored Oxlint rule set (see `stow/bin/.local/share/anti-slop/UPSTREAM.md`) against any JS/TS project without per-project setup (`anti-slop .`, `anti-slop --effect .`, `anti-slop --fix .`).
  Validate with `bash test/global_anti_slop_test.sh`.
- **`rex-annotate`:** backs Rex's `Ctrl-a a/A/m` annotation keys using Herdr's `herdr-annotate`.
- **`spotify-visualizer`:** terminal dot-matrix visualizer for the current Spotify track.
  Requires a Spotify developer app with redirect URI `http://127.0.0.1:8974/callback` and `SPOTIFY_CLIENT_ID` exported (tokens cache in `~/.cache/dotfiles/spotify-visualizer/`).
  Keys: `Space` play/pause, `n`/`p` next/previous, `s` shuffle, `r` repeat, `q` quit.

### Ghostty fallback

- **Ghostty (`stow/ghostty/`):** fallback terminal (source of Rex's imported theme).
  `Shift-Cmd-click` opens links even when an app captures the mouse.

## Validation

```bash
./scripts/validate-dotfiles.sh                                           # full isolated preflight, no live changes
for f in scripts/*.sh stow/bash/.bashrc; do bash -n "$f"; done           # shell syntax spot check
bash test/run_tests.sh                                                   # shell test suite
bash test/nvim_plugin_safety.sh --base-ref HEAD                          # isolated Neovim plugin check
docker build -t dotfiles-test -f test/Dockerfile . && docker run --rm dotfiles-test
```

For Neovim startup changes, use the [isolated startup check](.github/workflows/test.yml) in CI.
It checks the theme and fails the run on startup errors.
See [AGENTS.md](AGENTS.md) for validation requirements.

## Troubleshooting

- **Stow reports conflicts:** `./scripts/stow.sh apply` auto-backs up known managed targets, while unexpected conflicts (such as `~/.config/nvim`, `~/.gitconfig`, `~/.gitignore_global`, `~/.config/ghostty/config`, `~/.config/rex/*`, or a regular file or directory at `~/.local/bin/bash`) must be moved aside manually.
  Use `./scripts/stow.sh dry-run` to inspect Stow file conflicts (conflicts on targets `apply` backs up automatically can be disregarded) and the `./scripts/stow.sh apply` error for wrapper-only checks such as `~/.local/bin/bash`.
  Check a file (not an ordinary parent directory, because `--no-folding` creates real directories) with e.g. `readlink ~/.config/nvim/init.lua`, move aside only the exact conflicting path named in the error (including an unmanaged symlink itself rather than its target) with `.backup.$(date +%Y%m%d%H%M%S)`, and re-run `./scripts/stow.sh apply`.
- **Edits to `~/.config/...` do not appear in `git diff`:** run `readlink` on the specific file (for example, `readlink ~/.config/nvim/init.lua`); if it does not point into this repo, re-run `./scripts/stow.sh apply`.
- **Neovim LSP or treesitter errors:** verify Neovim >= 0.11 and `tree-sitter-cli` >= 0.26.1, then run `:Mason`, `:LspInfo`, and `:checkhealth nvim-treesitter`.
- **Markdown crashes Neovim with `CODESIGNING Invalid Page`:** stale parsers in `~/.local/share/nvim/site/parser` (even `markdown.so.disabled`) get loaded and killed by macOS; move them out and retry.
- **Prompt looks plain after an update:** on macOS, run `brew bundle --file=Brewfile`, `./scripts/stow.sh apply`, and `exec bash --login` (on Ubuntu/`agentbox`, install or update the Linuxbrew tool subset from [Phase 5](docs/plans/remote-agent-server.md#phase-5-toolchain-on-the-server) instead of running the macOS `Brewfile`).
