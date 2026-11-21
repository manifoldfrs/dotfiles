# dotfiles

My macOS development setup, managed with [GNU Stow](https://www.gnu.org/software/stow/).
Each folder under `stow/` is a package that mirrors `$HOME`, so `stow/nvim/.config/nvim/init.lua` becomes `~/.config/nvim/init.lua`.

[![Test Dotfiles](https://github.com/manifoldfrs/dotfiles/actions/workflows/test.yml/badge.svg)](https://github.com/manifoldfrs/dotfiles/actions/workflows/test.yml)

## The stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Terminal + multiplexer | [Rex](https://www.superlogical.com/rex/docs/installation) (beta) | Default, on the Mac and on the iPhone (Rex for iOS beta). Ghostty is the fallback terminal; Herdr and Termius remain the fallback phone path into `agentbox`. |
| Editor / IDE | Neovim, Cursor | lazy.nvim + Lua plugins in `stow/nvim/.config/nvim/`. Cursor settings, keybindings, and tasks are the `cursor` Stow package. Zed is retired and archived under `old/`. |
| Shell | Fish + FZF + Atuin + zoxide | Bash still runs scripts and agent commands. |
| Primary agent harness | Codex | Global rules and guardrail hooks in `stow/codex/.codex/`; shared skills in `stow/codex/skills/shared/`. |
| Worker | Pi | Non-GPT models and Pi-native workflows through Codex's `$pi-skill` bridge. |
| Standalone harnesses | Claude Code, OpenCode 2 | Still configured for direct use, not used as Codex worker fallbacks. |

Everything uses **Tokyo Night** with **MonoLisaCode 14 pt** where the app allows it.
Rex is the exception: its theme and font are app settings, not files (see [Rex app settings](#rex-app-settings-one-time-per-machine)).

Vocabulary like *tracked source*, *live configuration*, and *apply* is defined in [CONTEXT.md](CONTEXT.md).
Agents working in this repo should start with [AGENTS.md](AGENTS.md).

## Install on a new Mac

Clone to `~/code/personal/dotfiles`.

```bash
git clone git@github.com:manifoldfrs/dotfiles.git ~/code/personal/dotfiles
cd ~/code/personal/dotfiles
./scripts/bootstrap.sh
```

Bootstrap installs Homebrew and the `Brewfile`, installs Claude Code and OpenCode 2 with their native installers, backs up conflicting live files (`.backup.YYYYMMDDhhmmss`), applies all Stow packages, registers Claude Code's MCP servers, syncs Herdr plugins, restores Neovim plugins from `lazy-lock.json`, installs the global npm packages, sets up the global `anti-slop` runtime and Plannotator, and runs `rex skill setup --session-naming` when Rex is present.

Bootstrap installs pnpm from the Brewfile and uses it to install Pi in `$PNPM_HOME/bin`.
The Bash profile prefers that Pi and keeps Bun available for other projects.

Rex itself installs from its DMG and updates itself, so install it separately.
Then open a new terminal pane (or run `exec bash --login`) and sign in to each harness (`claude`, `pi` with `/login`, `codex`).
In OpenCode, run `/connect` for the providers you use; **Claude Agent** reuses your Claude Code login.

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

The default profile is the `STOW_PACKAGES` list in `scripts/stow.sh`: `bash git ghostty herdr rex nvim bin pi claude opencode codex cursor`.
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
  bash/                Bash and Fish startup, Readline (.inputrc), Atuin, functions and aliases
  git/                 .gitconfig and global gitignore
  rex/                 Rex init.lua and the Lua modules it requires
  ghostty/             Fallback terminal config
  herdr/               Herdr config, plugin list, Plannotator TUI config
  nvim/                Neovim config (see stow/nvim/AGENTS.md)
  bin/                 ~/.local/bin tools, including agentbox-auth for finishing agentbox sign-ins from the Mac
  codex/               Primary harness config, theme, global AGENTS.md, hooks, shared skills, and Pi worker bridge
  pi/                  Worker settings, MCP definitions, models, themes, and extensions; links shared rules and guardrails to codex/
  claude/              Standalone Claude Code settings and mods; links shared rules and hooks to codex/
  opencode/            Standalone OpenCode config, plugins, and generated skill commands; links shared rules to codex/
  cursor/              Cursor settings, keybindings, tasks (Library/Application Support/Cursor/User)
cursor/extensions.txt  Cursor extension IDs; install with the app's bundled CLI
scripts/
  bootstrap.sh         Full machine setup
  stow.sh              apply / dry-run / delete, with isolated preflight
  validate-dotfiles.sh Validation without live changes
  backup.sh            Capture live config into tracked sources
  sync_herdr_plugins.sh Install/update declared Herdr plugins
  update_agent_skills.sh Check or sync the shared skill catalog
  harness_sync.sh      Generate OpenCode and Codex MCP servers and Claude mod copies from Pi
  rex_server_setup.sh  Root-only Rex login server setup for agentbox
  rex_prefs.sh         Save / load / auto-save Rex app settings
rex/                   Tracked Rex app settings (not stowed)
server/rex/            Files installed under /etc on agentbox (not stowed)
mcp/                   MCP setup and configuration notes (see mcp/README.md)
test/                  Shell and TypeScript tests, Docker harness
docs/                  Research notes and plans; decisions land here, not in this README
old/                   Archived Fish, Zsh, tmux, Karabiner, Zed, and older Cursor config
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

- [ ] Shell launcher: Bash in login mode, which starts Fish interactively.
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
It also pins the `rex` package to Superlogical's repository with `server/rex/apt-preferences.d/rex`.
Ubuntu ships an unrelated Perl tool named `rex` with a higher version number, and without that pin apt can install it over Superlogical's package; the script reinstalls the right one if that already happened.
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

#### Signing in from agentbox

A sign-in started on agentbox sends your Mac's browser back to `http://127.0.0.1:<port>/...`, where nothing is listening, so the page shows "This site can't be reached" and the login on agentbox keeps waiting.
This happens with Pi's `/login` and `pi mcp login`, `hey auth login`, Codex, Claude Code, and OpenCode's MCP sign-in.
Finish it from the Mac with `agentbox-auth`:

1. Start the sign-in on agentbox and leave it waiting.
2. Open the link it prints in your Mac browser and approve access.
3. On the "This site can't be reached" page, copy the whole address from the address bar.
4. On the Mac, run:

   ```bash
   agentbox-auth
   ```

It reads the address from the clipboard and requests it on agentbox, where the waiting sign-in receives it and finishes.
Pass the address as an argument instead of copying it, or a host other than agentbox as the second argument: `agentbox-auth '<address>' <host>`.
Keep the single quotes: unquoted, the shell cuts the address at the first `&`.
Run on agentbox itself, which has no clipboard, it takes the address as an argument and requests it there directly.
The address works once and only while the sign-in is waiting; if `agentbox-auth` reports it could not connect, start the sign-in again.

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

## Cursor

The `cursor` Stow package links `settings.json`, `keybindings.json`, and `tasks.json` into `~/Library/Application Support/Cursor/User/`, so changes made in Cursor's settings UI show up in `git diff`.
The extension list lives outside the package in `cursor/extensions.txt`, because Stow would otherwise link it into `$HOME`.
Cursor does not put its CLI on `PATH`, so install extensions with the bundled binary:

```bash
CURSOR_BIN="/Applications/Cursor.app/Contents/Resources/app/bin/cursor"
while IFS= read -r ext; do "$CURSOR_BIN" --install-extension "$ext"; done < cursor/extensions.txt
./scripts/stow.sh apply
```

## Shell

An interactive Bash login with the managed config loads the shared PATH and machine-local settings, then starts Fish for suggestions and completions.
The Fish prompt uses Tokyo Night colors and shows a short path, the Git branch or detached commit, and a clock.
It shows an exit code only when a command fails and never prints the username or hostname.
Scripts, Bash command strings, and Pi's configured Bash runner still use Bash.
To stay in Bash for a pane, run `DOTFILES_KEEP_BASH=1 bash --login` or just `bash` from Fish.
The migration doesn't change the system login shell.

Fish loads FZF's file picker on `Ctrl-T`, uses Atuin's existing history for the FZF picker on `Ctrl-R` and `Ctrl-F`, and provides zoxide's `z`.
Press `Ctrl-D` inside the history picker to limit it to the current directory.
Up Arrow keeps Fish's native history behavior.
The `pi`, `claude`, and `opencode` commands retain their session-relaunch wrappers, and `rexbox` still uses the shared Bash function.

Install Fish on an existing Mac or Agentbox with `brew install fish`, then restow and open a new login pane.
Machine-local environment settings still go in the untracked `~/.config/bash/local.bash`.
Fish-specific settings can go in an untracked `~/.config/fish/conf.d/` file.

## Agents

Codex is the primary harness and uses GPT-6.2 Sol at medium reasoning and Ultrafast in the tracked macOS configuration.
That configuration disables routine command approvals and the filesystem sandbox, while keeping the shared guardrail hooks enabled.
To restore approval prompts and workspace isolation for a CLI session, start `codex -a on-request -s workspace-write`.
Use Pi for non-GPT models and Pi-native workflows; Codex does not fall back to OpenCode or silently substitute a model.
Pi's separate configuration includes GPT-6.2 Sol and Astra under `openai` with 272K context windows inherited by the local speed variants.
If a Pi model is missing after sign-in, run `pi update --models` and start a new Pi session.
Claude Code and OpenCode retain their standalone configurations.

### Gemini 4 Neon in Pi

Install the [Antigravity CLI](https://antigravity.google/docs/getting-started/), run `agy`, and sign in with an account that has access to Neon.
Run `pi install npm:@tian.zuo/pi-antigravity@0.12.1` if the pinned bridge is not already installed, then start a new Pi session and choose `antigravity/gemini-4-neon` in `/model`.
The bridge uses the local `agy` login, and Pi tools mode routes workspace tool calls through Pi's permission hooks.
[Google does not support wrapping `agy` in a third-party coding agent on consumer plans](https://antigravity.google/docs/faq/).

### pstack in Pi

Pi loads Lauren Tan's pstack through the published [`pi-pstack-adapter`](https://github.com/elderfo/pi-pstack-adapter); the adapter's first run asks before fetching its certified upstream snapshot.
Run `/pistack-status` for the active release and capabilities, and `/pistack-check <skill>` for prerequisites.
Run `/skill:pistack-poteto-mode <task>` to start a playbook and turn on sticky Poteto Mode for follow-up requests in that Pi session.
New sessions start with sticky mode off; use `/pistack-sticky on`, `/pistack-sticky off`, or `/pistack-sticky status` to manage it.
Sticky mode is opt-in.
Arena's candidates and judge pool and Interrogate's reviewers use Opus 5.5, Sol 6.2, and Gemini 4 Neon at `high`, configured in [`pi-pstack-adapter.json`](stow/pi/.pi/agent/pi-pstack-adapter.json).
Arena selects one eligible judge from a different vendor than the parent model.
Playbooks do not authorize delegation, commits, pushes, PRs, merges, or live changes.
Retired workflows are archived in [`old/skills/`](old/skills/); other harnesses get the retained shared catalog, not the Pi adapter.

### PR writing with Gemini in Pi

Run [`/skill:neon-pr`](stow/pi/.pi/agent/skills/neon-pr/SKILL.md) to draft a PR title and body with Gemini 4 Neon.
The skill also applies to the writing step of pstack's Opening a PR playbook; if drafting delegation isn't already authorized, Pi asks first.
Gemini uses pstack's writing rules without changing its model roles, and Pi only publishes the copy when authorized.

### Council in Pi

Run `/skill:council <review scope>` for independent reviews from Opus 5.5, Sol 6.2, and Gemini 4 Neon at `high` thinking.
Add a score at the start of the arguments (for example, `/skill:council 9.5 review this diff`) to require that score from every reviewer.
Council repeats the review after authorized fixes; Interrogate instead reports failures it can reproduce.
[Council](stow/codex/skills/council/SKILL.md) lives in the Codex package, and Pi's Stow package links to that copy.

### Shared rules and skills

Codex owns the global rules and shared skills.
The Pi, Claude Code, and OpenCode packages link to `stow/codex/.codex/AGENTS.md`, so all four harnesses read the same rules.
Reload or restart sessions after changing them.

Shared skills live in `stow/codex/skills/shared/`.
`scripts/stow.sh` links each skill folder into `~/.agents/skills/`, which Pi, Codex, and OpenCode read, and `~/.claude/skills/` for Claude Code.
Existing links through `stow/pi/skills` still resolve and are repointed at the next Stow apply.
In Codex, use `$pi-skill` to list the skills Pi loads in the current project or to run one in Pi, for example `$pi-skill council review the staged changes only` or `$pi-skill pistack-interrogate review this design`.
The bridge uses the worker's actual Pi skill catalog, not a mirrored catalog.
It passes the scoped brief, not the Codex conversation, into a fresh Pi session.
For an individual model, ask Codex to use the bridge's `model <provider/model> '<brief>'` command.
A missing route or provider error is reported without switching models or harnesses.
Workflows that need a live Pi UI must be continued in interactive Pi.

The bridge requires Node.js and a machine-local `pi-worker.json` in `$CODEX_HOME` (normally `~/.codex`).
Set the absolute path to the intended Pi executable and an existing private state directory distinct from `~/.pi/agent`:

```json
{
  "executable": "/absolute/path/to/pi",
  "agentDir": "/absolute/path/to/private-pi-worker-state",
  "timeoutSeconds": 180
}
```

Initialize that Pi directory and authenticate its providers by launching the same executable with `PI_CODING_AGENT_DIR` set to `agentDir`.
Configure the extensions and skills the worker should load; a new directory does not inherit the main Pi installation or its sign-ins.
To make `council` available to the worker, link its `skills/council` directory entry to `stow/codex/skills/council/` in this checkout.
Do not symlink the auth store back to the main Pi directory.
Allow the worker state directory as a writable root in the Codex session (for example, `codex --add-dir /absolute/path/to/private-pi-worker-state`) and allow network access when needed without disabling the sandbox.
The launcher prints a job ID; use its `cancel <job-id>` command to stop that process group explicitly.
The deadline also stops the process group, but pressing Stop in Codex is not yet wired to that explicit cancellation command.
Ownership and archive exclusions are recorded in `.skill-sources.tsv` in that folder; see [CONTEXT.md](CONTEXT.md) for the terms.
[docs/skills.md](docs/skills.md) lists every skill, who can invoke it, its owner, and what it does; it is generated from each `SKILL.md`, so run `./scripts/skill_catalog.sh` after adding, renaming, or editing a skill.
The same script writes one OpenCode command per skill under `stow/opencode/.config/opencode/commands/`, because OpenCode loads skills with `@skill-id` rather than `/skill-id`.

```bash
./scripts/update_agent_skills.sh --check   # report drift from upstream catalogs
./scripts/update_agent_skills.sh --review  # open a Plannotator review of the diff
./scripts/update_agent_skills.sh --sync    # update the tracked snapshot (uncommitted)
./scripts/skill_catalog.sh                 # regenerate docs/skills.md and OpenCode skill commands (validate-dotfiles.sh checks both)
```

Claude Code's `jev-checks` mod in `stow/claude/.claude/mods/` screens web results, audits edit scope, and fact-checks answers; test it with `claude plugin test <mod folder>`.
The `codemode` mod ports Pi's codemode: scripts run in a Node child under `--permission` and call tools through `$.tool.call`, so hooks and permission checks still apply; test it with `claude plugin test` and `node --test runner/runner.test.mjs` in its folder.
Pi's `jev-guardrails` extension runs the same checks and adds the same `jev_pipeline` tool from that shared file, calling the `jev` server in Pi's `mcp.json` over stdio because Pi's extension loader does not expose its MCP client.
The Jev logic lives once in Pi, in `stow/pi/.pi/agent/extensions/jev-guardrails/shared.ts`, and the OpenCode plugin imports it directly.
Claude Code only loads mod files whose real path is inside the mod, so the mod's `hooks/jev-shared.ts` is a copy that `./scripts/harness_sync.sh` generates; edit Pi's file, then run the script.
The `bold-color` mod draws bold reply text in Tokyo Night blue.
The `tool-row-color` mod keeps running and folded tool rows in the text color instead of grey.
Pi uses [pi-cyber-ui](https://github.com/22GNUs/pi-cyber-ui) and its `cyber-ui-dark` theme for the prompt, tool gutter, animated working indicator, and footer.
Signal Deck shows `Pi` and its version at startup and centers a dim dotted π in a fresh, empty pane when there is room.
The watermark disappears on the first prompt or shell command and stays out of resumed sessions.
The panel above the prompt distinguishes model work, tool work, and the final outcome without adding a redraw timer.
The Cyber UI footer keeps session context and the selected model's display name, including `(Fast)` or `(Ultrafast)` for the Codex variants.
`./scripts/stow.sh apply` installs and patches the pinned Cyber UI package when Pi is available.
Stow softens the `cyber-ui-dark` palette with Tokyo Night navy panels, muted teal and blue, and dusty lavender in place of bright pink.
The other patches remove the cat icon, label the prompt cache percentage `cache`, and put the completed run's stats directly in the Signal Deck panel.
After reinstalling the package, rerun Stow apply and use `/reload` in Pi.
The previous `claude-style-ui` and `frsh-header` extensions remain in the repository but are disabled in Pi's settings so they do not override the new UI.
Pi's `pi-cloak` extension masks secret values (`.env`, `.vars`, `local.bash`, auth and credential files) in files Pi's `read` tool returns, using the rules in `stow/pi/.pi/agent/cloak.json`; `/cloak-status` shows them, and a shell `cat` is not covered.
`/save-md name` saves the last reply as `name.md`; both extensions are adapted from Dillon Mulroy's dotfiles.
Use `agent-browser` for browser work and `cua-driver` for native Mac apps and desktop automation.
The npm global package list installs `agent-browser`; on an existing machine install it with `npm install -g agent-browser` and run `agent-browser install` if Chrome is unavailable.
The shared `agent-browser` skill loads the CLI's version-matched core guide, and `modern-web-guidance` comes from [agent-browser v0.43.0](https://github.com/vercel-labs/agent-browser/tree/1cc19526f3641c8543d55aa6700e7c55b37ac356) (Apache-2.0).
Grant `cua-driver` (a Brewfile cask) Accessibility and Screen Recording with `cua-driver permissions grant`.
Pi's `skill-toast` and `inline-skills` extensions notify when a skill loads, and `/update` and `/restart` resume the session through the `pi` shell function, as Claude Code's `session-relaunch` mod does.
The Jev plugin in `stow/opencode/.config/opencode/plugins/jev/` is the thin OpenCode side of the same checks.
OpenCode bundles the `effect` package it uses at runtime; its `package.json` pins the same versions only for tests and type checks, and failed checks are logged to `~/.local/share/opencode/log/jev-plugin.log`.

```bash
(cd stow/opencode/.config/opencode/plugins/jev && pnpm install --frozen-lockfile && pnpm test && pnpm run check)
```

Claude Code's `xai-search` mod, OpenCode's `xai-search` plugin, and Codex's `xai-search` MCP server all expose `xai_search` through Pi's guarded runner.
They share the tool definition in `stow/pi/.pi/agent/extensions/xai-search/xai-shared.ts`; the Claude Code mod gets a generated copy.
Codex exposes the tool directly and through Code Mode, and it uses Pi's existing SuperGrok or X Premium sign-in (`/login xai`) rather than a separate API key.

```bash
(cd stow/opencode/.config/opencode/plugins/xai-search && pnpm install --frozen-lockfile && pnpm test && pnpm run check)
```

`local` skills are never overwritten by sync, and `excluded` skills are never restored.
Plannotator's own skills are excluded on purpose because its installer owns them (bootstrap runs it).
A new machine gets the tracked snapshot from `./scripts/stow.sh apply` with no upstream fetch.

### MCP servers

`stow/pi/.pi/agent/mcp.json` defines six servers: Ref (library docs), Exa (web search), Jev (TypeSafe judgments), Chrome DevTools (isolated browser), HEY (mail/calendar via `hey mcp`), and superlogical (Rex docs and feedback).
Keys come from the environment (`REF_API_KEY`, `EXA_API_KEY`, `TYPESAFE_API_KEY`), never from tracked files.
Run `codex mcp list` to check Codex's server registrations.

Claude Code keeps registrations in machine-local `~/.claude.json`, so bootstrap imports Pi's file, dropping Pi-only `exposure` and `timeout` fields; rerun the import after changing it:

```bash
./mcp_setup.sh install-claude
```

`./scripts/harness_sync.sh` writes the same servers into OpenCode's `opencode.jsonc` and Codex's `stow/codex/.codex/config.toml`, so change servers only in Pi's file, then run it; `validate-dotfiles.sh` fails when they drift.
The sync preserves Codex's per-tool approvals for servers still configured in Pi and leaves the Codex-only `xai-search` MCP adapter in place.
Codex uses native Code Mode (`features.code_mode`), with Ref and Exa available directly and from Code Mode.
Jev, Chrome DevTools, HEY, and Superlogical are available only from Code Mode, matching how those servers are normally reached in Pi.
Codex uses its own JavaScript tool interface; the shared MCP calls work there, but Pi's `models.classify` API and `jev_pipeline` extension tool do not carry over.
Use Jev's MCP classifier tools in Codex, or run Pi through `$pi-skill` for a Pi-native workflow.
Do not disable Codex Code Mode and expect the Code-Mode-only MCP tools to remain callable.
Codex keeps the `node_repl` and `computer-use` servers the ChatGPT app installs for its browser and computer use.
See [MCP setup and configuration](mcp/README.md) for more details.

Two things worth knowing:

- Browser work uses `agent-browser` with an isolated profile, including when a site needs a sign-in.
  `cua-driver` remains available in Pi for native apps; agents never attach to your personal browser profile.
- HEY has read/write access to mail, calendars, todos, and contacts.
  Change its args to `["mcp", "--read-only"]` in each harness's config to limit it to reads.

### Guardrails

Codex's `stow/codex/.codex/hooks.json` runs the shared scripts in `stow/codex/.codex/hooks/` to block dangerous shell commands and hand edits to generated files.
Claude Code links to those scripts from its hooks directory.
Pi's `agent-guardrails` extension runs them through compatibility links in `~/.pi/agent/guardrails/` because a `~/.pi/agent/hooks/` directory triggers a deprecation prompt.
OpenCode's standalone `guardrails` plugin uses the same shell-command script but does not run the generated-file rules.
Rails extras: schema and lockfile edits are blocked, destructive `db:` tasks require `RAILS_ENV=test`, and production Rails commands are blocked.
Codex uses the shared `jev` skill and MCP server for the judgment checks specified in `AGENTS.md`; the automatic Pi extension and Claude Code mod remain specific to those harnesses.
Test the shell rules with `bash test/agent_guardrails_test.sh "$PWD"`.

### Planning and review

Plans are project Markdown files and are implemented only after explicit approval.
In Codex, Plannotator reviews plans through the `Stop` hook in `stow/codex/.codex/hooks.json`.
Keep the Plannotator marketplace plugin disabled in Codex because its Claude Code hook manifest uses the unsupported `modules` field.
In Pi, use the native Plannotator integration to open a review and send feedback directly to the active session.
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
pnpm --dir test install --frozen-lockfile
pnpm --dir test test                          # Pi extension tests
pnpm --dir test run typecheck                 # Pi extension types (tsc-ts)
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
Run `brew bundle --file=Brewfile`, then `./scripts/stow.sh apply`, then `exec bash --login`.

**Herdr config or agent state looks stale.**
Confirm `readlink ~/.config/herdr/config.toml` points into `stow/herdr/`, run `herdr server reload-config`, and check `herdr integration status`.
Herdr keeps the previous keymap when bindings are invalid; details are in `~/.config/herdr/herdr-server.log`.
