# dotfiles

My macOS development setup, managed with [GNU Stow](https://www.gnu.org/software/stow/).
Each folder under `stow/` is a package that mirrors `$HOME`, so `stow/nvim/.config/nvim/init.lua` becomes `~/.config/nvim/init.lua`.

[![Test Dotfiles](https://github.com/manifoldfrs/dotfiles/actions/workflows/test.yml/badge.svg)](https://github.com/manifoldfrs/dotfiles/actions/workflows/test.yml)

## The stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Terminal + multiplexer | [Rex](https://www.superlogical.com/rex/docs/installation) (beta) | Default, on the Mac and on the iPhone (Rex for iOS beta). Ghostty is the fallback terminal; Herdr and Termius remain the fallback phone path into `agentbox`. |
| Editor / IDE | Neovim | lazy.nvim + Lua plugins in `stow/nvim/.config/nvim/`. Zed and Cursor are retired and archived under `old/`. |
| Shell | Homebrew Bash 5 + Starship | FZF, zoxide, and mise on top. Fish/Zsh configs under `old/` are rollback-only. |
| Primary agent harness | OpenCode 2 | Every model in one harness, including Claude through the built-in Claude Agent provider (`stow/opencode/.config/opencode/`). |
| Other harnesses | Claude Code, Pi | Claude Code keeps its settings, hooks, and mods in `stow/claude/.claude/`; Pi stays configured in `stow/pi/.pi/agent/`. |
| Reviewer / second opinion | `sol-loop` skill | GPT-6.1 Sol reviews in a fix loop, headless through `codex exec` in a read-only sandbox; `code-review` adds standards and intent axes before it. |

Everything uses **Tokyo Night** with **MonoLisaCode 14 pt** where the app allows it.
Rex is the exception: its theme and font are app settings, not files (see [Rex app settings](#rex-app-settings-one-time-per-machine)).

Vocabulary like *tracked source*, *live configuration*, and *apply* is defined in [CONTEXT.md](CONTEXT.md).
Agents working in this repo should start with [AGENTS.md](AGENTS.md).

## Install on a new Mac

Clone to `~/code/personal/dotfiles`; some Claude Code mod paths assume that location.

```bash
git clone git@github.com:manifoldfrs/dotfiles.git ~/code/personal/dotfiles
cd ~/code/personal/dotfiles
./scripts/bootstrap.sh
```

Bootstrap installs Homebrew and the `Brewfile`, installs OpenCode 2 and Claude Code with their native installers, backs up conflicting live files (`.backup.YYYYMMDDhhmmss`), applies all Stow packages, syncs Herdr plugins, selects Homebrew Bash as the login shell, restores Neovim plugins from `lazy-lock.json`, installs the global npm packages, sets up the global `anti-slop` runtime and Plannotator, and runs `rex skill setup --session-naming` when Rex is present.

Rex itself installs from its DMG and updates itself, so install it separately.
Then quit and reopen your terminal (or `exec /opt/homebrew/bin/bash --login`) and sign in to each harness (`claude`, `pi` with `/login`, `codex`).
In OpenCode, run `/connect` and pick **Claude Agent** to use your Claude Code login, and connect any other providers you use.

Machine-local secrets go in `~/.config/bash/local.bash`, which is never tracked:

```bash
export REF_API_KEY="..."
export EXA_API_KEY="..."
export TYPESAFE_API_KEY="..."
```

## Update an existing machine

Day to day, this is all you need:

```bash
cd ~/code/personal/dotfiles
git pull
./scripts/stow.sh dry-run   # preview; this is also the default with no argument
./scripts/stow.sh apply     # validates in isolation first, then restows into $HOME
```

`apply` runs `scripts/validate-dotfiles.sh` against a temporary home before touching the live one.
If validation fails, nothing changes.
Use `./scripts/stow.sh delete` to remove all managed symlinks, and `./scripts/bootstrap.sh` only when you also want packages, plugins, and tooling refreshed.

The default profile is the `STOW_PACKAGES` list in `scripts/stow.sh`: `bash git ghostty herdr rex nvim bin opencode claude codex pi agents`.
To restow a single package by hand:

```bash
stow --no-folding -R -v -t "$HOME" -d stow nvim
```

Edit either the `$HOME` path or the repo path; symlinks make them the same file.
To capture live config back into the repo, run `./scripts/backup.sh` and review the diff before committing.
It deliberately skips agent account and runtime state.

### Migrating a machine with existing config files

Stow will not overwrite real files.
Check whether a target is already a Stow symlink with `readlink ~/.config/nvim` (and friends).
If it prints nothing, move the real file aside with a `.backup.$(date +%Y%m%d%H%M%S)` suffix, then apply.
Bootstrap already does this for known targets.

## Repository layout

```text
stow/                  Stow packages, each mirroring $HOME
  bash/                Bash, Readline (.inputrc), Starship, functions and aliases
  git/                 .gitconfig and global gitignore
  rex/                 Rex init.lua and the Lua modules it requires
  ghostty/             Fallback terminal config
  herdr/               Herdr config, plugin list, Plannotator TUI config
  nvim/                Neovim config (see stow/nvim/AGENTS.md)
  bin/                 ~/.local/bin tools
  opencode/            OpenCode config, CLI settings, MCP servers, and the shared global AGENTS.md and skills/
  claude/              Claude Code settings, theme, status line, mods/, and the shared guardrail hooks/; links AGENTS.md to opencode/
  codex/               Codex config and theme; links AGENTS.md to opencode/ and hooks to claude/
  pi/                  Pi settings, MCP config, models, themes, extensions/; links AGENTS.md to opencode/
scripts/
  bootstrap.sh         Full machine setup
  stow.sh              apply / dry-run / delete, with isolated preflight
  validate-dotfiles.sh Validation without live changes
  backup.sh            Capture live config into tracked sources
  sync_herdr_plugins.sh Install/update declared Herdr plugins
  update_agent_skills.sh Check or sync the shared skill catalog
  rex_server_setup.sh  Root-only Rex login server setup for agentbox
  rex_prefs.sh         Save / load / auto-save Rex app settings
rex/                   Tracked Rex app settings (not stowed)
server/rex/            Files installed under /etc on agentbox (not stowed)
mcp/                   MCP templates and notes (see mcp/README.md)
test/                  Shell and TypeScript tests, Docker harness
docs/                  Research notes and plans; decisions land here, not in this README
old/                   Archived Fish, Zsh, tmux, Karabiner, Zed, and Cursor config
Brewfile               Homebrew packages and casks
npm-global-packages.txt Global npm packages (@openai/codex, vercel, tree-sitter-cli)
```

## Rex

Rex (beta) is the default terminal and multiplexer.
Its tracked config is `stow/rex/.config/rex/init.lua` plus the Lua modules beside it (keys, editor/Cmd-key handling, annotations, Neovim navigation).
Bindings in that file also apply to sessions on remote hosts.
Rex does not add its CLI directory to `PATH`, so `environment.bash` adds `$REX_BIN_DIR`.

After applying, verify with:

```bash
rex config reload
rex keymap   # should load without warnings
```

Open Neovim once so lazy.nvim installs `vim-rex-navigator`.
With it, `Ctrl-h/j/k/l` moves between Neovim splits and hands off to the adjacent Rex (or Herdr) pane at a split's edge.

### Rex keys

`Ctrl-a` is the prefix, as in tmux/Herdr.
Press `Ctrl-a Ctrl-a` to send a literal `Ctrl-a`.

| Keys | Action |
| --- | --- |
| `Ctrl-a s`, `Ctrl-a w` | Session picker |
| `Ctrl-a N`, `Ctrl-a $` | New session, rename session |
| `Ctrl-a (`, `Ctrl-a )` | Previous, next session |
| `Ctrl-a c`, `Ctrl-a n`, `Ctrl-a p`, `Ctrl-a 1..9` | New, next, previous, numbered tab |
| `Ctrl-a ,`, `Ctrl-a &` | Rename, close tab |
| `Ctrl-a %`, `Ctrl-a "` | Split right, split down |
| `Ctrl-a h/j/k/l` | Focus pane by direction |
| `Ctrl-a z` | Zoom pane |
| `Ctrl-a R` | Resize mode: `h/j/k/l` or arrows (Shift for bigger steps), `=` balance, `Enter`/`Esc` to leave |
| `Ctrl-a b`, `Ctrl-a r`, `Ctrl-a ?` | Toggle sidebar, reload config, command palette |
| `Ctrl-a a`, `Ctrl-a A`, `Ctrl-a m` | Annotate copied selection, copy annotations as agent context, manage annotations |
| `Ctrl-h/j/k/l` | Move between Neovim splits and Rex panes |

Annotations reuse Herdr's `herdr-annotate` binary through the `rex-annotate` helper, so keep the Herdr plugin installed with `./scripts/sync_herdr_plugins.sh`.
Rex has no selection API yet, so annotations read the clipboard: select text first (copy on select), then press `Ctrl-a a`.

### Rex app settings (one time per machine)

Theme, font, and GUI settings live in the app (`com.superlogical.rex.plist`), not in `init.lua`.
`scripts/rex_prefs.sh` tracks the `Workspace.*` settings (themes, font, tabs, cursor, padding) in `rex/preferences.plist`:

```bash
./scripts/rex_prefs.sh save    # copy current Rex settings into the repo
./scripts/rex_prefs.sh load    # restore them (quit Rex first)
./scripts/rex_prefs.sh watch   # LaunchAgent that runs save whenever Rex changes a setting
```

Window positions, sessions, and server/host state stay machine-local.
Set the rest once:

- [ ] Shell: `/opt/homebrew/bin/bash --login`.
- [ ] Terminal: copy on select, Option as Alt, blinking block cursor, padding color matching the background, fade inactive panes.
- [ ] Notifications: macOS notifications for blocked and finished programs, sounds off.
- [ ] Rex Server: Remote Control on (`rex do` and agents need it).
- [ ] Put Rex in the Dock and login items in place of Ghostty.

### Rex server on agentbox

`agentbox` (Ubuntu droplet on the tailnet) runs the Rex login server, so sessions keep running while the Mac is closed and survive Rex upgrades.
Rex on Linux is server only: you see and type into agentbox sessions through the Mac app.

#### Server setup (once, as root on agentbox)

```bash
ssh root@agentbox
export REX_PACKAGE_TOKEN=...   # from the Linux install command on the Rex docs page; never commit it
curl -fsSL -u "rex:$REX_PACKAGE_TOKEN" https://pkgs.superlogical.com/rex/install.sh | sh
sudo -u frshbb git -C /home/frshbb/code/personal/dotfiles pull
/home/frshbb/code/personal/dotfiles/scripts/rex_server_setup.sh
```

The setup script installs `server/rex/accounts.jsonc` (only `tailscale:manifoldfrs@github` gets in, as `frshbb`) and a systemd drop-in that listens on the tailnet at port 7297.
It refuses to run if the packaged `ExecStart` no longer matches the tracked one; copy the new line from `systemctl cat rex-login-server` into the drop-in, keep `--extra-listen tailnet://:7297` at the end, and rerun.
The login server starts on boot; your account's server starts when you connect and exits once its last session ends.

Then, as `frshbb` on agentbox, run `rex skill setup --session-naming`.
Always pass `--session-naming`: without it, newer Rex builds rewrite the tracked agent hooks to turn naming off, and the Mac and agentbox drift apart.

Rex updates arrive with `apt full-upgrade`; pin one with `sudo apt-mark hold rex` when it must wait.

#### App setup (once per Mac)

In the Rex app, choose **Add Remote Host…** with URL `http://100.82.139.102:7297` and name `agentbox`.
`init.lua` declares the same host, but only the CLI (`rex hosts list`, `rex -S agentbox`) reads it.

- Use agentbox's Tailscale IPv4 address, not its `ts.net` name: the name also resolves to IPv6, and panes then hang on "Opening terminal…" ([Rex bug](https://discord.com/channels/1546797889009881158/1564343288335564820)).
- The app needs Rex for Mac preview.21 or newer to connect to a plain-HTTP tailnet address; older builds show the host as Disconnected.
- If agentbox is ever removed from and re-added to the tailnet, its IP can change; update `init.lua` and the app's host to match.

#### Daily use (on the Mac)

`rexbox` shows an agentbox session in the app, creating it first if needed:

```bash
rexbox                                  # list sessions on agentbox
rexbox opto2 code/optoai/opto2          # open opto2, creating it in ~/code/optoai/opto2 on agentbox
rexbox opto2                            # open an existing session
rex -S agentbox kill opto2              # end one
```

You can also click **agentbox** in the app's sidebar and pick a session.
Closing a session's last tab ends the session, along with anything running in it.

#### On the iPhone

Rex for iOS (beta) shows the same agentbox sessions as the Mac.
With Tailscale signed in to the same account, add a remote host with URL `http://100.82.139.102:7297` and name `agentbox`, using the IP for the same IPv6 reason as on the Mac.
Herdr still runs on `agentbox` as the fallback phone path through Termius, for phones without Rex such as Android.

#### Troubleshooting

- **Connection refused:** you ran `rex -S agentbox` on agentbox itself, where the name resolves to loopback; run it on the Mac.
- **Session starts in the wrong folder:** with raw `rex -S agentbox new -c`, pass a full `/home/frshbb/...` path, because the Mac's shell expands `~` to `/Users/frshbb`; `rexbox` takes paths relative to the agentbox home.
- **Panes stuck on "Opening terminal…":** check the app's host URL is the IPv4 address; if local panes spin too, quit and reopen the app.
- **Server logs:** `journalctl -u rex-login-server` on agentbox.

### Known Rex beta gaps

Things the old Ghostty + Herdr setup had that Rex does not yet:

- No detach: closing a session's last tab destroys the session, so `Ctrl-a q`/`Ctrl-a d` are unbound.
- No close confirmation for panes or tabs with running programs.
- No last-pane (`Ctrl-a ;`) and no keyboard copy mode (`Ctrl-a [`).
- No selection API (annotations read the clipboard), no remote image paste, and no dragging screenshot thumbnails into agents.
- No built-in diff/file viewer: use Neovim diffview (`<leader>gD`) or `hunk`.
- No background opacity/blur, no `font-variation`, and appearance settings are not file-based.

## Neovim

Neovim (>= 0.11) is the IDE.
Plugins are one spec per file under `stow/nvim/.config/nvim/lua/plugins/`, pinned in `lazy-lock.json`.
The load-bearing ones are snacks.nvim (picker, explorer, dashboard, lazygit), fff (Cmd-P file finder), blink.cmp (completion), mason + lspconfig, treesitter, flash.nvim (jumps), gitsigns, diffview, and nvim-spectre (project search/replace).
Per-language indentation lives in `ftplugin/*.lua`.
Detailed rules for editing this config are in `stow/nvim/AGENTS.md`.

Leader is `Space`.
Which-key documents everything in-editor (press `Space` and wait), so this is only the short list:

| Keys | Action |
| --- | --- |
| `<C-p>`, `<leader>sf` | Find files (includes hidden and gitignored files) |
| `<leader>sg` | Grep |
| `<C-n>`, `<leader>e` | File explorer |
| `<C-h/j/k/l>` | Move between splits, then Rex/Herdr panes at the edge |
| `gd`, `gr`, `gI`, `gy` | Definition, references, implementation, type definition |
| `K`, `<leader>rn`, `<leader>ca` | Hover, rename, code action |
| `gl`, `[d`, `]d` | Diagnostics float, previous, next |
| `<leader>gg` | Lazygit |
| `<leader>gD` | Diffview |
| `]h`, `[h` | Next, previous git hunk |
| `<leader>tt`, `<leader>tf`, `<leader>ts` | Test nearest, file, suite |
| `<leader>a` (visual) | Annotate selection (Rex/Herdr) |
| `<leader>uC` | Toggle secret masking for `.env`-style files (display only) |

In Rex, Neovim also gets Cursor-style `Cmd` keys: `Cmd-P` find files, `Cmd-Shift-F` search in files, `Cmd-B` explorer, `Cmd-Shift-O` symbols, `Cmd-S` save, `Cmd-/` comment.

Mason installs `lua_ls`, `ts_ls`, `gopls`, `clangd`, and `ty` (Python).
Ruby LSP runs outside Mason so it uses the project's Ruby; install it once with `gem install ruby-lsp --bindir "$HOME/.local/bin" --no-document`.
TypeScript extras: `:TSC` typechecks into quickfix, `ts-error-translator` makes diagnostics readable, and `:TwoslashQueriesEnable` shows inline types.

There is no in-editor debugger.
Use tests and logs first, then `dlv` for Go or `debugpy` for Python in a terminal pane.

Before changing plugins, run the safety harness; it checks startup in an isolated profile without touching live config or the lockfile:

```bash
bash test/nvim_plugin_safety.sh --base-ref HEAD
```

## Shell

Homebrew Bash 5 is the login shell, and Rex, Ghostty, and Herdr all launch `/opt/homebrew/bin/bash` explicitly.
Layout: environment and `PATH` in `~/.config/bash/environment.bash`, aliases in `aliases.bash`, functions in `functions.bash`, secrets and machine overrides in the untracked `local.bash`.
Starship renders the prompt, FZF provides completion and `Ctrl-F` fuzzy history, zoxide provides `z`, and mise activates per-project runtimes.
Generated init scripts for FZF, Starship, and zoxide are cached under `~/.cache/bash/init/` and regenerated when their binaries change.

## Agents

OpenCode 2 is the primary harness, for Claude and every other model; switch models with `/models`.
Claude runs through the Claude Agent provider, which drives your local `claude` login through the Agent SDK.
Until [anthropics/claude-code#97074](https://github.com/anthropics/claude-code/issues/97074) is fixed, SDK use draws the 5-hour limit about twice as fast as the interactive Claude Code UI, so heavy Claude-only sessions are cheaper in Claude Code.
Claude Code and Pi stay configured.
Codex stays configured, and cross-provider review goes through `sol-loop`: Sol reviews, the agent fixes, and the loop repeats until Sol approves.

### Autonomous workflow

Every skill is model-invoked, so agents pick up verification and review without being asked.
Say **full send** to take a change to a merged PR unattended: `fstack` builds it, `prove` proves it, `sol-loop` reviews it, `pr` files it, and `babysit-pr` watches CI and review bots until the merge gate passes.
Say **full stop** for the same work ending with the PR ready for you to merge, or **babysit** / **watch** for an existing PR.
The agent asks only when it cannot prove the change, the merge gate cannot pass, or the next step is destructive, deploys, or leaves the repository.
Each pull request addresses one goal; a request with several goals becomes several pull requests, stacked when they depend on each other.
These adapt Theo Browne's [tstack](https://github.com/t3dotgg/tstack) (MIT).

### Shared rules and skills

Claude Code is the canonical home for everything the harnesses share.
One global rules file, `stow/opencode/.config/opencode/AGENTS.md`, is symlinked into Claude Code, Codex, and Pi by their Stow packages, so all four harnesses follow the same instructions.
Reload or restart sessions after changing it.

Skills live once in `stow/opencode/skills/`; `scripts/stow.sh` links each skill folder into `~/.claude/skills/` and `~/.agents/skills/`, which Codex and Pi read.
Ownership (upstream baseline, personalization layer, or local) is recorded in `.skill-sources.tsv` in that folder; see [CONTEXT.md](CONTEXT.md) for the terms.
[docs/skills.md](docs/skills.md) lists every skill, who can invoke it, its owner, and what it does; it is generated from each `SKILL.md`, so run `./scripts/skill_catalog.sh` after adding, renaming, or editing a skill.

```bash
./scripts/update_agent_skills.sh --check   # report drift from upstream catalogs
./scripts/update_agent_skills.sh --review  # open a Plannotator review of the diff
./scripts/update_agent_skills.sh --sync    # update the tracked snapshot (uncommitted)
./scripts/skill_catalog.sh                 # regenerate docs/skills.md (validate-dotfiles.sh checks it)
```

`local` skills are never overwritten by sync, and `excluded` skills are never restored.
Plannotator's own skills are excluded on purpose because its installer owns them (bootstrap runs it).
A new machine gets the tracked snapshot from `./scripts/stow.sh apply` with no upstream fetch.

### MCP servers

Pi's tracked config (`stow/pi/.pi/agent/mcp.json`) defines seven servers: Ref (library docs), Exa (web search), Jev (TypeSafe judgments), Chrome DevTools (isolated browser), codex-chrome (your real Chrome profile), HEY (mail/calendar via `hey mcp`), and superlogical (Rex docs and feedback).
Keys come from the environment (`REF_API_KEY`, `EXA_API_KEY`, `TYPESAFE_API_KEY`), never from tracked files.
Run `pi mcp list` to check connections.

To give Claude Code the same servers, import them into its machine-local config:

```bash
./mcp_setup.sh install-claude
```

Codex declares its servers in `stow/codex/.codex/config.toml`.
The legacy template flow in `mcp/` is documented in `mcp/README.md`.

Two things worth knowing:

- codex-chrome uses the community `codex-control-chrome-mcp` bridge to drive your signed-in Chrome through the Codex extension.
  It has full page access and no per-site permissions.
  Install with `npm install -g codex-control-chrome-mcp` and `codex-control-chrome-mcp install-native-host --browser chrome`; `uninstall-native-host` undoes it.
  Chrome DevTools is the isolated alternative.
- HEY has read/write access to mail, calendars, todos, and contacts.
  Change its args to `["mcp", "--read-only"]` in `mcp.json` to limit it to reads.

### Guardrails

Claude Code's hooks in `stow/claude/.claude/hooks/` block dangerous shell commands and hand edits to generated files.
Codex runs the same scripts through symlinks in `stow/codex/.codex/hooks/`, and Pi runs them from `~/.claude/hooks/` through its `agent-guardrails` extension.
Rails extras: schema and lockfile edits are blocked, destructive `db:` tasks require `RAILS_ENV=test`, and production Rails commands are blocked.
Pi also screens fetched web content and audits edit scope with Jev (`jev-guardrails` extension), and Claude Code does the equivalent through its `jev-*` mods.
Test the shell rules with `bash test/agent_guardrails_test.sh "$PWD"`.

### Planning and review

Plans are project Markdown files, reviewed in chat, Plannotator TUI (`plannotator-tui <file>`), or Plannotator's browser UI, and implemented only after explicit approval.
`Ctrl-a Shift-o` and `Ctrl-a Shift-l` review a folder or an agent's last reply in Herdr; in Rex, run `plannotator-tui` directly.

### Debugging Pi requests

```bash
pi-log   # Pi with the request logger enabled for that process only
```

Logs land in `~/.pi/agent/logs/requests/` with owner-only permissions.
They contain full prompts and tool results, so review before sharing and delete when done (`rm -rf ~/.pi/agent/logs/requests`).

## Extra tools in `bin`

- `anti-slop` runs a shared Oxlint rule set (Dillon Mulroy's rules, vendored unmodified; see `stow/bin/.local/share/anti-slop/UPSTREAM.md`) against any JS/TS project without per-project setup: `anti-slop .`, `anti-slop --effect .` for Effect rules, `anti-slop --fix .` to autofix.
  Bootstrap installs its runtime; validate with `bash test/global_anti_slop_test.sh`.
- `rex-annotate` backs the Rex annotation keys described above.
- `spotify-visualizer` renders a terminal dot-matrix visualizer driven by the current Spotify track.
  It needs a Spotify developer app with redirect URI `http://127.0.0.1:8974/callback` and `SPOTIFY_CLIENT_ID` exported; tokens cache under `~/.cache/dotfiles/spotify-visualizer/`.
  Keys: `Space` play/pause, `n`/`p` next/previous, `s` shuffle, `r` repeat, `q` quit.

## Herdr and Ghostty (fallbacks)

Ghostty (`stow/ghostty/`) is the fallback terminal; its config is what Rex's theme was imported from.
Shift-Cmd-click opens links there despite application mouse capture.

Herdr (`stow/herdr/`) shares Rex's `Ctrl-a` mental model and still matters in two places: its annotate plugin powers Rex annotations, and it is the fallback phone path into `agentbox` through Termius.
Useful commands: `herdr server reload-config`, `herdr integration status`, `herdr pane list`, `herdr agent list`.
Keep its plugins current with `./scripts/sync_herdr_plugins.sh`, which installs `plannotator/herdr-annotate` and `paulbkim-dev/vim-herdr-navigation` from the tracked `plugins.txt`.
Install agent integrations once per machine with `herdr integration install pi` or `herdr integration install codex`.

## Validation

```bash
./scripts/validate-dotfiles.sh                 # full isolated preflight, no live changes
bash -n scripts/*.sh stow/bash/.bashrc         # shell syntax spot check
bash test/run_tests.sh                         # shell test suite
npm --prefix test test                         # Pi extension tests
npm --prefix test run typecheck                # Pi extension types
bash test/nvim_plugin_safety.sh --base-ref HEAD
(cd stow/nvim/.config/nvim && nvim --headless -c "luafile init.lua" -c "qa") 2>&1 | rg -i error
docker build -t dotfiles-test -f test/Dockerfile . && docker run --rm dotfiles-test  # closest to CI
```

`AGENTS.md` lists the full preflight and per-area checks.

## Troubleshooting

**Stow reports conflicts.**
A real file sits where a symlink goes.
Move it aside with a `.backup.$(date +%Y%m%d%H%M%S)` suffix and restow, or run bootstrap, which backs up known targets first.

**Edits to `~/.config/...` do not show in git.**
Run `readlink` on the path; if it does not point into this repo, the package is not applied.
Restow that package.

**Neovim LSP or treesitter trouble.**
Needs Neovim >= 0.11 and `tree-sitter-cli` >= 0.26.1.
Check `:Mason`, `:LspInfo`, and `:checkhealth nvim-treesitter`.

**Markdown crashes Neovim with `CODESIGNING Invalid Page`.**
Stale parsers in `~/.local/share/nvim/site/parser` (even `markdown.so.disabled`) get loaded and killed by macOS.
Move them out of that directory and retry.

**Prompt looks plain after an update.**
Run `brew bundle --file=Brewfile`, then `./scripts/stow.sh apply`, then `exec /opt/homebrew/bin/bash --login`.

**Herdr config or agent state looks stale.**
Confirm `readlink ~/.config/herdr/config.toml` points into `stow/herdr/`, run `herdr server reload-config`, and check `herdr integration status`.
Herdr keeps the previous keymap when bindings are invalid; details are in `~/.config/herdr/herdr-server.log`.
