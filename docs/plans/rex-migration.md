# Rex Migration Plan

Goal: make Rex Beta the default terminal and multiplexer on the Mac and the agent workspace on `agentbox`, with every tracked setting in this repo.
Ghostty stays installed as the fallback terminal.
Herdr stays on `agentbox` for Termius phone access until Rex ships a public iOS client.

## Verified facts

Checked on 2026-10-21 against the Superlogical docs, changelog, and community feedback, and against this Mac and `agentbox`.
Versions: Rex Beta 0.1.0 (1347), CLI `0.0.1792607779-g171246`, Linux server preview.4.

- `~/.config/rex/init.lua` holds key bindings, key sequences, key modes, custom actions, and remote hosts (`rex.host{}`).
- The server reads the file; `rex config check` validates it and `rex config reload` applies it.
- Shortcuts set in the app override `init.lua`.
- Bindings and actions in the Mac's `init.lua` also work in remote sessions, so `agentbox` needs no `init.lua` (team answer on feedback 1559455763385155655).
- Theme, font, notifications, shell, integrations, and other GUI settings are app settings stored in `com.superlogical.rex.plist`, with no Lua API.
- The app's "Migrate theme from Ghostty config" imports the 256-color palette, light/dark pairs, font family, and font size.
- Rex sets `REX_BIN_DIR` in every terminal but does not put `rex` on `PATH`; shells must add it.
- `rex skill setup` adds a Claude `SessionStart` hook, `/bin/sh -c 'rex __internal session-start --agent claude 2>/dev/null || true'`, which works on any machine with `rex` on `PATH`.
- Its skills are stubs that call `rex __internal skill`, so they never go stale.
- Hosts saved in the app also show in the CLI (preview.18).
- The Linux login server keeps sessions across upgrades, keeps systemd drop-ins and `/etc/rex/accounts.jsonc` across upgrades, and its `tailnet://:7297` listener needs no Tailscale HTTPS certificates.
- Not available yet: detach, close confirmation, keyboard copy mode, remote image paste, file or diff viewer, `rex attach` (removed in preview.18), and a public iOS client.
- The docs site shows "Block Plugins" and "Resources and Limits" pages to logged-in testers that are not in the MCP or the public docs; this plan did not read them.

## Phase 1: Shell PATH (Mac)

- [x] In `stow/bash/.config/bash/environment.bash`, add `[[ -n ${REX_BIN_DIR:-} ]] && path_prepend "$REX_BIN_DIR"` after the Ghostty line.
- [x] Add a `REX_BIN_DIR` case to `test/bash_path_test.sh`.

## Phase 2: `stow/rex` package (Mac only)

- [x] Create `stow/rex/.config/rex/init.lua`, split into `keys.lua` and `actions.lua` with `require`.
  Done as `init.lua` requiring `keys.lua`, `annotate.lua`, and `navigator.lua`.
- [x] Port the Herdr prefix bindings as `ctrl+a>` key sequences, plus `ctrl+a>ctrl+a` to send `ctrl+a` through.
  Write each key unshifted, as the docs require: `%` is `shift+5`, `"` is `shift+'`, `$` is `shift+4`, `(` and `)` are `shift+9` and `shift+0`, `&` is `shift+7`, and `?` is `shift+/`.
  Done; `r` uses the client's built-in `client.config.reload` instead of a custom action.

  | Herdr key | Herdr action | Rex |
  | --- | --- | --- |
  | `s`, `w` | workspace picker | `session.switch` |
  | `shift+n` | new workspace | new session action |
  | `$` | rename workspace | session rename action |
  | `(`, `)` | previous/next workspace | session previous/next, if the client has them |
  | `d` | close workspace | session close, which destroys it; consider leaving unbound |
  | `c` | new tab | `client.tab.new` |
  | `n`, `p` | next/previous tab | `client.tab.next`, `client.tab.previous` |
  | `1..9` | switch tab | `client.tab.goto` with `index` |
  | `,` | rename tab | tab rename action |
  | `&` | close tab | tab close action |
  | `%`, `"` | split right/down | `pane.split` with `direction` |
  | `h`, `j`, `k`, `l` | focus pane | focus-direction action |
  | `o` | next pane | next-pane action |
  | `;` | last pane | not available yet (accepted request) |
  | `x` | close pane | `pane.close` |
  | `z` | zoom | `pane.zoom` |
  | `shift+r` | resize mode | exclusive `resize` key mode with `pane.resize` and `pane.balance` |
  | `b` | toggle sidebar | `client.sidebar.toggle` |
  | `r` | reload config | custom action running `rex config reload` through `rex.exec` |
  | `?` | help | command palette action |
  | `[` | copy mode | not available |
  | `q` | detach | not available |

- [x] Confirm every action name with `rex -C <mac-client> actions` before writing it, because the client defines them; `rex keymap` must show no warnings.
- [x] Check the app for shortcuts set with **Change Shortcut…**, because those override `init.lua`, and a sequence hides any app shortcut on `ctrl+a`.
  Done: the app has no shortcuts set with Change Shortcut….
- [x] Follow the custom action rules: lowercase names with underscores and no dots, declared `args`, `rex.exec` instead of `os.execute`, and `error(err, 0)` on failed calls.
  Actions must finish within 30 seconds, so anything long-running opens in a split instead of running inside the action.
- [x] ~~Port the two Ghostty keybinds: `ctrl+shift+c` to the client copy action, and `cmd+c` to a Lua function that writes `\x1b[99;6u` with the terminal block's `write` method.~~
  Dropped by decision on 2026-10-21: Rex has no copy action, so `ctrl+shift+c` cannot be bound, and both binds were tmux-era workarounds (commit 1a09933); remapping `cmd+c` would break Rex's native copy.
- [x] Replace Herdr's `vim-herdr-navigation` with `pankrashin/vim-rex-navigator`: its Rex half in `init.lua`, and its Neovim half as a new plugin spec in `stow/nvim/.config/nvim/lua/plugins/`.
  Done differently: the plugin spec only installs the plugin for its Rex half, because `after/plugin/herdr-navigation.lua` owns Neovim's Ctrl-h/j/k/l and now hands off to Herdr or Rex; `navigator.lua` binds Rex's Ctrl-h/j/k/l itself, because the plugin's own focus keys leave warnings in `rex keymap`.
- [x] Port all five Plannotator annotate bindings as custom actions, as far as Rex allows:
  - `annotate.open`, `annotate.last`, and `annotate.manage` open a split running the matching Plannotator command.
  - `annotate.capture` and `annotate.copy-context`: Rex has no API for selected text, so capture the focused terminal's screen with the terminal block's `format` method and hand that text to Plannotator.
  - First check which Plannotator commands work outside Herdr; record anything that cannot be ported.
  Done with floating layers instead of splits: capture opens `herdr-annotate editor` (through `rex-annotate`) on the clipboard selection or text passed by Neovim's visual `<leader>a`, rather than the whole screen; copy-context, copy-archive, and manage run `herdr-annotate` directly; open and last were ported and then removed by decision on 2026-10-21, because they are unused.
- [x] Declare the droplet: `rex.host{ label = "agentbox", endpoint = "http://agentbox.tail52943f.ts.net:7297" }`.
- [x] Add `rex` to `STOW_PACKAGES` in `scripts/stow.sh` and `scripts/validate-dotfiles.sh`, Mac only, matching how `zed` and `cursor` are handled.
  `zed` and `cursor` are stowed on every OS, so `rex` is too.
- [x] Add `init.lua` and its required files to `scripts/backup.sh`.
- [x] In `scripts/validate-dotfiles.sh`, run `rex config check stow/rex/.config/rex/init.lua` when `rex` is available; warn and skip otherwise (Docker).

## Phase 3: App settings (manual, documented in the README)

- [x] Run "Migrate theme from Ghostty config" to import TokyoNight Night and MonoLisaCode 14.
  Done with `client.theme.import` of Ghostty's `TokyoNight Night` theme file, set for both light and dark appearance. The font is not set: Rex has no action or documented setting for it.
- [ ] Check whether MonoLisa's `cv05` and `cv09` font features carry over; the docs do not say.
- [ ] Shell: `/opt/homebrew/bin/bash --login`.
- [ ] Terminal: copy on select, Option as Alt, block cursor with blink, padding color matching the background, and fade for inactive panes (Ghostty used 0.97).
- [ ] Notifications: macOS notifications for blocked and done; sounds off, matching Herdr's `ui.sound = false`.
- [x] Turn on Remote Control, which agents and `rex do` need to drive the app.
- [ ] Integrations: decide on automatic session naming for agent sessions.
- [ ] Add Rex to the Dock and login items in place of Ghostty.

## Phase 4: Agents (Mac)

- [x] Run `rex skill setup`.
  It writes the `SessionStart` hook through the stow symlinks into `stow/claude/.claude/settings.json` and `stow/codex/.codex/hooks.json`, so the hooks become tracked.
  It puts untracked stub skills in `~/.claude/skills/rex` and `~/.agents/skills/rex`.
- [x] Confirm both settings files are still symlinks afterward, then review and commit the hook diff.
  Symlinks confirmed; nothing is committed.
- [ ] Approve the new hook in Codex with `/hooks`, and make sure Claude Code trusts the working folders.
- [x] In `scripts/bootstrap.sh`, run `rex skill setup` when `rex` is available; it is idempotent.
- [x] Keep the `herdr` skill while Herdr stays on `agentbox`.

## Phase 5: Rex server on `agentbox`

Root steps go through `ssh root@agentbox`, because `frshbb` has no sudo.

- [ ] Install from the logged-in install command on the docs page; keep `REX_PACKAGE_TOKEN` out of the repo.
- [x] Add tracked server files under `server/rex/`:
  - `accounts.jsonc` letting `tailscale:manifoldfrs@github` in as `frshbb`, with that as the default.
  - `rex-login-server.service.d/override.conf` with the `tailnet://:7297` listener and `After=`/`Requires=tailscaled.service`.
    Copy `ExecStart` from the installed unit (`systemctl cat rex-login-server`) and append only `--extra-listen`, because the docs say to keep the original options.
  The setup script refuses to install the drop-in if the packaged `ExecStart` differs from the tracked one.
- [x] Add an idempotent `scripts/rex_server_setup.sh` that installs both files with `install -m`, runs `systemctl daemon-reload`, enables and starts `rex-login-server.service`, and reloads it after a change.
- [ ] Verify with `systemctl status rex-login-server`, `journalctl -u rex-login-server.service`, and `rex server status`.
- [ ] As `frshbb`, run `rex skill setup`; the tracked hooks should report `unchanged`, and only the stub skills are created.
- [ ] Check that no host firewall (ufw) blocks port 7297 on `tailscale0`.
  DigitalOcean's Cloud Firewall needs no change, because the traffic travels inside Tailscale.
- [x] Tailscale: no change needed; HTTPS certificates stay off.
- [x] Keep Plannotator's remote setup (`PLANNOTATOR_REMOTE=1`) unchanged.

## Phase 6: Connect and prove it works

- [x] `rex hosts list` shows `agentbox` from `init.lua`, and the app's session picker lists it.
- [ ] `rex -S agentbox ls` works from the Mac.
- [ ] On `agentbox`, `rex client ls` shows the Mac's connection with the `principal` `tailscale:manifoldfrs@github`, and nothing else connected.
- [ ] Start Claude Code and Pi in a Rex session on `agentbox`; close the lid; reopen and confirm the output is intact and status indicators work.
- [ ] Upgrade the package on `agentbox` while an agent runs, and confirm the session survives.
  Then compare `rex version` with `rex server status`: the account server keeps the old version until its sessions end.
  Use `apt-mark hold rex` when an upgrade must wait.
- [ ] Reboot `agentbox` and record what survives; running programs will not.

## Phase 7: Docs and tests

- [x] README: stack table (Rex default, Ghostty fallback), Rex key bindings, stow command lists, the app settings checklist from Phase 3, the `agentbox` Rex server section, and the Ghostty Shift+Cmd link-click note.
- [x] `AGENTS.md` repository layout, plus `CONTEXT.md` if the configuration lifecycle changes.
- [x] Add a Rex note to `docs/plans/remote-agent-server.md`.
- [x] `test/run_tests.sh`: content checks for `init.lua` (prefix, `agentbox` host) and the server files, like the existing Ghostty checks.
- [x] Change the bootstrap closing message from "Restart Ghostty" to Rex.

## Not in this migration

- Keep `cask "ghostty"`, `stow/ghostty`, and the Ghostty `PATH` entry.
- Keep Herdr, Mosh, and the Termius host on `agentbox` for phone access.
- Revisit once Rex adds detach, close confirmation, copy mode, a diff viewer, remote image paste, or an iOS client.

## Live changes that need separate approval

Each of these changes the running Mac or droplet, so each needs a go-ahead after the repo changes are validated:

- Stowing `rex` and the Bash change, then `rex config reload`.
- `rex skill setup` on the Mac and on `agentbox`.
- Every root step on `agentbox`.
- App settings, which you change in the app.

## Decisions

1. Remote listener: the tailnet address on port 7297.
   The docs call Tailscale Serve the usual way to reach a login server, but it needs HTTPS certificates turned on for the whole tailnet; the tailnet address is the documented alternative and identifies callers the same way.
2. Navigator: `pankrashin/vim-rex-navigator`.
3. Plannotator annotate: port as much as Rex allows.
4. Ghostty copy keybinds: dropped.
5. Plannotator `open` and `last` reviews: removed as unused.
6. `stow/rex` is stowed on every machine, including `agentbox`, so Neovim there can hand Ctrl-h/j/k/l to Rex panes.
