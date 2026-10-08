# Remote Agent Server Checklist

Goal: run Pi, Claude Code, Codex, and OpenCode inside Herdr on a DigitalOcean Droplet so agents keep working while the MacBook is closed.
The Mac becomes a thin client: `herdr` on the Mac shows the Droplet's panes over SSH through Tailscale.

Shape:

```text
MacBook (Herdr client) ──ssh over Tailscale──▶ Droplet "agentbox"
                                               ├─ Herdr server (keeps panes alive)
                                               ├─ pi / claude / codex / opencode
                                               ├─ ~/code/personal/dotfiles (this repo, stowed)
                                               └─ ~/code/... (repos the agents work on)
```

Estimated cost: $24/month for a Basic Regular Droplet with 4 GiB and 2 vCPUs, plus 20% if weekly backups are enabled.
DigitalOcean bills powered-off Droplets, so destroy the Droplet (optionally after a snapshot) to stop billing.

## Phase 0: Make the tracked config work on macOS and Linux

The standard for one Stow repo shared between a Mac and Linux machines has three parts, in this order:

1. Do not hardcode paths; let `PATH`, `~`, and `#!/usr/bin/env` find things.
2. Use a small `uname` check only where the two systems really differ.
3. Keep the rest in untracked machine-local files, like `~/.config/bash/local.bash`.

Templating tools (chezmoi) and Nix Home Manager are the heavier standard; this repo has too few differences to need them.
An earlier pass already applied rule 1 to Herdr (`default_shell = "bash"`), recorded in `docs/research/cloud-agents-vps-and-phone.md`.
These tracked entries still assume macOS or the Mac's checkout location:

| File | Problem on Linux | Change |
| --- | --- | --- |
| `stow/pi/.pi/agent/settings.json` | `shellPath` is `/opt/homebrew/bin/bash`. Pi throws `Custom shell path not found` when the path is missing, so every Pi Bash call fails. Pi expands `~/` but does not look a bare `bash` up on `PATH`. | Set `shellPath` to `~/.local/bin/bash`, the example in Pi's own docs. `scripts/stow.sh apply` creates that link (rules below). |
| `stow/pi/.pi/agent/mcp.json`, `stow/opencode/.config/opencode/opencode.jsonc` | `codex-chrome` starts `/opt/homebrew/bin/codex-control-chrome-mcp`. | Use the bare command `codex-control-chrome-mcp`, like the existing `claude` and `npx` entries. On Linux that one server fails to start and the rest load; update the README note that names the absolute path. |
| `stow/codex/.codex/config.toml` | Mostly state written by the ChatGPT desktop app: `/Applications/ChatGPT.app` binaries, versioned plugin-cache paths, `CODEX_HOME=/Users/frshbb/.codex`, and a Computer Use `notify` command. | On Linux, leave this one file out of Stow and out of `CODEX_BACKUP_TARGETS`, and still link the package's `AGENTS.md` and hooks. Codex creates its own server `config.toml` on first run; copy over the few top-level settings you want (`model`, reasoning effort). |
| `stow/codex/.codex/hooks.json` | The Stop hook runs `/Users/frshbb/.local/bin/plannotator`. | Use `~/.local/bin/plannotator` or the bare `plannotator`, whichever form Codex hooks accept, and decide whether the server runs Plannotator at all (see decisions). |
| `stow/opencode/.config/opencode/opencode.jsonc`, `stow/claude/.claude/settings.json` | OpenCode plugin paths and `CLAUDE_CODE_PLUGIN_DIRS` point into `~/code/personal/dotfiles`. | No change: clone the repo to that same path on the server (Phase 6). |
| `stow/bash/.config/bash/aliases.bash`, `environment.bash` | The `pbc`/`pbp` aliases and the FZF `ctrl-y` copy binding call `pbcopy`/`pbpaste`. | No change: they only fail when used, which is cosmetic on a headless server. |
| `stow/bash/.config/bash/environment.bash` | `path_prepend` returned status 1 for a missing directory, so sourcing it under `set -e` exited on Linux, where `/Applications/...` does not exist; `test/bash_path_test.sh` failed in Docker on `HEAD`. | `return 0` for a missing directory. |

Rules for the `~/.local/bin/bash` link in `scripts/stow.sh apply`:

- Pick the target from an explicit candidate per OS, not from `command -v bash`: `$(brew --prefix)/bin/bash` on macOS, `/bin/bash` on Linux.
  `command -v bash` is unsafe because `environment.bash` puts `~/.local/bin` ahead of Homebrew, so a second apply would find the link itself.
- Check that the target runs and reports Bash 4 or newer; otherwise warn and leave the link alone.
- Leave an already-correct link alone, replace a link that points elsewhere or nowhere, and stop with an error if a regular file sits there.
- Do not track a `bash` entry in `stow/bin`; it shares `~/.local/bin` safely because Stow runs with `--no-folding`.

Rules for the Codex config on Linux:

- Pass `--ignore='^\.codex/config\.toml$'` to every Stow call (apply, dry-run, delete) and to `scripts/validate-dotfiles.sh`; Stow 2.4 matches ignore patterns against package-relative paths.
- Drop `~/.codex/config.toml` from the Linux backup targets, so `apply` stops moving the server's own config aside.
- If `~/.codex/config.toml` is still a link into the repo, remove only that link once.

Decisions:

- `shellPath`: Jev `jev_decide` chose the `~/.local/bin/bash` link (0.66) over deleting `shellPath` (0.24), because deleting it drops the Mac to Apple Bash 3.2.
  Do not create `/opt/homebrew` on the server, because `stow/bash/.config/bash/environment.bash` checks that prefix first and would pick the wrong Homebrew.
- Plannotator on the server: **decided, install it** (Phase 8) and set `PLANNOTATOR_REMOTE=1` (Phase 7), so review pages open at `http://agentbox:19432` over the tailnet.
  A Stop hook waits for a browser review, so an agent that asks for one pauses until you open that page from the Mac or phone.

Steps:

- [x] Make the table's changes, the link step, and the Linux Codex rules.
- [x] Extend `test/stow_preflight_test.sh`: link creation with a minimal `PATH`, repeat apply, an existing regular file, a dangling link, and a server-local `config.toml` that survives two applies while `AGENTS.md` and hooks stay linked.
- [x] Run the fast preflight from `AGENTS.md`, the Docker suite (Ubuntu), then `scripts/stow.sh dry-run`.
- [x] With approval, run `scripts/stow.sh apply` on the Mac; `~/.local/bin/bash` links to Homebrew Bash 5.3, and a second apply changes nothing.
- [x] Re-trust the changed Codex Stop hook in `/hooks`.
- [x] Commit and push.

## Phase 1: Create the Droplet

- [ ] Create an SSH key for this Droplet on the Mac: `ssh-keygen -t ed25519 -f ~/.ssh/agentbox -C "agentbox"`.
- [ ] In the DigitalOcean console, create a Droplet:
  - Image: Ubuntu 24.04 LTS (x86_64).
  - Plan: Basic, Regular, 4 GiB / 2 vCPUs / 80 GiB ($24/month). The $12 plan with 2 GiB runs out of memory with Node builds and several agents.
  - Region: the one closest to you.
  - Authentication: SSH key, upload `~/.ssh/agentbox.pub`. Do not use password authentication.
  - Hostname: `agentbox`.
  - Optional: enable weekly backups.
- [ ] Note the public IPv4 address; it is only needed until Tailscale is up.

## Phase 2: Base server setup

Run as `root` over the public IP the first time: `ssh -i ~/.ssh/agentbox root@<public-ip>`.

- [ ] Update packages: `apt update && apt full-upgrade -y`, then reboot if a kernel update was installed.
- [ ] Create your user, matching the Mac username so `$HOME`-relative paths line up:

  ```bash
  adduser --gecos "" frshbb
  usermod -aG sudo frshbb
  rsync -a --chown=frshbb:frshbb ~/.ssh /home/frshbb/
  ```

  Give `frshbb` a sudo password and do not add `NOPASSWD`.
  The agents run unattended as this user, so passwordless sudo would give a runaway or prompt-injected agent root, including the power to turn off Tailscale or the firewall.
  Keep the password in your password manager; you only need it for `apt`, reboots, and Phase 3.

  Trust boundary: a sudo password slows an agent down but does not isolate it.
  Agents running as `frshbb` can read every credential that user owns and edit its shell startup files, so `chmod 600` protects secrets from other users, not from the agents.
  Do admin work (`sudo`, Tailscale, firewall) in a separate SSH session, never in an agent pane, and keep DigitalOcean and Tailscale admin credentials off the server.
  If agent-to-root escalation must be impossible, run agents under a second account with no sudo; this plan accepts the single-account risk for simplicity.

- [ ] Keep user processes alive after SSH disconnects: `loginctl enable-linger frshbb`.
  Ubuntu does not kill them by default, but linger makes it explicit.
- [ ] Add swap so a memory spike slows agents down instead of killing them:

  ```bash
  fallocate -l 4G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  ```

- [ ] Install build prerequisites for Linuxbrew: `apt install -y build-essential procps curl file git`.
- [ ] Disable root and password SSH login with a drop-in, `/etc/ssh/sshd_config.d/10-hardening.conf`, containing `PermitRootLogin no` and `PasswordAuthentication no`.
  Ubuntu reads drop-ins first and the first value wins, so a cloud-init drop-in can override edits to the main file.
- [ ] Run `sshd -t` (syntax), then `sshd -T | grep -Ei '^(permitrootlogin|passwordauthentication)'` and confirm `no` for both before `systemctl restart ssh`.
- [ ] From a second Mac terminal, verify `ssh -i ~/.ssh/agentbox frshbb@<public-ip>` works and `sudo -v` accepts the password, before closing the root session.
- [ ] From here on, run everything as `frshbb`, not root; confirm with `id -un` and `echo $HOME`.

## Phase 3: Tailscale

- [ ] Install Tailscale on the Mac from https://tailscale.com/download and sign in.
- [ ] On the server: `curl -fsSL https://tailscale.com/install.sh | sh`, then `sudo tailscale up --hostname=agentbox`.
- [ ] Open the printed URL to add the server to your tailnet.
- [ ] In the Tailscale admin console Machines page, disable key expiry for `agentbox` so the server does not drop off the tailnet.
- [ ] Use regular OpenSSH over the tailnet rather than Tailscale SSH (`--ssh`).
  Tailscale's default SSH policy uses check mode, which requires browser re-authentication every 12 hours and would break Herdr's unattended background reconnects.
- [ ] From the Mac, verify `ssh -i ~/.ssh/agentbox frshbb@agentbox` works over MagicDNS.
- [ ] Test the break-glass path before closing public access: open the Droplet's **Recovery Console** in DigitalOcean, log in as `frshbb` with the sudo password, and run `sudo -v`.
  The Recovery Console works without network access, so it still works when the firewall or Tailscale is broken.
- [ ] In DigitalOcean, attach a Cloud Firewall to the Droplet with **no inbound rules** and the default allow-all outbound rules.
  Tailscale only needs outbound connectivity, so public SSH is now closed.
- [ ] Verify `ssh frshbb@<public-ip>` now times out while `ssh frshbb@agentbox` still works.
- [ ] Check the connection type with `tailscale ping agentbox` from the Mac.
  If it reports `via DERP` and the phone feels laggy, add one inbound Cloud Firewall rule for UDP 41641 so peers can connect directly.

## Phase 4: Mac SSH config

- [ ] Add to `~/.ssh/config` on the Mac:

  ```text
  Host agentbox
    HostName agentbox
    User frshbb
    IdentityFile ~/.ssh/agentbox
    IdentitiesOnly yes
    ServerAliveInterval 30
  ```

- [ ] Verify `ssh agentbox` works with no extra flags.
- [ ] Install Ghostty's terminfo on the server so plain SSH sessions render correctly: `infocmp -x xterm-ghostty | ssh agentbox -- tic -x -`.

## Phase 5: Toolchain on the server

Use Linuxbrew, because `stow/bash/.config/bash/environment.bash` already detects `/home/linuxbrew/.linuxbrew` and it keeps tool names identical to the Mac.
Do not run `brew bundle` with the full `Brewfile`; it includes casks and heavy packages (Qt, OpenJDK, PostgreSQL) that the server does not need.

- [ ] Install Homebrew: `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`, then `eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"`.
- [ ] Install the agent-relevant subset:

  ```bash
  brew install git stow ripgrep fd fzf jq bat eza zoxide starship neovim lazygit tree glow gh mise node oven-sh/bun/bun herdr
  ```

- [ ] Keep `/bin/bash` as the login shell; Ubuntu 24.04 ships Bash 5.2, so there is no reason to switch to Linuxbrew Bash.

## Phase 6: Dotfiles

- [ ] Give the server its own GitHub credentials, because agents need git while the Mac is closed and a forwarded SSH agent disappears when the Mac disconnects.
  Create a fine-grained personal access token with only the repos the agents should touch, Contents read/write, any other permission they actually need (for example Pull requests), and an expiry date.
  Phase 7 exports it as `GH_TOKEN` in `local.bash`; until then, `export GH_TOKEN=...` in the current shell.
  Run `gh auth setup-git` so HTTPS git uses it, and set a calendar reminder to rotate it before it expires.
- [ ] Clone this repo to the same path as on the Mac, because the OpenCode plugin paths and `CLAUDE_CODE_PLUGIN_DIRS` point there:
  `git clone https://github.com/manifoldfrs/dotfiles.git ~/code/personal/dotfiles`.
- [ ] Preview: `cd ~/code/personal/dotfiles && ./scripts/stow.sh dry-run`.
- [ ] Validate in isolation: `./scripts/validate-dotfiles.sh`.
- [ ] Apply: `./scripts/stow.sh apply`.
  This is the server's own fresh home directory, but it is still a live change on that machine.
- [ ] Confirm the Phase 0 link: `readlink ~/.local/bin/bash` prints `/bin/bash`, `~/.local/bin/bash --version` reports 5.x, and `~/.codex/config.toml` is not a link into the repo.
- [ ] Do not run `scripts/bootstrap.sh`; it is macOS-specific (`dscl`, full `Brewfile`, casks).
- [ ] Open a new login shell and confirm the prompt, aliases, `rg`, `fzf`, and `nvim` work.
- [ ] Restore Neovim plugins: `nvim --headless -c "Lazy! restore" -c "qa"`.

## Phase 7: Secrets

- [ ] Create `~/.config/bash/local.bash` on the server with only the keys agents need (for example Jev/TypeSafe and provider API keys) plus the `GH_TOKEN` from Phase 6.
  Type or paste them over SSH; do not commit them, and do not blindly `scp` the whole Mac file.
- [ ] Add `export PLANNOTATOR_REMOTE=1` to `local.bash`.
  Plannotator only detects SSH sessions on its own, and agents in Herdr panes may not inherit the SSH variables.
- [ ] `chmod 600 ~/.config/bash/local.bash`.
- [ ] Copy any untracked MCP config the harnesses need from `mcp/*.json` or `mcp/*.toml`, keeping them out of git.

## Phase 8: Harnesses and auth

- [ ] Install Pi with the official installer: `curl -fsSL https://pi.dev/install.sh | sh`.
- [ ] Install Pi packages declared in `settings.json`: `pi update --extensions`, then `pi list`.
- [ ] Install the global npm tools: `grep -v '^#' ~/code/personal/dotfiles/npm-global-packages.txt | xargs npm install -g`.
- [ ] Install OpenCode 2: `curl -fsSL https://opencode.ai/v2/install | bash`.
- [ ] Install Plannotator: `curl -fsSL https://plannotator.ai/install.sh | bash`.
  It installs to `~/.local/bin/plannotator`, the path the tracked Codex Stop hook calls.
  Trust the hook in Codex's `/hooks` on the server, then confirm a review page opens from the Mac at `http://agentbox:19432` with the Cloud Firewall still closed.
- [ ] Install OpenCode plugin dependencies, mirroring `install_opencode_plugin_dependencies` in `scripts/bootstrap.sh`:

  ```bash
  for p in typesafe-ai optojr-slack tui-conveniences request-logger; do
    (cd ~/.config/opencode/plugins/$p && npm install --omit=dev --no-package-lock)
  done
  ```

- [ ] Log in to Claude Code first, because Pi's default provider is `claude-bridge`: run `claude`, then `/login`, and paste the code from the browser on the Mac.
- [ ] Log in to Codex: `codex login` (use the device-code option if offered, since the server has no browser).
- [ ] Log in to any other Pi providers with `/login` inside `pi`.
- [ ] Start each harness once (`pi`, `claude`, `codex`, `opencode`) and fix any extension or MCP errors other than the expected macOS-only ones from Phase 0.

## Phase 9: Herdr

- [ ] On the Mac: `herdr machine add agentbox`.
  It finds the Homebrew-installed `herdr` on the server, starts its background server, and saves the machine profile.
- [ ] On the server, install the agent integrations so Herdr can track agent state: `herdr integration install pi`, and likewise `claude`, `codex`, and `opencode`.
- [ ] On the server, sync Herdr plugins: `~/code/personal/dotfiles/scripts/sync_herdr_plugins.sh`.
- [ ] On the Mac, run `herdr` and confirm `agentbox` appears in the sidebar next to Local.
- [ ] Herdr does not copy local plugins, config, or secrets to the server; everything server-side comes from Phases 5–8.

## Phase 10: End-to-end verification

- [ ] Clone a real project on the server under `~/code/...`.
- [ ] In Herdr on the Mac, open a workspace on `agentbox` and start `pi`, `claude`, `codex`, and `opencode` in separate panes, each with a task that takes several minutes.
  Use new panes so they load the server's `local.bash` and provider logins.
- [ ] Close the MacBook lid for at least five minutes.
- [ ] While the lid is closed, attach from the phone (Phase 11) and confirm all four agents are still working and none is stuck on a permission or trust prompt.
- [ ] Reopen the Mac, run `herdr`, and confirm each agent's output is intact.
- [ ] Confirm an agent can `git push` from the server with its own credentials and no Mac agent forwarding.
- [ ] Reboot the Droplet (`sudo reboot`) and confirm `herdr --remote agentbox` restores the session layout; running agents do not survive a reboot, but Pi sessions can be resumed with `/resume`.

## Phase 11: Phone access (Galaxy Fold 8)

The phone is another thin client, like the Mac.
Agents keep running in Herdr on the Droplet; the phone only attaches to them.

- [ ] Install the Tailscale app from Google Play and sign in to the same tailnet.
- [ ] Install Termius from Google Play.
  The free Starter plan includes SSH, Mosh, port forwarding, SFTP, a special-key toolbar, and tabs; Pro ($15/month or $119/year) mainly adds encrypted vault sync across devices.
- [ ] In Termius, generate an ed25519 key named `fold8` and copy its public key.
  Give the phone its own key; do not copy `~/.ssh/agentbox` from the Mac, so a lost phone can be revoked on its own.
- [ ] Append the public key to `~/.ssh/authorized_keys` on `agentbox` from the Mac: `ssh agentbox 'cat >> ~/.ssh/authorized_keys'`, paste the key, then press Ctrl-D.
- [ ] In Termius, add a host `agentbox` with hostname `agentbox`, user `frshbb`, and the `fold8` key.
- [ ] Optional: install Mosh on the server (`sudo apt install -y mosh`) and enable Mosh for the host in Termius, so sessions survive switching between Wi-Fi and cellular.
  Use `apt` rather than Homebrew so `mosh-server` lives in `/usr/bin`, where Termius finds it without shell setup.
  Mosh uses UDP ports 60000–61000, which travel inside the tailnet; verify it connects with the Cloud Firewall from Phase 3 still closed.
- [ ] Verify: connect from the phone, run `herdr`, attach to a running Pi pane, lock the phone for a few minutes, then reconnect and confirm the agent kept working.
- [ ] To revoke a lost phone, delete its line from `~/.ssh/authorized_keys` and remove the device in the Tailscale admin console.

Alternative clients:

- Termux (from F-Droid or GitHub) works as a free, open-source SSH client: `pkg install openssh mosh`, then `ssh frshbb@agentbox`.
- Termux can also run Pi directly on the phone, but that is a separate setup this plan does not need, because the agents live on the Droplet.

## Daily workflow

- Start long tasks in `agentbox` workspaces, not Local.
- Detach or close the lid; the Herdr server on the Droplet keeps the panes running.
- Reattach with `herdr`; the saved machine reconnects automatically.
- From the phone, open the `agentbox` host in Termius (Phase 11), then run `herdr` there.

## Maintenance

- Pull dotfile changes on the server with `cd ~/code/personal/dotfiles && git pull && ./scripts/stow.sh apply`.
- Update tools with `brew upgrade`, `pi update`, and `npm update -g`.
- Updating Herdr on the Mac does not restart the server's Herdr; update the server separately when you need new server-side behavior.
- Ubuntu's unattended upgrades install security patches but do not reboot by default; reboot deliberately when no agents are running.
- To stop paying, snapshot the Droplet if you want to keep it ($0.06/GB/month), then destroy it.

## Sources

- Herdr connecting machines: https://herdr.dev/docs/connecting-machines/
- Herdr persistence and remote access: https://herdr.dev/docs/persistence-remote/
- Tailscale on Linux: https://tailscale.com/docs/install/linux
- Tailscale servers and SSH: https://tailscale.com/docs/how-to/set-up-servers
- DigitalOcean Droplet pricing: https://www.digitalocean.com/pricing/droplets
- Termius for Android: https://play.google.com/store/apps/details?id=com.server.auditor.ssh.client
- Termux: https://github.com/termux/termux-app
- Pi on Android with Termux: https://pi.dev/docs/latest/termux
- Pi shell configuration: `docs/shell-aliases.md` in the installed `@earendil-works/pi-coding-agent` package
