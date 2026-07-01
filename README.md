# dotfiles

Configuration files for zsh, Homebrew, Ghostty terminal, tmux, Neovim, OpenCode, Claude Code, and Pi. GNU Stow manages symlinks from `stow/*` into `$HOME`. Currently using **Tokyo Night** across Neovim, Ghostty, and tmux.

## Requirements

| Tool | Minimum Version | Notes |
|------|-----------------|-------|
| **Neovim** | >= 0.11.0 | Required for mason-lspconfig v2 and vim.lsp.config() |
| **Git** | >= 2.19.0 | Required for lazy.nvim partial clones |
| **GNU Stow** | >= 2.4.0 | Symlink manager for tracked dotfiles |
| **Bash** | >= 4.2 | Required by the Tokyo Night tmux theme |
| **Ghostty** | Latest | Uses `macos-option-as-alt` syntax |
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

The command stores OAuth tokens under `~/.cache/dotfiles/spotify-visualizer/`. It does not modify tmux config. Run it in any tmux pane or window when you want a dedicated visualizer screen.

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

## OpenCode Config

The tracked personal OpenCode config lives in `stow/opencode/.config/opencode/`. It manages `RepoPromptCE`, `Ref`, and `exa` MCP servers from `opencode.jsonc` and keeps the TUI theme on `tokyonight`.

The committed MCP config reads secrets from `REF_API_KEY` and `EXA_API_KEY`. Put real local values in `~/.zshenv.local`, not in git.

Apply only OpenCode config when needed:

```bash
cd ~/dotfiles
stow --no-folding -R -v -t "$HOME" -d stow opencode
```

On Coinbase laptops, `./scripts/stow.sh --cb apply` intentionally skips OpenCode so work account state does not replace the personal config.

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

# 5. Install OpenCode (optional, for AI features)
curl -fsSL https://opencode.ai/install | bash
```

## Update an Existing Mac / Work Laptop

Use the daily Stow wrapper when the repo is already on the machine and you just want the latest dotfiles applied.

```bash
# 1. Get the latest committed dotfiles
cd ~/dotfiles
git pull

# 2. Reapply all tracked shell/editor/terminal config and tmux plugins
./scripts/stow.sh

# First time on this machine? Make sure the zsh brew deps exist, otherwise
# the prompt and syntax highlighting are skipped silently (the .zshrc guards
# them behind `[[ -f ... ]]`). `brew bundle` installs anything missing:
brew bundle --file=Brewfile
# or just the two that commonly drift:
# brew install powerlevel10k zsh-syntax-highlighting

# 3. Fully quit and reopen your terminal

# 4. Restart tmux so the new config/theme is guaranteed to load cleanly
tmux kill-server

# 5. Verify the basics
node --version
tmux -V
```

On Coinbase laptops, use the Coinbase Stow profile instead. It applies shared shell/editor/terminal packages plus `stow/zsh-cb` and `stow/git-cb`, while leaving OpenCode, Claude Code, and Codex account state alone. Pi settings are shared via `stow/pi`, but Pi auth and sessions stay local.

```bash
cd ~/dotfiles
git pull
./scripts/stow.sh --cb dry-run
./scripts/stow.sh --cb apply
tmux kill-server
```

Use `./scripts/bootstrap.sh` instead when you also want to install or refresh Homebrew packages, Node.js, and Neovim plugins. Do not use bootstrap on Coinbase laptops until the script has Coinbase profile pass-through.

What this already handles for you:
- stows your zsh, Git, Ghostty, tmux, Neovim, OpenCode, Claude Code, Pi settings, and local bin config
- supports `--cb` for Coinbase laptops, which uses `zsh-cb` and `git-cb` without stowing OpenCode or Claude Code; Pi settings remain shared
- installs TPM if missing, then installs tmux plugins from `~/.tmux.conf`
- avoids rerunning full-machine bootstrap tasks during normal dotfile updates

What `./scripts/bootstrap.sh` additionally handles for you:
- installs Homebrew packages from `Brewfile`
- runs Neovim headless plugin sync automatically

What is still separate:
- `./mcp_setup.sh install` for Claude/Codex MCP configs
- OpenCode install if you use it on that machine

## Stow How-To

GNU Stow is the source of truth for tracked dotfiles. Each folder under `stow/` is a package that mirrors paths under `$HOME`.

Example: `stow/nvim/.config/nvim/init.lua` becomes `~/.config/nvim/init.lua`.

### Apply Dotfiles

Use the wrapper for normal dotfile updates:

```bash
cd ~/dotfiles
./scripts/stow.sh
```

This defaults to `apply`. The equivalent direct Stow command is:

```bash
cd ~/dotfiles
stow --no-folding -R -v -t "$HOME" -d stow zsh git ghostty tmux nvim bin opencode claude pi
```

### Apply Coinbase Laptop Profile

```bash
cd ~/dotfiles
./scripts/stow.sh --cb dry-run
./scripts/stow.sh --cb apply
```

The Coinbase profile stows `zsh`, `zsh-cb`, `git`, `git-cb`, `ghostty`, `tmux`, `nvim`, `bin`, and `pi`. It intentionally skips `opencode`, `claude`, and Model Context Protocol configs so personal Codex and local account state remain untouched. It also symlinks `stow/ssh-cb/.ssh/config` into `~/.ssh/config` using a dedicated step in `scripts/stow.sh` because Stow cannot fold into a pre-existing `~/.ssh` directory.

### Coinbase Git Authentication Setup

`stow/git-cb/.gitconfig.local` rewrites `https://coinbase.ghe.com/` URLs to SSH using `coinbase@coinbase.ghe.com:` (the SSH user for this GHE instance is `coinbase`, not `git`). `stow/ssh-cb/.ssh/config` pins `~/.ssh/id_ed25519` for this host.

On a new machine, register your public key and authorize it for SSO before the URL rewrite will work:

**Step 1.** Copy your public key:

```bash
cat ~/.ssh/id_ed25519.pub | pbcopy
```

**Step 2.** Open [https://coinbase.ghe.com/settings/ssh/new](https://coinbase.ghe.com/settings/ssh/new), paste the key, then click **Configure SSO** and **Authorize** for the `commerce` organization.

**Step 3.** Verify:

```bash
ssh -T coinbase@coinbase.ghe.com
# Hi faris-habib! You've successfully authenticated...
```

If SSH is not working yet, the commented-out HTTPS fallback in `stow/git-cb/.gitconfig.local` works once `gh auth login` has been run for `coinbase.ghe.com`.

### Run Stow Without Scripts

Use direct Stow commands when you want to bypass the shell wrappers. Direct Stow only creates or removes symlinks. It does not install TPM or tmux plugins, so run `~/.tmux/plugins/tpm/bin/install_plugins` manually if tmux plugin declarations changed.

```bash
cd ~/dotfiles

# Personal machine: preview and apply the full shared profile
stow --no-folding -n -v -t "$HOME" -d stow zsh git ghostty tmux nvim bin opencode claude pi
stow --no-folding -R -v -t "$HOME" -d stow zsh git ghostty tmux nvim bin opencode claude pi

# Coinbase machine: preview and apply shared packages plus work overrides
stow --no-folding -n -v -t "$HOME" -d stow zsh zsh-cb git git-cb ghostty tmux nvim bin pi
stow --no-folding -R -v -t "$HOME" -d stow zsh zsh-cb git git-cb ghostty tmux nvim bin pi

# Remove the personal shared profile symlinks
stow --no-folding -D -v -t "$HOME" -d stow zsh git ghostty tmux nvim bin opencode claude pi

# Remove the Coinbase profile symlinks
stow --no-folding -D -v -t "$HOME" -d stow zsh zsh-cb git git-cb ghostty tmux nvim bin pi
```

### Apply One Package

```bash
# Neovim only
stow --no-folding -R -v -t "$HOME" -d stow nvim

# tmux only
stow --no-folding -R -v -t "$HOME" -d stow tmux

# zsh only
stow --no-folding -R -v -t "$HOME" -d stow zsh

# OpenCode only
stow --no-folding -R -v -t "$HOME" -d stow opencode

# Claude Code settings only
stow --no-folding -R -v -t "$HOME" -d stow claude

# Pi settings only
stow --no-folding -R -v -t "$HOME" -d stow pi
```

### Zsh Setup

The shell config is split across two Stow packages so the same dotfiles work on both a personal and a Coinbase machine.

#### `stow/zsh` — shared, works everywhere

Stowed on every machine. Contains `.zshrc`, `.p10k.zsh`, and `.zshenv`. No framework dependency — everything is wired directly:

- **Powerlevel10k** sourced from the Homebrew prefix (arm64 and x86 paths handled). Config lives in `stow/zsh/.p10k.zsh` (Pure style: yellow directory, async git status, `❯` prompt char, command duration above 5 s).
- **gitstatus daemon** (bundled with the `powerlevel10k` brew formula) answers git queries in the background so the prompt never blocks — important in large repos.
- **compinit once per day** — skips the expensive completion scan on every shell open; only regenerates when `.zcompdump` is older than 24 h.
- **Arrow-key prefix history search** — type a partial command then `↑`/`↓` to filter history by that prefix.
- **ctrl-z toggle** — pressing `ctrl-z` in an empty prompt brings a backgrounded process back to the foreground instead of suspending the shell.
- **fzf with ripgrep/fd** — `FZF_DEFAULT_COMMAND` uses `rg` (respects `.gitignore`, fast on large trees); `FZF_ALT_C_COMMAND` uses `fd` for directory navigation. `ctrl-r` history search includes `ctrl-y` to copy a command to clipboard and `ctrl-/` to toggle the preview pane.
- **zsh-syntax-highlighting** sourced from the Homebrew prefix.

Brew deps required on any machine:

```bash
brew install powerlevel10k zsh-syntax-highlighting ripgrep fd fzf
```

#### `stow/zsh-cb` — Coinbase laptop only

Stowed in addition to `stow/zsh` on Coinbase machines. Contains `.zshrc.local`, which is sourced at the end of `.zshrc`.

Loads [cb-zsh](https://github.cbhq.net/infra/cb-zsh) with the theme disabled (p10k is already set up) and only the Coinbase-specific plugins:

```bash
CB_ZSH_DISABLE_THEME=1
CB_ZSH_PLUGINS=(atlassian jira find_pr reconnect_vpn git-scripts new-user)
```

cb-zsh must be cloned to `~/.cb-zsh`:

```bash
git clone git@github.cbhq.net:infra/cb-zsh.git ~/.cb-zsh
```

The guard `[ -f ~/.cb-zsh/cb-zsh.zsh ]` means this silently no-ops if cb-zsh is not installed.

#### Quick setup

**Personal machine:**

```bash
brew install powerlevel10k zsh-syntax-highlighting ripgrep fd fzf
cd ~/dotfiles
stow -d stow --restow -t ~ zsh
exec zsh
```

**Coinbase machine:**

```bash
brew install powerlevel10k zsh-syntax-highlighting  # ripgrep, fd, fzf already in Brewfile
git clone git@github.cbhq.net:infra/cb-zsh.git ~/.cb-zsh
cd ~/dotfiles
stow -d stow --restow -t ~ zsh zsh-cb
exec zsh
```

#### Coinbase shell shortcuts

These functions are available after `stow/zsh-cb` is stowed and cb-zsh is installed:

| Command | What it does |
|---|---|
| `jira` | Open your Jira board in Chrome (set `MY_JIRA_BOARD` in `.zshrc.local`) |
| `jira DX-123` | Open a specific Jira ticket directly |
| `wiki <query>` | Search Confluence in Chrome |
| `find_pr` | Fuzzy-pick a commit from git log and open its GitHub PR in Chrome (uses the internal `heimdall.cbhq.net` API — requires full-tunnel VPN) |
| `reconnect_vpn` | Reconnect to Coinbase VPN via AppleScript without leaving the terminal |
| `newuser` | Create a new Coinbase test user in the development environment (requires `$COINBASE_USERNAME` to be set) |

### Update zshrc On Another Machine

Use this when you want the latest checked-in shell startup changes.

```bash
cd ~/dotfiles
git pull

# Preview first if the machine is not fully Stow-managed yet
./scripts/stow.sh dry-run

# Apply just the zsh package
stow --no-folding -R -v -t "$HOME" -d stow zsh
```

Verify `~/.zshrc` is managed by this repo:

```bash
readlink ~/.zshrc
zsh -n ~/.zshrc
zsh -i -c exit
```

`readlink ~/.zshrc` should point into `~/dotfiles/stow/zsh/.zshrc`. If it prints nothing, `~/.zshrc` is still a real file; move it aside before restowing:

```bash
mv ~/.zshrc ~/.zshrc.backup.$(date +%Y%m%d%H%M%S)
stow --no-folding -R -v -t "$HOME" -d stow zsh
```

### Migrate An Existing Machine

Use this when a machine already has real config files or directories, such as an older `~/.config/nvim`, `~/.config/ghostty/config`, or `~/.tmux.conf`. Stow will not overwrite those automatically; move them aside first.

Check whether each target is already a Stow symlink:

```bash
readlink ~/.config/nvim
readlink ~/.config/ghostty/config
readlink ~/.tmux.conf
```

If a command prints a path into `~/dotfiles/stow/...`, that target is already managed by Stow and does not need to be moved. If it prints nothing, back up the real file or directory before stowing.

The guarded commands below only move targets that exist and are not already symlinks, so they are safe to paste on machines where some targets are already migrated:

```bash
cd ~/dotfiles
git pull

timestamp=$(date +%Y%m%d%H%M%S)

[ -e ~/.config/nvim ] && [ ! -L ~/.config/nvim ] && mv ~/.config/nvim ~/.config/nvim.backup.$timestamp
[ -e ~/.config/ghostty/config ] && [ ! -L ~/.config/ghostty/config ] && mv ~/.config/ghostty/config ~/.config/ghostty/config.backup.$timestamp
[ -e ~/.tmux.conf ] && [ ! -L ~/.tmux.conf ] && mv ~/.tmux.conf ~/.tmux.conf.backup.$timestamp

stow --no-folding -R -v -t "$HOME" -d stow nvim ghostty tmux
```

After migration, future updates are just:

```bash
cd ~/dotfiles
git pull
./scripts/stow.sh
```

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

Use one package per tool when possible. That keeps `stow nvim`, `stow tmux`, and `stow ghostty` independently manageable.

### Edit Managed Files

Edit either the `$HOME` path or the repo path. Because Stow creates symlinks, both point to the same file.

```bash
nvim ~/.zshrc
nvim ~/dotfiles/stow/zsh/.zshrc
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

On Coinbase laptops, use the Coinbase backup profile so only local work overrides are copied back into the Coinbase Stow packages:

```bash
cd ~/dotfiles
./scripts/backup.sh --cb
```

The Coinbase backup profile copies `~/.zshrc.local` into `stow/zsh-cb/.zshrc.local` and `~/.gitconfig.local` into `stow/git-cb/.gitconfig.local`. It intentionally does not copy shared shell, Git, tmux, Ghostty, Neovim, OpenCode, Claude Code, Pi, or Model Context Protocol files.

## Command Cheatsheet

| Task | Command |
|------|---------|
| Full install/update | `./scripts/bootstrap.sh` |
| Backup shell/editor config | `./scripts/backup.sh` |
| Backup Coinbase overrides | `./scripts/backup.sh --cb` |
| Apply all Stow packages | `./scripts/stow.sh` |
| Preview all Stow changes | `./scripts/stow.sh dry-run` |
| Remove all Stow symlinks | `./scripts/stow.sh delete` |
| Restow zshrc | `stow --no-folding -R -v -t "$HOME" -d stow zsh` |
| Restow OpenCode | `stow --no-folding -R -v -t "$HOME" -d stow opencode` |
| Restow Claude Code settings | `stow --no-folding -R -v -t "$HOME" -d stow claude` |
| Restow Pi settings | `stow --no-folding -R -v -t "$HOME" -d stow pi` |
| Unstow Neovim | `stow --no-folding -D -v -t "$HOME" -d stow nvim` |
| Restow Neovim | `stow --no-folding -R -v -t "$HOME" -d stow nvim` |
| Reload tmux config | `tmux source-file ~/.tmux.conf` |
| Install tmux plugins | `~/.tmux/plugins/tpm/bin/install_plugins` |
| Restart tmux cleanly | `tmux kill-server && tmux` |
| Restore Neovim plugins | `nvim --headless -c "Lazy! restore" -c "qa"` |
| Open Lazy UI | `nvim +Lazy` |
| Open Mason UI | `nvim +Mason` |
| Shell syntax checks | `bash -n scripts/bootstrap.sh && bash -n scripts/backup.sh && bash -n scripts/stow.sh && bash -n mcp_setup.sh` |
| Neovim safety check | `bash test/nvim_plugin_safety.sh --base-ref HEAD --skip-tmux` |
| Docker test suite | `docker build -t dotfiles-test -f test/Dockerfile . && docker run --rm dotfiles-test` |

## What Gets Installed

### Bootstrap (`scripts/bootstrap.sh`)

- **Homebrew** + all packages from `Brewfile` (includes Stow, Ghostty, tmux, Nerd Fonts)
- **Bash 4.2+** via Homebrew for Tokyo Night tmux theme support
- **Powerlevel10k** prompt with gitstatus daemon (async git status — does not block the prompt on large repos)
- **zsh-syntax-highlighting** via Homebrew (no framework required)
- **Node.js** from `Brewfile`
- **Configs stowed**: `stow/zsh`, `stow/git`, `stow/ghostty`, `stow/tmux`, `stow/nvim`, `stow/bin`, `stow/opencode`, `stow/claude`, and `stow/pi` into `$HOME`
- **Coinbase profile**: `./scripts/stow.sh --cb apply` stows shared packages plus `stow/zsh-cb`, `stow/git-cb`, and `stow/pi`, and symlinks `stow/ssh-cb/.ssh/config` into `~/.ssh/config` for GHE SSH auth, while skipping account-specific AI tool configs
- **tmux TPM + plugins**: `scripts/stow.sh` installs TPM if missing, then installs tmux plugins from the stowed `~/.tmux.conf`
- **Neovim plugins restored** headlessly from `lazy-lock.json` via lazy.nvim (`nvim --headless -c "Lazy! restore" -c "qa"`)
- **fzf shell integration** when Homebrew fzf is available
- **Global npm packages** from `npm-global-packages.txt`
- **Amp CLI** via the official installer

### npm Global Packages (`npm-global-packages.txt`)

- `@anthropic-ai/claude-code` - Claude Code CLI
- `@openai/codex` - OpenAI Codex CLI
- `vercel` - Vercel CLI
- `tree-sitter-cli` - Parser generator for nvim-treesitter

### MCP Setup (`mcp_setup.sh install`)

MCP (Model Context Protocol) configs for AI coding assistants:
- **Claude Desktop**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Codex**: `~/.codex/config.toml`

See `mcp/README.md` for setup instructions and API key configuration.

Preferred tool usage after setup:
- Use `RepoPromptCE_*` tools for repo discovery, file reads, selection management, planning, review, and git context whenever RepoPromptCE is available.
- Use Ref for documentation lookup: search with `ref_ref_search_documentation`, then read the result with `ref_ref_read_url`.

### OpenCode, Claude Code, and Pi Stow Notes

- Pi settings are managed at `stow/pi/.pi/agent/settings.json` and are included in both the default and Coinbase Stow profiles.
- Do not move Pi auth, sessions, logs, or other runtime/account state into Stow; `stow/pi/.stow-local-ignore` excludes common sensitive/runtime paths.
- OpenCode global config is managed at `stow/opencode/.config/opencode/`.
- Claude Code Stow coverage spans `stow/claude/.claude/`: `settings.local.json`, the global `CLAUDE.md` rules, the personal `skills/` (`tldr`, `grill-me`, `grill-me-with-docs`, `quiz-me`), and the `hooks/` scripts.
- Claude Code MCP servers are user-scoped in `~/.claude.json`, not Stow-managed. Keep `Ref` and `exa` credentials there as `${REF_API_KEY}` and `${EXA_API_KEY}`, sourced from `~/.zshenv.local`.
- OpenCode slash wrappers for those personal skills live in `stow/opencode/.config/opencode/commands/`, so `/tldr`, `/grill-me`, `/grill-me-with-docs`, and `/quiz-me` appear in the OpenCode command picker.
- These are shared, not Claude-only. `~/.cbcode-home/.claude` and `~/.claude` are the same directory, and OpenCode reads `~/.claude/skills/` plus `~/.claude/CLAUDE.md` (when no `~/.config/opencode/AGENTS.md` exists). One Stow source therefore drives cbcode Claude Code, plain Claude Code, and OpenCode.
- Hooks do not share a format. OpenCode ignores Claude's `settings.json` hooks, so `stow/opencode/.config/opencode/plugin/cb-guards.ts` adapts to OpenCode's plugin API and shells out to the same `~/.claude/hooks/*.sh` scripts for the bash and generated-edit blockers.
- Do not move Claude sessions, history, project caches, telemetry, or `.claude.json` into Stow; those contain local runtime/account state.
- Do not copy live MCP URLs with real API keys into tracked files. Use environment interpolation for secrets.

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
| **tmux** | Terminal multiplexer |

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
| vim-test + vimux | Test runner |

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
| `<C-h/j/k/l>` | Navigate windows/tmux panes |
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

- Go: use `dlv debug`, `dlv test`, or `dlv attach` directly in tmux/terminal
- Python: use `python -m debugpy --listen localhost:5678 ...` when you need an attachable debugger
- Day to day: prefer tests, logs, and targeted print statements for fast iteration

### tmux

| Keys | Action |
|------|--------|
| `C-a` | Prefix |
| `C-a r` | Reload tmux.conf |
| `C-a f` | **tmux-sessionizer** (fuzzy find projects) |
| `C-a d` / `C-a s` | Detach / session list |
| `C-a "` / `C-a %` | Split vertical / horizontal |
| `<C-h/j/k/l>` | Navigate panes (seamless with nvim) |
| `Alt-Arrow` | Resize panes |

**Note:** Status bar is positioned at the top with the Tokyo Night tmux theme (`janoamaral/tokyo-night-tmux`) plus a current-directory widget. The terminal/tmux cursor uses a blinking block. Pane navigation uses a manual `is_vim` script (not the TPM navigator plugin) for transparency and fewer dependencies. Works seamlessly with `nvim-tmux-navigation` in Neovim.

### tmux-sessionizer

Quick project switching via fzf. Press `C-a f` to:
1. See subdirectories of your current path
2. Fuzzy-select a project
3. Create/switch to a tmux session named after that project

The session name appears in the tmux status bar, providing project context without needing a fancy shell prompt.

## Shell Configuration

### History Settings

```bash
HISTSIZE=10000           # Commands in memory
SAVEHIST=50000           # Commands saved to file
setopt inc_append_history  # Save immediately, not on exit
setopt share_history       # Share between terminals
```

## Zed Configuration

```bash
ln -sf ~/dotfiles/zed/settings.json ~/.config/zed/settings.json
ln -sf ~/dotfiles/zed/keymap.json   ~/.config/zed/keymap.json
ln -sf ~/dotfiles/zed/tasks.json    ~/.config/zed/tasks.json
```

## File Structure

```
dotfiles/
├── scripts/                # Bootstrap, backup, and Stow wrappers
│   ├── bootstrap.sh        # Full machine bootstrap for non-Stow setup
│   ├── backup.sh           # Backup current machine config into repo
│   └── stow.sh             # Apply/delete/dry-run GNU Stow packages
├── mcp_setup.sh            # MCP config backup/install
├── Brewfile                # Homebrew packages
├── npm-global-packages.txt # Global npm packages
├── CHANGELOG.md            # Change history
├── stow/                   # GNU Stow packages, each mirroring $HOME
│   ├── zsh/                # .zshrc, .zprofile, .zshenv
│   ├── zsh-cb/             # Coinbase-only .zshrc.local
│   ├── git/                # .gitconfig, .gitignore_global
│   ├── git-cb/             # Coinbase-only .gitconfig.local (SSH URL rewrite + HTTPS fallback)
│   ├── ssh-cb/             # Coinbase-only .ssh/config (symlinked manually, not via Stow)
│   ├── ghostty/            # .config/ghostty/config
│   ├── tmux/               # .tmux.conf
│   ├── bin/                # .local/bin/tmux-sessionizer
│   ├── opencode/           # .config/opencode/: opencode.jsonc, tui.json, plugin/cb-guards.ts
│   ├── claude/             # .claude/: settings.local.json, CLAUDE.md, skills/, hooks/
│   └── nvim/               # .config/nvim (lazy.nvim + Tokyo Night)
│       └── .config/nvim/
│           ├── init.lua
│           ├── lazy-lock.json
│           ├── ftplugin/
│           └── lua/plugins/
├── old/karabiner/           # Deprecated keyboard remapping archive
├── mcp/                    # MCP configs for AI tools
└── old/                    # Archived/deprecated configs
```

## Neovim Plugin Safety Harness

Use this before and after plugin edits to catch startup regressions without touching your live `~/.config/nvim`.

```bash
# Full safety pass (isolated profile + one-by-one plugin rollout + tmux check)
bash test/nvim_plugin_safety.sh --base-ref HEAD

# Same checks without tmux validation
bash test/nvim_plugin_safety.sh --base-ref HEAD --skip-tmux
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
- Post-recovery: switched theme from Nord to Catppuccin Macchiato across Neovim, Ghostty, and tmux. Added `flash.nvim` for motion/jump support.

## cbcode HOME Sandbox

`cbcode` (Coinbase's Claude Code wrapper) overwrites `~/.codex/config.toml` on every launch with Coinbase LLM Gateway settings. This conflicts with running a personal Codex CLI using your own OpenAI account.

**Solution:** Sandbox cbcode's `HOME` so it writes its Codex config to `~/.cbcode-home/.codex/` instead of `~/.codex/`. Most other dotfiles are symlinked back to the real `$HOME`, so Claude Code config and user-level tool state remains shared.

**Important safety note:** `~/.cbcode-home` is only a Codex config sandbox. It is not a disposable home directory. Paths such as `~/.cbcode-home/.local`, `~/.cbcode-home/.claude`, and `~/.cbcode-home/.config` are symlinks to the real `$HOME`. Deleting `~/.cbcode-home/.local/share/claude` deletes the real `~/.local/share/claude` install.

### Setup

```bash
# 1. Create the sandboxed home
mkdir -p ~/.cbcode-home

# 2. Symlink everything cbcode needs (NOT .codex — that's the whole point)
cd ~/.cbcode-home
ln -s ~/.claude .claude
ln -s ~/.claude.json .claude.json
ln -s ~/.cbcode .cbcode
ln -s ~/.config .config
ln -s ~/.cache .cache
ln -s ~/.nvm .nvm
ln -s ~/.zshrc .zshrc
ln -s ~/.zprofile .zprofile
ln -s ~/.pyenv .pyenv
ln -s ~/.rbenv .rbenv
ln -s ~/.bun .bun
ln -s ~/.cb-zsh .cb-zsh
ln -s ~/.fzf.zsh .fzf.zsh
ln -s ~/.deno .deno
ln -s ~/.local .local
ln -s ~/go go
ln -s ~/.opencode .opencode
ln -s ~/.gitconfig .gitconfig
ln -s ~/.ssh .ssh
ln -s ~/.gnupg .gnupg
ln -s ~/.npmrc .npmrc
ln -s ~/Library Library

# 3. Add the wrapper function to .zshrc
cbcode() {
  ( HOME="$HOME/.cbcode-home" command cbcode "$@" )
}
```

### How it works

| Path | cbcode sees | Personal codex sees |
|------|-------------|---------------------|
| `~/.codex/config.toml` | `~/.cbcode-home/.codex/config.toml` (isolated) | `~/.codex/config.toml` (yours) |
| `~/.claude/` | `~/.cbcode-home/.claude` → `~/.claude/` (shared) | N/A |
| `~/.cbcode/` | `~/.cbcode-home/.cbcode` → `~/.cbcode/` (shared) | N/A |
| `~/.local/` | `~/.cbcode-home/.local` → `~/.local/` (shared) | N/A |
| `~/.config/` | `~/.cbcode-home/.config` → `~/.config/` (shared) | N/A |

### Safe cleanup rules

Never treat `~/.cbcode-home` as fully isolated. Only `~/.cbcode-home/.codex` is intentionally separate from your personal `~/.codex` directory.

Before deleting or cleaning a path under `~/.cbcode-home`, resolve the real path:

```bash
readlink ~/.cbcode-home/.local
python3 -c 'import os,sys; print(os.path.realpath(sys.argv[1]))' ~/.cbcode-home/.local/share/claude
```

If the resolved path starts with your real home directory, such as `/Users/farishabib/.local`, then the target is shared state. Do not delete it as sandbox-only cleanup. In particular, never remove `~/.cbcode-home/.local/share/claude` unless you intend to remove the real standalone Claude install.

### Why this is necessary

cbcode's `ensureCodexConfigToml()` in `packages/code-agent/src/onboarding/config.ts` runs on every launch and force-updates `model`, `model_provider`, `model_providers.cbhq-gateway`, and `features` in `config.toml`. The path is hardcoded to `os.homedir() + '/.codex'` with no env var override. Sandboxing `HOME` is the only way to isolate it without patching the binary.

## Troubleshooting

**Stow says `WARNING! stowing ... would cause conflicts`**
- A real file already exists at the target path, for example `~/.zshrc` or `~/.config/nvim`.
- If you trust the repo version, move the existing file aside and restow:

```bash
mv ~/.zshrc ~/.zshrc.backup.$(date +%Y%m%d%H%M%S)
stow --no-folding -R -v -t "$HOME" -d ~/dotfiles/stow zsh
```

For a full migration, prefer `./scripts/bootstrap.sh`; it backs up known target paths before stowing.

**A Stow symlink points to the wrong place**
- Check the symlink target:

```bash
readlink ~/.zshrc
readlink ~/.config/nvim
```

- Recreate links from the repo:

```bash
cd ~/dotfiles
stow --no-folding -R -v -t "$HOME" -d stow zsh nvim
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
stow --no-folding -D -v -t "$HOME" -d stow zsh git ghostty tmux nvim bin opencode claude pi
```

Backups created by the installer are named like `.zshrc.backup.YYYYMMDDhhmmss`.

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

**Powerline symbols not showing?**
- Ensure terminal uses a Nerd Font (JetBrainsMono Nerd Font)
- Restart terminal after font installation

**Prompt is plain / no syntax highlighting after an update?**
- The shared `stow/zsh/.zshrc` sources Powerlevel10k and zsh-syntax-highlighting behind `[[ -f ... ]]` guards, so if the brew formulae are missing it skips them silently with no error — you just get a bare prompt and no command coloring.
- This typically happens on a machine that was Stow-managed but never fully bootstrapped (for example, a personal machine that only ever had `ripgrep`/`fd`/`fzf` installed).
- Check whether they are installed:

```bash
brew list --versions powerlevel10k zsh-syntax-highlighting
```

- If either is absent, install and reload:

```bash
brew install powerlevel10k zsh-syntax-highlighting
exec zsh
```

- To avoid this class of drift entirely, install the full tracked package set: `brew bundle --file=~/dotfiles/Brewfile`.
- Note: cb-zsh plugins (`jira`, `find_pr`, etc.) are a separate concern — those load only via `stow/zsh-cb/.zshrc.local` on the Coinbase `--cb` profile and are intentionally absent on personal machines.

**tmux plugins not loading?**
- First rerun the Stow apply flow from repo root: `./scripts/stow.sh`
- On Coinbase laptops, rerun the Coinbase profile instead: `./scripts/stow.sh --cb apply`
- If you want to force just the tmux plugin step, run `~/.tmux/plugins/tpm/bin/install_plugins`
- If the bar still looks plain, ensure a Nerd Font is enabled in Ghostty and restart the terminal
- Tokyo Night tmux requires Bash 4.2+; `brew "bash"` is included in `Brewfile`

**Pretty tmux bar not rendering?**
- Kill and restart tmux first so no old server state is cached: `tmux kill-server && tmux`
- Reload config after restart: `tmux source-file ~/.tmux.conf`
- Ensure the theme plugin is actually present: `ls ~/.tmux/plugins/tokyo-night-tmux`
- Ensure the Tokyo Night plugin is configured in `~/.tmux.conf`:
  - `set -g @plugin 'janoamaral/tokyo-night-tmux'`
  - `set -g @tokyo-night-tmux_show_path 1`
- Verify theme content is being applied:
  - `tmux show -g status-left`
  - `tmux show -g status-right`
- If symbols are still wrong, re-run plugin install and keep Nerd Font enabled in terminal

**C-h/j/k/l not working between nvim and tmux?**
- Ensure `nvim-tmux-navigation` plugin is installed in Neovim
- Reload tmux config: `tmux source-file ~/.tmux.conf`

**nvm not found?**
- `nvm` is optional now; `scripts/bootstrap.sh` installs Node.js from `Brewfile`
- If you install `nvm` manually, restart terminal or `source ~/.zshrc`

**Terminal debugging workflow**
- Go: run `dlv debug` or `dlv test` in tmux/terminal
- Python: run `python -m debugpy --listen localhost:5678 --wait-for-client myfile.py`
- Prefer tests and print/log debugging first; reach for `dlv` or `debugpy` when the bug is stubborn

## Future Considerations

### zoxide - Smarter Directory Navigation

[zoxide](https://github.com/ajeetdsouza/zoxide) is a smarter `cd` command that learns your habits. It uses "frecency" (frequency + recency) to jump to directories with minimal typing.

```bash
# Instead of:
cd ~/github/dotfiles

# You can just type:
z dotfiles
```

**Installation (when ready):**
```bash
# Add to Brewfile
brew "zoxide"

# Add to .zshrc
eval "$(zoxide init zsh)"
```

Currently not using this because `cd` + fzf works well enough, but worth revisiting if directory jumping becomes a bottleneck.
