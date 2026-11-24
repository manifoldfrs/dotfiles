# Rex Terminal and `agentbox`

Rex (beta) is the default terminal and multiplexer on macOS and iOS.
Its tracked configuration lives in [`stow/rex/.config/rex/init.lua`](../stow/rex/.config/rex/init.lua) alongside the Lua modules it requires for keybindings, editor `Cmd` keys, annotations, and Neovim split navigation.
Bindings in `init.lua` also apply to sessions on remote hosts.

## Local setup

Rex installs from its DMG and updates itself, so install it separately from Homebrew.
Rex does not add its CLI directory to `PATH`; `stow/bash/.config/bash/environment.bash` adds `$REX_BIN_DIR`.

After running `./scripts/stow.sh apply`, quit Rex and run `./scripts/rex_prefs.sh load` once per Mac to restore tracked app settings (see [App settings](#app-settings-one-time-per-machine)); `scripts/bootstrap.sh` does not run this automatically.
Then open a Rex pane configured for Bash login (so `$REX_BIN_DIR` is on `PATH`), reload and verify the keymap, and register Rex's agent hooks:

```bash
rex config reload
rex keymap   # should load without warnings
rex skill setup --session-naming
```

Open Neovim once so lazy.nvim installs `vim-rex-navigator`.
With that plugin, `Ctrl-h/j/k/l` moves between Neovim splits and hands off to the adjacent Rex (or Herdr) pane at a split's edge.

## Keybindings

`Ctrl-a` is the prefix, matching tmux and Herdr.
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

Annotations reuse Herdr's `herdr-annotate` binary through the `rex-annotate` helper.
Bootstrap installs this plugin, or you can run `herdr plugin install plannotator/herdr-annotate --yes`.
Rex has no selection API yet, so annotations read the clipboard: select text first (with copy on select enabled), then press `Ctrl-a a`.

## App settings (one time per machine)

Theme, font, and GUI settings live in the app (`com.superlogical.rex.plist`), not in `init.lua`.
`scripts/rex_prefs.sh` tracks the `Workspace.*` settings (themes, font, tabs, cursor, padding) in `rex/preferences.plist`:

```bash
./scripts/rex_prefs.sh save    # copy current Rex settings into the repo
./scripts/rex_prefs.sh load    # restore them (quit Rex first)
./scripts/rex_prefs.sh watch   # LaunchAgent that runs save whenever Rex changes a setting
```

Window positions, sessions, and server or host state stay machine-local.
Configure the remaining app settings once per Mac:

- [ ] Shell launcher: Bash in login mode, which starts Fish interactively.
- [ ] Terminal: copy on select, Option as Alt, blinking block cursor, padding color matching the background, fade inactive panes.
- [ ] Notifications: macOS notifications for blocked and finished programs, sounds off.
- [ ] Rex Server: Remote Control on (`rex do` and agents need it).
- [ ] Put Rex in the Dock and login items in place of Ghostty.

## Remote server on `agentbox`

`agentbox` (an Ubuntu droplet on the tailnet) runs the Rex login server so sessions keep running while the Mac is closed and survive Rex upgrades.
Rex on Linux is server only; you view and type into `agentbox` sessions through the Mac or iOS app.
First clone and apply dotfiles as `frshbb` on `agentbox` (see [README.md](../README.md#agentbox-ubuntu)) before running the root server setup below.

### Server setup (once, as root on `agentbox`)

```bash
ssh root@agentbox
export REX_PACKAGE_TOKEN=...   # from the Linux install command on the Rex docs page; never commit it
curl -fsSL -u "rex:$REX_PACKAGE_TOKEN" https://pkgs.superlogical.com/rex/install.sh | sh
sudo -u frshbb git -C /home/frshbb/code/personal/dotfiles pull
/home/frshbb/code/personal/dotfiles/scripts/rex_server_setup.sh
```

What `rex_server_setup.sh` configures:

- Installs `server/rex/accounts.jsonc` so only `tailscale:manifoldfrs@github` can connect, mapped to `frshbb`.
- Installs a systemd drop-in that listens on the tailnet at port `7297`.
- Pins the `rex` package to Superlogical's repository with `server/rex/apt-preferences.d/rex`.
  Ubuntu ships an unrelated Perl tool named `rex` with a higher version number, and without that pin `apt` can install it over Superlogical's package; the script reinstalls Superlogical's package if that already happened.
- Refuses to run if the packaged `ExecStart` no longer matches the tracked drop-in.
  If an upgrade changes `ExecStart`, copy the new line from `systemctl cat rex-login-server` into the drop-in, keep `--extra-listen tailnet://:7297` at the end, and rerun the script.

The login server starts on boot.
Your account's server starts when you connect and exits once its last session ends.

After root setup, run this as `frshbb` on `agentbox`:

```bash
rex skill setup --session-naming
```

Always pass `--session-naming`.
Without it, newer Rex builds rewrite the tracked agent hooks to disable session naming, causing the Mac and `agentbox` to drift apart.

Rex updates arrive with `apt full-upgrade`; pin a release with `sudo apt-mark hold rex` when it needs to wait.

### Mac app setup (once per Mac)

In the Rex app, choose **Add Remote Host…** with URL `http://100.82.139.102:7297` and name `agentbox`.
`init.lua` declares the same host, but only the CLI (`rex hosts list`, `rex -S agentbox`) reads it.

- Use `agentbox`'s Tailscale IPv4 address, not its `ts.net` name: the hostname also resolves to IPv6, which causes panes to hang on "Opening terminal…" ([Rex bug](https://discord.com/channels/1546797889009881158/1564343288335564820)).
- The Mac app requires Rex preview.21 or newer to connect to a plain-HTTP tailnet address; older builds show the host as Disconnected.
- If `agentbox` is removed from and re-added to the tailnet, its IP can change; update both `init.lua` and the app's host entry to match.

### Signing in to tools from `agentbox`

A browser sign-in started on `agentbox` redirects your Mac's browser to `http://127.0.0.1:<port>/...`, where nothing is listening on the Mac.
The browser shows "This site can't be reached" while the login command on `agentbox` keeps waiting.
This affects sign-in for Codex, Claude Code, and `hey auth login`.

Finish the sign-in from the Mac with `agentbox-auth`:

1. Start the sign-in on `agentbox` and leave it waiting.
2. Open the printed URL in your Mac browser and approve access.
3. On the "This site can't be reached" page, copy the full URL from the address bar.
4. On the Mac, run:

   ```bash
   agentbox-auth
   ```

`agentbox-auth` reads the callback URL from the clipboard and replays it on `agentbox`, where the waiting sign-in receives it and finishes.
You can also pass the URL directly or target a different host: `agentbox-auth '<address>' <host>`.
Keep the single quotes so the shell does not split the URL at `&`.
When run on `agentbox` itself (which has no clipboard), pass the URL as an argument and it requests it locally.
Each callback URL works once and only while the sign-in is still waiting; if `agentbox-auth` cannot connect, restart the sign-in.

### Daily use on the Mac

`rexbox` opens an `agentbox` session in the Rex app, creating it first if needed:

```bash
rexbox                                  # list sessions on agentbox
rexbox opto2 code/optoai/opto2          # open opto2, creating it in ~/code/optoai/opto2 on agentbox
rexbox opto2                            # open an existing session
rex -S agentbox kill opto2              # end a session
```

You can also click **agentbox** in the app's sidebar and pick a session.
Closing a session's last tab ends the session along with anything running in it.

### On the iPhone

Rex for iOS (beta) connects to the same `agentbox` sessions as the Mac.
With Tailscale signed in to the same account, add a remote host with URL `http://100.82.139.102:7297` and name `agentbox`, using the IPv4 address for the same IPv6 reason as on the Mac.

## Troubleshooting

- **Connection refused:** you ran `rex -S agentbox` on `agentbox` itself, where the name resolves to loopback; run it on the Mac.
- **Session starts in the wrong folder:** raw `rex -S agentbox new -c` expands `~` on the Mac to `/Users/frshbb`; pass `/home/frshbb/...`, or use `rexbox` with a path relative to the `agentbox` home directory.
- **Panes stuck on "Opening terminal…":** verify the app's host URL uses the Tailscale IPv4 address; if local panes spin too, quit and reopen the app.
- **Server logs:** run `journalctl -u rex-login-server` on `agentbox`.

## Known Rex beta gaps

Features from the previous Ghostty + Herdr setup that Rex does not have yet:

- No detach: closing a session's last tab destroys the session, so `Ctrl-a q` and `Ctrl-a d` are unbound.
- No close confirmation for panes or tabs with running programs.
- No last-pane toggle (`Ctrl-a ;`) and no keyboard copy mode (`Ctrl-a [`).
- No selection API (annotations read the clipboard), no remote image paste, and no dragging screenshot thumbnails into agents.
- No built-in diff or file viewer: use Neovim diffview (`<leader>gD`) or `hunk`.
- No background opacity or blur, no `font-variation`, and appearance settings are not file-based.
