# Changelog

All notable changes to this dotfiles repository are documented here.

## July 2026

### Neovim: quiet diagnostics and Markdown spell hover

- **nvim/diagnostics**: Disabled current-line diagnostic virtual lines so LSP errors no longer insert noisy inline text under the cursor.
- **nvim/diagnostics**: Added a non-focusable rounded diagnostic float on `CursorHold`, keeping underlines as the primary signal while showing details when the cursor rests on an error.
- **nvim/colorscheme**: Overrode Tokyo Night diagnostic and spell highlights to use plain underline instead of undercurl, avoiding literal `E[4:3m` escape fragments in tmux/Ghostty.
- **nvim/markdown**: Added a Markdown-only spell popup on `CursorHold` that shows the misspelled word and up to five suggestions while preserving normal spellcheck underlines.

### Zsh: make completion case-insensitive

- **zsh/completion**: Added a completion matcher so lowercase input can complete uppercase and mixed-case paths, e.g. `git add change<Tab>` can match `CHANGELOG.md`.

### Complete RepoPrompt to RepoPromptCE migration across remaining configs

The closed-source RepoPrompt app is fully removed. Every remaining config, template, and doc now names the server `RepoPromptCE` and points at `/Applications/RepoPrompt CE.app/Contents/MacOS/repoprompt-mcp`.

- **stow/opencode/.config/opencode/opencode.jsonc**: `RepoPrompt` MCP server renamed to `RepoPromptCE` and repointed at the CE binary. Resolves the known follow-up noted in the entry below, OpenCode's integration works again.
- **mcp/claude_desktop_config.json** and **mcp/claude_desktop_config.json.example**: server renamed to `RepoPromptCE`, command updated from the legacy `repoprompt_cli` path to the CE app binary.
- **mcp/codex_config.toml.example**: `[mcp_servers.RepoPromptCE]` replaces the old server table name, with the CE binary path.
- **mcp/README.md**: server list names RepoPromptCE.
- **SYSTEM_PROMPT.md**: Tool Preferences table and prose swapped from the old `RepoPrompt` tool prefix to the `RepoPromptCE` prefix.
- **stow/claude/.claude/hooks/block-generated-edits.sh**: stale comments naming the old tool prefix for `apply_edits` updated. Hook behavior unchanged, it matches on `tool_input` paths, not tool names.
- **stow/claude/.claude/settings.local.json** and **.claude/settings.local.json**: permission allowlist entries renamed from the old `RepoPrompt` tool prefix to `RepoPromptCE`.
- **README.md**: OpenCode section now lists `RepoPromptCE` as the managed server.
- Not changed: two `skillUsage` keys in user-scope `~/.claude.json` that carry the old prefix are historical usage counters, not config, and historical CHANGELOG entries stay as written.

### Claude Code: switch preferred MCP tool routing from RepoPrompt to RepoPromptCE

- **stow/claude/.claude/CLAUDE.md**: Tool Preferences table and all `mcp__RepoPrompt__*` references now point at `mcp__RepoPromptCE__*`, the open-source RepoPrompt Community Edition server. Same tool names, schemas, and instructions text as the closed-source app, so this is a routing change only, no rule rewrites.
- **AGENTS.local.md**: Same `mcp__RepoPrompt__*` → `mcp__RepoPromptCE__*` swap in the Tool Preferences table and the "right location, right abstraction level" rule's `file_search` reference.
- **CLAUDE.local.md**: Collapsed to `@AGENTS.local.md`, mirroring how `CLAUDE.md` already just points at `@AGENTS.md`. AGENTS.md/AGENTS.local.md are now the sole source of truth for both agent tools.
- **README.md:519**: Updated the preferred-tool-usage note from `RepoPrompt_*` to `RepoPromptCE_*`.
- **user-scope `~/.claude.json`** (not tracked in this repo): Removed the old `RepoPrompt` MCP server entry after the closed-source app was uninstalled; `RepoPromptCE` (`/Applications/RepoPrompt CE.app/Contents/MacOS/repoprompt-mcp`) is now the only RepoPrompt-family server registered.
- **known follow-up**: `stow/opencode/.config/opencode/opencode.jsonc:5-11` still registers an OpenCode `RepoPrompt` MCP server pointing at `/Applications/RepoPrompt.app/Contents/MacOS/repoprompt-mcp`, which no longer exists. Not migrated yet, OpenCode's RepoPrompt integration is currently broken until that entry is repointed at the CE binary.

## June 2026

### Fix: p10k git status rendering black in vcs prompt segment

- **zsh/.p10k.zsh**: `my_git_formatter()` colored the branch name and dirty-state glyphs via `$BLUE`/`$MAGENTA`/`$GREEN`/`$RED` (uppercase), leftover references from the Coinbase `cb-zsh` theme this file was adapted from. Those vars were never defined in this repo, so every color resolved to an empty string and the vcs segment rendered with no color escape at all, falling back to p10k's black default against Ghostty's Tokyo Night background
  - Replaced with literal `%F{N}` escapes local to `my_git_formatter`: blue branch name, magenta clean state, green modified/untracked, red conflicted
  - Inline escapes were required rather than reusing the `blue`/`magenta`/`red` locals already defined earlier in the file (`.p10k.zsh:19-24`) — those are scoped to the outer anonymous setup function, which has already returned by the time p10k invokes `my_git_formatter` during prompt rendering

### Pi: add Stow-managed settings

- **stow/pi/.pi/agent/settings.json**: Added Pi settings to the tracked Stow packages so default model, provider, theme, and thinking-level preferences are shared across machines.
- **scripts/stow.sh**: Added `pi` to both the default and Coinbase Stow profiles.
- **safety**: Existing `~/.pi/agent/settings.json` is backed up before first stow, while Pi auth, sessions, logs, and other runtime state remain local and ignored.

### OpenCode: stow JSONC global config without MCP secrets

- **stow/opencode/.config/opencode/opencode.jsonc**: Replaced the stowed JSON config with JSONC, matching OpenCode's comment-friendly config format.
- **OpenCode MCP secrets**: Switched `Ref` and `exa` credentials to `REF_API_KEY` and `EXA_API_KEY` environment interpolation so API keys stay out of git.
- **setup/tests**: Updated bootstrap and Stow validation to expect `~/.config/opencode/opencode.jsonc`.

### Claude Code: move user MCP credentials to environment interpolation

- **~/.claude.json**: Updated local user-scoped `Ref` and `exa` MCP headers to read `${REF_API_KEY}` and `${EXA_API_KEY}`.
- **docs**: Clarified that Claude Code MCP server definitions live in user scope, while Stow only manages Claude Code permissions, rules, skills, and hooks.

### Fix: stabilize Ghostty mouse selection inside tmux

- **ghostty/clipboard**: Disabled `copy-on-select` so click-drag selection no longer races tmux mouse selection handling
  - Keeps explicit copy available through `ctrl+shift+c`
  - Maps macOS `cmd+c` to the same tmux-readable `ctrl+shift+c` sequence
- **tmux/copy-mode**: Removed mouse-release copy/cancel bindings from both copy-mode tables
  - Prevents `tmux-yank` from immediately copying and clearing selections on `MouseDragEnd1Pane`
  - Adds explicit `ctrl+shift+c` copy bindings that pipe selections to `pbcopy`

### OpenCode: add slash wrappers for personal Claude skills

- **stow/opencode/.config/opencode/commands/**: Added OpenCode command wrappers for the personal Stow-managed Claude skills.
  - `/tldr` loads the `tldr` skill.
  - `/grill-me` loads the `grill-me` skill.
  - `/grill-me-with-docs` loads the `grill-me-with-docs` skill.
  - `/quiz-me` loads the `quiz-me` skill.

### OpenCode: adapter plugin reusing the Claude hook scripts

- **stow/opencode/.config/opencode/plugin/cb-guards.ts**: New plugin so the same guard logic runs under OpenCode, which ignores Claude's `settings.json` hooks. It shells out to the shared `~/.claude/hooks/*.sh` scripts rather than reimplementing them.
- `tool.execute.before` → `block-dangerous-bash.sh` (bash) and `block-generated-edits.sh` (edit/write/patch); exit 2 throws and aborts the tool call.
- Auto-loads from the `plugin/` directory; no `opencode.json` change needed. The directory is symlinked from the Stow package.
- At the time, `~/.config/opencode/opencode.json` was still a real file shadowing the Stow copy, so it was not yet Stow-managed.

### Claude Code: expand Stow coverage to global rules, skills, and hooks

- **stow/claude/.claude/CLAUDE.md**: Global agent rules are now tracked under Stow (previously a standalone file in `~/.claude`). This is the trimmed failure-log version (159 lines, down from 272) that stays under the ~200-line adherence threshold. Symlinked back to `~/.claude/CLAUDE.md` on restow.
- **stow/claude/.claude/skills/**: Added four personal skills — `tldr` (toggle ultra-terse replies), `grill-me` and `grill-me-with-docs` (one-question-at-a-time plan and design interrogation), and `quiz-me` (active-recall tutoring). Symlinked per-skill into `~/.claude/skills/`, leaving the cbcode-managed skills untouched.
- **stow/claude/.claude/hooks/**: Added hook scripts for generated-edit and dangerous-bash blockers.
- Shared across harnesses: `~/.cbcode-home/.claude` and `~/.claude` are the same directory, and OpenCode reads `~/.claude/skills/` plus `~/.claude/CLAUDE.md` (when no `~/.config/opencode/AGENTS.md` exists). One Stow source now drives cbcode Claude Code, plain Claude Code, and OpenCode.
- Sessions, history, caches, and `.claude.json` remain out of Stow.

### Tooling: add Spotify terminal visualizer

- **bin/spotify-visualizer**: Added a standalone TypeScript terminal visualizer command
  - Uses Spotify current playback state for track metadata, play state, and a per-track animation seed
  - Renders a procedural red, orange, and yellow dot matrix in the terminal without changing tmux config
  - Supports `Space`, `n`, `p`, `s`, and `r` for play/pause, next, previous, shuffle, and repeat-mode controls
  - Clears stale cached Spotify tokens on authorization failures so scope changes can reauthorize cleanly
  - Stores local OAuth tokens under `~/.cache/dotfiles/spotify-visualizer/`

### OpenCode: restore personal MCP config and Tokyo Night

- **opencode/config**: Replaced stale tracked OpenCode MCP config with the personal MCP set
  - Keeps `RepoPrompt`, `ref`, and `exa` as the managed MCP servers
  - Sanitizes the committed Ref MCP URL with `apiKey=*****`
  - Restores the OpenCode TUI theme to `tokyonight`

### Neovim: include ignored files in Snacks file discovery

- **nvim/snacks**: Snacks file pickers, grep, and explorer now include hidden and ignored files
  - Allows ignored local config files such as `override.yml` to appear in find-file results
  - Applies globally through picker source config instead of per-keymap overrides

### Neovim: reveal current file in Neo-tree

- **nvim/neo-tree**: Neo-tree now follows the active file in the filesystem sidebar
  - Enables `follow_current_file.enabled` so switching buffers expands the tree to the active file
  - Keeps auto-expanded directories open with `leave_dirs_open` for Cursor-like file tree navigation
  - Adds a `desc` to the `<C-n>` file tree keymap for which-key discoverability

### Fix: find_pr broken after migration from heimdall to coinbase.ghe.com

- **zsh-cb/.zshrc.local**: Overrides cb-zsh's `find_pr` with a version that uses `gh api --hostname coinbase.ghe.com` instead of the decommissioned `heimdall.cbhq.net` API
  - The old function curled `heimdall.cbhq.net/v1/code_change` which is no longer reachable, producing a misleading "connect to full tunnel VPN" error
  - The new version calls `GET /repos/{owner}/{repo}/commits/{ref}/pulls` on the GHE API, which works with split-tunnel VPN and uses the existing `gh` auth session
  - Also fixes URL parsing for `coinbase@coinbase.ghe.com:` style SSH remotes which the original `_repository_owner` helper did not handle (it only matched `git@` prefix)

### Fix: fzf history search not loading due to p10k instant prompt

- **zsh/.zshrc**: Removed `[[ -t 0 && -t 1 ]]` terminal guard from fzf source block
  - p10k instant prompt redirects stdout to a FIFO during `.zshrc` initialization, causing `[[ -t 1 ]]` to evaluate false and silently skip the entire fzf block — leaving `ctrl+r` on zsh's built-in `bck-i-search` instead of fzf
  - `.zshrc` is only ever sourced for interactive shells so the guard was redundant
- **zsh/.zshrc**: Bound `ctrl+f` to `fzf-history-widget` (previously `ctrl+r`)
  - Uses `bindkey -M emacs` and `bindkey -M viins` to match how fzf registers its own bindings

### Neovim: make Git blame togglable

- **nvim/git**: `<leader>gt` now toggles the fugitive blame split open and closed
  - Walks all open windows and closes any with filetype `fugitiveblame` if found, otherwise runs `:Git blame`
  - Previously the binding only opened blame with no way to dismiss it via the same key

### Neovim: replace inline blame with full Git blame split

- **nvim/git**: `<leader>gt` now runs `:Git blame` (vim-fugitive) instead of gitsigns' `toggle_current_line_blame`
  - `toggle_current_line_blame` only annotates the current line as faint virtual text after a 1 s delay, making it easy to miss
  - `:Git blame` opens a full split panel with every line annotated — commit hash, author, and date — and `Enter` jumps to that commit
- **nvim/git**: Removed `cmd` lazy-load constraint from `tpope/vim-fugitive` so it is available immediately when the keymap fires

### Setup: migrate zsh from oh-my-zsh to powerlevel10k + cb-zsh plugins

- **zsh/.zshrc**: Replaced oh-my-zsh with a framework-free config that works on both Coinbase and personal machines
  - Sources powerlevel10k directly from the brew prefix (arm64/x86 detection included)
  - Replaces the synchronous `robbyrussell` git prompt with p10k + gitstatus daemon, which is async and does not block the prompt on large repos like the monorepo
  - Inlines the cb-zsh plugins that were previously implicit: once-per-day compinit caching, arrow-key prefix history search, ctrl-z toggle, and fzf with ripgrep/fd defaults
  - Fixes the broken `alias brew install` (spaces in alias names are invalid in zsh) with a proper arch-conditional alias
  - Removes oh-my-zsh entirely; no framework dependency on either machine

- **zsh/.p10k.zsh**: New file — powerlevel10k config adapted from cb-zsh `default-theme.zsh`
  - Pure/lean style prompt: directory in yellow, async git status, command duration above 5s, `❯` prompt char
  - asdf/mise segment removed since pyenv/rbenv/nvm handle version management on this setup
  - Run `p10k configure` to regenerate if you want a different style

- **zsh-cb/.zshrc.local**: Added cb-zsh loading block at the top
  - Sets `CB_ZSH_DISABLE_THEME=1` to prevent cb-zsh from loading its own p10k config (we manage the theme via `~/.p10k.zsh`)
  - Loads only Coinbase-specific plugins: `atlassian jira find_pr reconnect_vpn git-scripts new-user`
  - Guard: `[ -f ~/.cb-zsh/cb-zsh.zsh ]` — no-ops silently if cb-zsh is not installed
  - Clone cb-zsh with: `git clone git@github.cbhq.net:infra/cb-zsh.git ~/.cb-zsh`

- **Brewfile**: Added `powerlevel10k` and `zsh-syntax-highlighting`

### Fix: tmux undercurl corrupting terminal output in Ghostty

- **tmux/terminal-capabilities**: Replaced broken hand-written `Smulx`/`Setulc` terminal overrides with tmux's built-in `terminal-features` mechanism
  - The old `Setulc` value in `set -as terminal-overrides` was missing the trailing `%;m` that closes the escape sequence, causing tmux to emit a truncated sequence. Ghostty's parser left the leftover bytes on screen as literal `E[4:3m` text next to any word with the `SpellBad` highlight (triggered by Neovim spell-check on domain terms like `USDT`, `wagmi`, etc.)
  - The same corrupt sequence garbled cell widths in neo-tree's sidebar, causing filenames to clip and overlap when opening a new window
  - Fixed by switching to `set -as terminal-features ",xterm-ghostty:RGB:usstyle"` and `",xterm-256color:RGB:usstyle"`, which lets tmux generate correct undercurl and underline-color sequences natively
  - Note: multiple features within a single `terminal-features` entry must be separated by colons, not commas; commas split them into separate unkeyed entries that match no terminal

### Setup: fix Coinbase GHE SSH authentication

- **setup/ssh-cb**: Added new `stow/ssh-cb/` Stow package containing `~/.ssh/config`
  - Pins `User coinbase` for `coinbase.ghe.com` — this GHE instance uses `coinbase` as the SSH user, not `git`
  - Sets `IdentityFile ~/.ssh/id_ed25519` and `IdentitiesOnly yes` to avoid offering unrelated keys
  - Package is symlinked manually by `scripts/stow.sh` (`link_ssh_config`) because Stow cannot fold into a pre-existing `~/.ssh` directory

- **setup/git-cb**: Fixed `stow/git-cb/.gitconfig.local` SSH URL rewrite
  - Corrected rewrite target from `git@coinbase.ghe.com:` to `coinbase@coinbase.ghe.com:` to match the actual GHE SSH user
  - Added commented-out HTTPS fallback via `gh auth git-credential` for bootstrapping before the SSH key is registered

- **setup/stow**: Added `link_ssh_config()` to `scripts/stow.sh`
  - Runs during `--cb apply` to symlink `stow/ssh-cb/.ssh/config` into `~/.ssh/config`
  - Backs up any existing non-stow `~/.ssh/config` before symlinking
  - No-ops if the symlink already points to the dotfiles source

## March 2026

### Docs: clarify cbcode sandbox safety

- **docs/cbcode**: Documented that `~/.cbcode-home` is only a Codex config sandbox
  - Calls out that `~/.cbcode-home/.local`, `.claude`, and `.config` are symlinks into the real home directory
  - Adds a cleanup checklist that resolves real paths before deleting anything under `~/.cbcode-home`
  - Warns that deleting `~/.cbcode-home/.local/share/claude` removes the real standalone Claude install

### Setup: add Coinbase backup profile

- **setup/backup**: Added `./scripts/backup.sh --cb` for Coinbase laptops
  - Copies `~/.zshrc.local` into `stow/zsh-cb/.zshrc.local`
  - Copies `~/.gitconfig.local` into `stow/git-cb/.gitconfig.local`
  - Leaves shared shell, Git, tmux, Ghostty, Neovim, OpenCode, Claude Code, and Model Context Protocol files untouched

### Setup: install tmux plugins from Stow apply

- **setup/stow**: Moved TPM and tmux plugin installation into `scripts/stow.sh`
  - Installs `tmux-plugins/tpm` under `~/.tmux/plugins/tpm` when missing
  - Runs `~/.tmux/plugins/tpm/bin/install_plugins` after Stow links `~/.tmux.conf`
  - Gives the default, Coinbase, and bootstrap flows one shared tmux plugin install path

### tmux: use maintained Tokyo Night plugin

- **tmux/theme**: Standardized Tokyo Night tmux theming on `janoamaral/tokyo-night-tmux`
  - Replaced the less-maintained `cappyzawa/tmux-tokyonight` plugin declaration
  - Restored the documented Tokyo Night widget settings for path display and optional widgets
  - Keeps the tmux theme aligned with README troubleshooting guidance and plugin support history

### Setup: add Coinbase Stow profile

- **setup/stow**: Added `./scripts/stow.sh --cb` for Coinbase laptops
  - Applies shared `zsh`, `git`, `ghostty`, `tmux`, `nvim`, and `bin` packages plus `zsh-cb` and `git-cb`
  - Skips OpenCode, Claude Code, and Model Context Protocol configs so personal Codex and local account state remain untouched
  - Adds Coinbase-specific `.zshrc.local` and `.gitconfig.local` Stow packages
  - Makes shared Zsh paths use `$HOME` instead of hard-coded user paths
  - Adds `lazygit` to `Brewfile` for the Snacks lazygit keymap

### Setup: add OpenCode and Claude Code Stow packages

- **setup/stow**: Moved tracked OpenCode config into `stow/opencode/.config/opencode/`
  - Added `opencode` and `claude` to `scripts/stow.sh` managed packages
  - Renamed OpenCode global config to `opencode.json`, matching OpenCode's documented global config path
  - Added `--no-folding` to Stow commands so parent directories stay real directories on fresh machines
  - Added `stow/nvim/.stow-local-ignore` so Neovim package guidance is not linked as `~/AGENTS.md`
  - Added bootstrap backup targets for OpenCode config and Claude Code local settings before Stow apply
  - Added `stow/claude/.claude/settings.local.json` for Claude Code permissions only
  - Left Claude sessions, history, projects, caches, telemetry, plugins, and `.claude.json` out of Stow as local runtime/account state

### Shell: reduce zsh startup latency

- **zsh/performance**: Avoided slow version-manager work during shell startup
  - Changed pyenv initialization to use `pyenv init - zsh --no-rehash`
  - Changed nvm loading to use the documented `--no-use` flag so it loads without auto-selecting a Node version
  - Guarded fzf shell integration so keybindings/completion load only when attached to a terminal, avoiding `zle` warnings in automated interactive shells
  - Documented how to pull and restow the zsh package on another machine

### Setup: split shell bootstrap into focused scripts

- **setup/scripts**: Replaced root `shell_setup.sh` with focused scripts under `scripts/`
  - Added `scripts/bootstrap.sh` for non-Stow machine setup: Homebrew, `Brewfile`, Oh My Zsh, zsh plugin, tmux plugins, Neovim plugin sync, npm globals, and Amp CLI
  - Added `scripts/backup.sh` for exporting the current machine's Brewfile and copying live config back into `stow/*`
  - Kept `scripts/stow.sh` as the day-to-day dotfile apply/delete/dry-run command
  - Archived the original all-in-one script at `old/shell_setup.sh`
  - Removed the old `nvm` bootstrap path from the active installer; Node.js is installed from `Brewfile`

### Setup: add dedicated Stow wrapper for daily dotfile updates

- **setup/stow**: Added `scripts/stow.sh` for applying, previewing, and deleting Stow-managed dotfile symlinks
  - `./scripts/stow.sh` restows all managed packages into `$HOME`
  - `./scripts/stow.sh dry-run` previews Stow changes without modifying files
  - `./scripts/stow.sh delete` removes Stow-managed symlinks
  - Updated `README.md` to use `scripts/bootstrap.sh` for full-machine bootstrap and `scripts/stow.sh` for normal dotfile refreshes

### Dotfiles: switch managed config to GNU Stow

- **setup**: Replaced copy-based dotfile application with GNU Stow symlinks
  - Added `stow/` packages for zsh, Git, Ghostty, tmux, Neovim, and local bin scripts
  - `./scripts/bootstrap.sh` backs up existing target files before running `scripts/stow.sh`
  - Added `stow` to `Brewfile` and Docker test dependencies
  - Updated CI/test paths to validate the Stow layout

### Theme switch: Tokyo Night in Neovim

- **nvim/colorscheme**: Switched from One Dark to Tokyo Night night
  - Replaced `navarasu/onedark.nvim` with `folke/tokyonight.nvim`
  - Updated lualine from `onedark` to `tokyonight`
  - Added `nvim-treesitter-context` with `max_lines = 1`, matching the useful context behavior from Dax's setup

### Theme switch: Tokyo Night in Ghostty and tmux

- **ghostty**: Switched from Atom One Dark to built-in `Tokyo Night`
- **tmux**: Switched from `odedlaz/tmux-onedark-theme` to `janoamaral/tokyo-night-tmux`
  - Enabled the relative path widget and disabled optional music/network/web-git/battery/hostname widgets
  - Added Homebrew `bash` because the tmux theme requires Bash 4.2+

### Neovim: add VSpaceCode-style shortcut aliases

- **nvim/keymaps**: Added a lightweight alias layer for Cursor/VSpaceCode muscle memory
  - Added `stow/nvim/.config/nvim/lua/vspacecode-aliases.lua`
  - Set localleader to `,` for major-mode-style actions
  - Added `<leader>f`, `<leader>p`, `<leader>w`, and `<leader>q` groups backed by existing Snacks, LSP, vim-test, and window commands

### Neovim: simplify Markdown workflow

- **nvim/markdown**: Removed `MeanderingProgrammer/render-markdown.nvim` for a raw Markdown editing workflow
  - Added `stow/nvim/.config/nvim/ftplugin/markdown.lua` with wrap, linebreak, spell, and no conceal
  - Added `<leader>mp` and `,p` to preview the current Markdown file with the `glow` CLI
  - Added Homebrew `glow` to `Brewfile`

### Zed

 - Add zed configurations

### Neovim: simplify editing defaults and move indentation into ftplugins

- **nvim/editing**: Moved language-specific indentation out of global autocmds and into filetype-local config
  - Added `nvim/ftplugin/go.lua`, `nvim/ftplugin/python.lua`, `nvim/ftplugin/javascript.lua`, and `nvim/ftplugin/typescript.lua`
  - Go now uses real tabs (`expandtab = false`); Python, JavaScript, and TypeScript remain space-based
  - Added `autoread`, `incsearch`, global `listchars`, and `colorcolumn` in `nvim/lua/vim-options.lua`
  - Added the `%%` command-line shortcut to expand the current file directory
  - Updated `README.md` to document the new editing defaults and `ftplugin/` layout

### Setup: auto-install tmux plugins and clarify work-laptop update flow

- **shell setup**: `./shell_setup.sh install` now installs tmux plugins automatically when TPM is available
  - Runs `~/.tmux/plugins/tpm/bin/install_plugins` after TPM install/detection
  - Keeps going with a warning if TPM plugin install fails instead of aborting the whole setup
  - Updated `README.md` with a step-by-step "existing Mac / work laptop" flow
  - Updated docs so tmux plugin install is no longer described as a required manual post-step
  - File: `shell_setup.sh`

### Terminal UX: restore blinking block cursor in Ghostty and tmux

- **cursor behavior**: Enabled a blinking block cursor consistently in both the terminal and tmux panes
  - Set `cursor-style-blink = true` in `ghostty/config`
  - Added `setw -g cursor-style blinking-block` to `tmux/tmux.conf`
  - Updated tmux docs to reflect the intended cursor behavior

### tmux: fix One Dark status bar rendering on modern tmux

- **tmux/theme**: Fixed the top status bar fallback background so One Dark renders cleanly on tmux 3.x+
  - Added `set -g status-style "fg=#aab2bf,bg=#282c34"` after TPM initialization
  - Prevents the default green `status-style` filler from showing through behind themed segments
  - Clarified tmux troubleshooting docs to check plugin installation and the modern `status-style` override
  - File: `tmux/tmux.conf`

### Setup: integrate Amp CLI into shell install script

- **shell_setup.sh**: Added Amp CLI installation as step 13 of the install process
  - Runs the official install script: `curl -fsSL https://ampcode.com/install.sh | bash`
  - Skips installation if Amp is already present
  - Displays Amp version on first run for verification
  - Updated header comment to include Amp in the tool list
  - Added Amp CLI section to the final setup summary with sign-in instructions
  - File: `shell_setup.sh`

### Cursor: sync refresh + cross-machine apply docs

- **cursor config sync**: Refreshed tracked Cursor settings from local machine
  - Synced `cursor/settings.json` and `cursor/keybindings.json` with current local Cursor user config
  - Added keybinding: `alt+cmd+s` -> `workbench.action.toggleUnifiedSidebarFromKeyboard`
  - Regenerated `cursor/extensions.txt` from installed extensions (adds/removals reflected)

- **cursor docs**: Documented restore flow for other machines
  - Added an "Apply on another machine" section with copy/install steps and optional extension cleanup
  - File: `cursor/README.md`

### Neovim: remove oil.nvim file editor

- **nvim/files**: Removed `stevearc/oil.nvim` to standardize on a sidebar-first file tree workflow
  - Deleted `nvim/lua/plugins/oil.lua`
  - Removed the `-` keybinding that opened Oil in a floating directory buffer
  - Removed the `oil.nvim` lock entry from `nvim/lazy-lock.json`
  - Kept `neo-tree.nvim` as the single built-in file explorer

### Neovim: remove DAP stack in favor of terminal-first debugging

- **nvim/debugging**: Removed the in-editor DAP stack to keep Neovim leaner
  - Deleted `nvim/lua/plugins/debugging.lua`
  - Removed the `<leader>d` which-key group and debugging docs
  - Removed DAP-related lock entries from `nvim/lazy-lock.json`
  - Standardized on terminal-first debugging with `dlv` / `debugpy` plus tests and print/log debugging

### Neovim: remove opencode.nvim integration

- **nvim/plugins**: Removed `NickvanDyke/opencode.nvim` from the Neovim setup
  - Deleted `nvim/lua/plugins/opencode.lua`
  - Removed the `<leader>o` which-key group and AI keybinding docs
  - Removed the `opencode.nvim` lock entry from `nvim/lazy-lock.json`
  - Updated safety harness/docs references that still assumed the plugin existed

### Neovim: restore flash.nvim jump mappings

- **nvim/motion**: Restored tracked `folke/flash.nvim` config so docs and live config match again
  - Re-added `nvim/lua/plugins/flash.lua`
  - Restored which-key jump group and mappings: `<leader>jj`, `<leader>jw`, `<leader>jl`
  - Updated `nvim/lazy-lock.json` with `flash.nvim`

### Theme switch: One Dark across the stack

- **nvim/colorscheme**: Switched from Catppuccin Macchiato to One Dark
  - Replaced `catppuccin/nvim` with `navarasu/onedark.nvim`
  - Updated lualine theme from `catppuccin` to `onedark`
  - Files: `nvim/lua/plugins/colorscheme.lua`, `nvim/lua/plugins/lualine.lua`

- **ghostty**: Switched terminal theme from Catppuccin Macchiato to Atom One Dark
  - Updated `theme = Atom One Dark`
  - File: `ghostty/config`

- **tmux**: Switched from `catppuccin/tmux` to `odedlaz/tmux-onedark-theme`
  - Replaced Catppuccin status modules with the One Dark tmux plugin widget system
  - Added `@onedark_widgets "#{b:pane_current_path}"`
  - Updated copy-mode selection colors to the One Dark palette
  - File: `tmux/tmux.conf`

- **opencode**: Updated OpenCode theme to built-in `one-dark`
  - Updated both `opencode/opencode.json` and `opencode/tui.json`

## February 2026

### Theme switch: Catppuccin Macchiato across the stack

- **nvim/colorscheme**: Switched from Nord to Catppuccin Macchiato
  - Replaced `shaunsingh/nord.nvim` with `catppuccin/nvim` (flavour `macchiato`)
  - Updated lualine theme from `nord` to `catppuccin`
  - Files: `nvim/lua/plugins/colorscheme.lua`, `nvim/lua/plugins/lualine.lua`

- **ghostty**: Switched terminal theme from Nord to Catppuccin Macchiato
  - Updated `theme = Catppuccin Macchiato`
  - File: `ghostty/config`

- **tmux**: Switched from Nord theme to Catppuccin Macchiato
  - Replaced `nordtheme/tmux` with `catppuccin/tmux`
  - Added `@catppuccin_flavor "macchiato"` and `@catppuccin_window_status_style "rounded"`
  - Status bar shows directory + session name via Catppuccin status modules
  - Updated copy-mode selection colors to Macchiato palette
  - File: `tmux/tmux.conf`

- **opencode**: Updated OpenCode TUI theme to `catppuccin-macchiato`
  - File: `opencode/opencode.json`

### Neovim: added flash.nvim for motion/jump

- **nvim/motion**: Added `folke/flash.nvim` for fast navigation
  - Jump to character: `<leader>jj`
  - Jump to word: `<leader>jw`
  - Jump to line: `<leader>jl`
  - Lazy-loaded on `VeryLazy`
  - File: `nvim/lua/plugins/flash.lua`

### Neovim: opencode.nvim API migration (provider -> server)

- **nvim/opencode**: Rewrote opencode.nvim configuration for new server-based API
  - Migrated from deprecated `provider` config to `server` config with custom tmux state management
  - Added `event = "VeryLazy"` for lazy loading
  - Custom tmux split management: persistent pane state via file, pane existence checks, graceful toggle/stop
  - Falls back to terminal if not running inside tmux
  - Keymaps unchanged (`<leader>o` prefix)
  - File: `nvim/lua/plugins/opencode.lua`

### Neovim: snacks.nvim updates

- **nvim/snacks**: Disabled background toggle to prevent OptionSet recursion
  - Removed `Snacks.toggle.option("background", ...)` mapping (`<leader>ub`) that caused startup loop risk
  - File: `nvim/lua/plugins/snacks.lua`

### Cleanup: Karabiner files removed from repo root

- **karabiner**: Deleted deprecated Karabiner configs from tracked files
  - Removed `karabiner/AGENTS.md`, `karabiner/karabiner.json`, and all complex modification JSON files
  - Archived copies available under `old/karabiner/`

### Neovim rollback: keep noice, remove recent visual additions

- **rollback**: Removed recently added visual plugins from repo and live config, keeping only `noice.nvim`
  - Removed plugin specs:
    - `nvim/lua/plugins/colorizer.lua`
    - `nvim/lua/plugins/tiny-devicons-auto-colors.lua`
    - `nvim/lua/plugins/todo-comments.lua`
    - `nvim/lua/plugins/indent-rainbowline.lua`
  - Restored Snacks indentation ownership (`indent = { enabled = true }`) after removing rainbowline integration
  - Uninstalled local plugin directories:
    - `~/.local/share/nvim/lazy/nvim-colorizer.lua`
    - `~/.local/share/nvim/lazy/tiny-devicons-auto-colors.nvim`
    - `~/.local/share/nvim/lazy/todo-comments.nvim`
    - `~/.local/share/nvim/lazy/indent-rainbowline.nvim`
    - `~/.local/share/nvim/lazy/indent-blankline.nvim`

- **incident log**: Documented root cause of markdown crashes
  - Crash signature: `CODESIGNING Invalid Page` while loading Tree-sitter language parsers via `uv_dlopen`
  - Root cause: stale parser artifacts (`markdown.so.disabled`, `markdown_inline.so.disabled`) remained in `~/.local/share/nvim/site/parser` and were still discovered by runtime parser globbing
  - Recovery: moved stale parser artifacts out of runtime path

- **docs**: Added incident and recovery documentation
  - `README.md` now includes a Feb 2026 Neovim incident log and markdown crash troubleshooting steps

### Neovim safety: isolated plugin regression harness

- **test harness**: Added `test/nvim_plugin_safety.sh` to validate plugin changes safely
  - Runs startup in an isolated throwaway XDG profile (never touches live `~/.config/nvim`)
  - Performs one-by-one rollout checks for changed plugin files (`nvim/lua/plugins/*.lua`) relative to a base ref
  - Validates terminal startup and optional tmux startup behavior
  - Enforces lockfile discipline by failing if `nvim/lazy-lock.json` checksum changes (unless explicitly allowed)
  - Adds guardrails for known startup traps:
    - blocks `Snacks.toggle.option("background", ...)`
    - blocks `OptionSet` + `background` autocmd patterns in plugin specs
      - requires lazy-loading triggers for high-risk integrations (`noice.lua`)
  - Captures an `nvim/` snapshot artifact in `/tmp` for fast rollback context during test runs
  - File: `test/nvim_plugin_safety.sh`

- **test runner**: Added best-effort Neovim safety test stage
  - `test/run_tests.sh` now runs `bash test/nvim_plugin_safety.sh --base-ref HEAD --skip-tmux` when `nvim` exists
  - File: `test/run_tests.sh`

- **docs**: Added usage docs for the Neovim safety harness
  - File: `README.md`

### Cursor: track personal settings in dotfiles

- **cursor config backup**: Added a first-class `cursor/` folder for personal Cursor settings
  - Added `cursor/settings.json` and `cursor/keybindings.json` from local Cursor user config
  - Added `cursor/extensions.txt` with installed extension IDs
  - Added `cursor/README.md` documenting source paths and refresh commands
  - Files: `cursor/settings.json`, `cursor/keybindings.json`, `cursor/extensions.txt`, `cursor/README.md`

- **security hygiene**: Prevented accidental commits of sensitive Cursor files
  - Ignored potential secret-bearing files under repo `cursor/`: `syncLocalSettings.json`, `mcp.json`, `argv.json`
  - File: `.gitignore`

### tmux: smart pane switching and improved UX

- **tmux/tmux.conf**: Added Vim-aware pane navigation and usability improvements
  - Smart pane switching: C-h/j/k/l detects if pane is running vim/nvim and sends keys appropriately
  - Copy-mode navigation: C-h/j/k/l works in copy-mode without vim detection
  - Pane resize: M-Arrow keys for quick resizing (5px horizontal, 2px vertical)
  - Utilities: C-k clears history, C-a R toggles switch-client
  - Copy-mode selection styling: Nord-themed yellow highlight for better visibility
  - Files: `tmux/tmux.conf`

### Neovim: migrated nvim-treesitter to `main` rewrite

- **nvim/treesitter**: Migrated from frozen `master` API to `main` API
  - Replaced `require("nvim-treesitter.configs").setup(...)` with `require("nvim-treesitter").setup({})`
  - Added parser bootstrap via `require("nvim-treesitter").install(...)`
  - Enabled highlighting + indentation via `FileType` autocmd (`vim.treesitter.start()` + `indentexpr`)
  - Set plugin spec to `branch = "main"` and `lazy = false` per upstream `main` guidance
  - Files: `nvim/lua/plugins/treesitter.lua`, `nvim/lazy-lock.json`

### Setup: auto-sync Neovim plugins during install

- **shell setup**: Added headless Lazy sync after copying Neovim config
  - Runs: `nvim --headless -c "Lazy! sync" -c "qa"`
  - Prevents startup errors on fresh machines where plugin modules are not installed yet
  - File: `shell_setup.sh`

### Setup: backup tmux config and sessionizer

- **shell setup**: Included tmux assets in backup flow so changes are persisted to dotfiles
  - `~/.tmux.conf` now backs up to `tmux/tmux.conf`
  - `~/.local/bin/tmux-sessionizer` now backs up to `bin/tmux-sessionizer`
  - Updated backup summary to include both files
  - File: `shell_setup.sh`

### Neovim: added markdown rendering plugin

- **nvim/markdown**: Added `MeanderingProgrammer/render-markdown.nvim` for in-buffer markdown rendering
  - Lazy-loads for markdown buffers
  - File: `nvim/lua/plugins/render-markdown.lua`

### Neovim: added Diffview + Spectre workflows

- **nvim/git review**: Added `sindrets/diffview.nvim` for tabbed diff review and file history
  - Keymaps: `<leader>gD`, `<leader>gC`, `<leader>gh`, `<leader>gH`
  - File: `nvim/lua/plugins/diffview.lua`

- **nvim/search + replace**: Added `nvim-pack/nvim-spectre` for project and file-scoped search/replace
  - Keymaps: `<leader>sR`, `<leader>sw` (normal + visual), `<leader>sW`
  - File: `nvim/lua/plugins/spectre.lua`

- **nvim/which-key**: Added labels for new Diffview and Spectre keymaps
  - File: `nvim/lua/plugins/which-key.lua`

- **docs**: Updated Neovim plugin list, requirements, and keybindings
  - File: `README.md`

### Theme update: switched back to Nord (Neovim + Ghostty)

- **nvim**: Switched colorscheme from Catppuccin back to Nord
  - Replaced `catppuccin/nvim` with `shaunsingh/nord.nvim`
  - Updated lualine theme from `catppuccin` to `nord`
  - Files: `nvim/lua/plugins/colorscheme.lua`, `nvim/lua/plugins/lualine.lua`

- **ghostty**: Switched terminal theme from Catppuccin Mocha to Nord
  - Updated `theme = Nord`
  - File: `ghostty/config`

- **docs**: Updated theme references to match current configuration
  - Updated Neovim and Ghostty theme labels in `README.md`
  - Updated Neovim package identity in `nvim/AGENTS.md`

### Deprecated: Karabiner

- **Brewfile**: Removed `karabiner-elements` cask from managed installs
- **README**: Replaced Karabiner setup instructions with deprecation note
- **AGENTS docs**: Removed Karabiner from active root guidance; kept `karabiner/` as archive reference

### Documentation + which-key label corrections

- **nvim/which-key**: Corrected label accuracy for active keymaps
  - Removed stale groups with no active mappings: `<leader>f` (Find), `<leader>l` (LSP)
  - Fixed incorrect label: `<leader>sg` changed from "Git Search" to "Grep"
  - Converted leaf entries from `group` to `desc` for proper which-key rendering:
    - `<leader>sn` -> "Notification History"
    - `<leader>ss` -> "LSP Symbols"
  - File: `nvim/lua/plugins/which-key.lua`

- **nvim/vim-options**: Added keymap description for search highlight clear
  - `<leader>h` now has `desc = "Clear search highlight"`
  - File: `nvim/lua/vim-options.lua`

- **README**: Updated keybinding docs to match current mappings
  - `<leader>sg` documented as "Grep" (instead of "Live grep")
  - Added `<leader>h` -> "Clear search highlight"

### Major Neovim Migration: snacks.nvim + blink.cmp + opencode.nvim

- **nvim**: Complete plugin ecosystem overhaul
  - **ADDED** `folke/snacks.nvim` - Modern QoL plugin collection
    - Replaces: `alpha.nvim`, `nvim-bbye`, `indent-blankline.nvim`, `nvim-surround`, `Comment.nvim`
    - New features: `dashboard`, `bufdelete`, `indent`, `scope`, `notifier`, `lazygit`, `scratch`, `words`, `git`, `zen`, `toggle`, `quickfile`, `bigfile`
    - Enabled `input` and `picker` for opencode.nvim integration
    - Keymaps: `<leader>s` prefix for search/picker, `<leader>u` for toggles, `<leader>bd` for buffer delete
    - File: `nvim/lua/plugins/snacks.lua`
  
  - **ADDED** `saghen/blink.cmp` - High-performance completion engine
    - Replaces: `nvim-cmp`, `cmp-nvim-lsp`, `cmp-buffer`, `cmp-path`, `cmp_luasnip`
    - Rust-based fuzzy matching (0.5-4ms response time)
    - Native LuaSnip integration maintained
    - `super-tab` preset for Tab-to-accept behavior
    - File: `nvim/lua/plugins/blink.lua`
  
  - **ADDED** `NickvanDyke/opencode.nvim` - AI coding assistant integration
    - New plugin for opencode CLI integration within Neovim
    - Uses tmux provider (horizontal split, focus stays in Neovim)
    - Keymaps: `<leader>o` prefix (oa=ask, os=select, ot=toggle, oo=operator, og=line)
    - blink.cmp completion support in ask() input
    - File: `nvim/lua/plugins/opencode.lua`
  
  - **REMOVED** deprecated plugins:
    - `alpha.nvim` → replaced by snacks dashboard
    - `nvim-cmp` ecosystem → replaced by blink.cmp
    - `telescope.nvim` → replaced by snacks.picker
    - `editor.lua` (vim-bbye, indent-blankline, surround, comment) → replaced by snacks
  
  - **UPDATED** `nvim/lua/plugins/lsp-config.lua`
    - Changed dependency from `cmp-nvim-lsp` to `saghen/blink.cmp`
    - Updated LSP capabilities to use `blink.cmp.get_lsp_capabilities()`
  
  - **UPDATED** `nvim/lua/plugins/which-key.lua`
    - Added keymap groups: `<leader>o` (historical), `<leader>s` (Search), `<leader>u` (Toggle)
    - Added labels for `<leader>sn` (Notifications), `<leader>ss` (LSP Symbols), `<leader>sg` (Grep)

- **Brewfile**: Added new dependencies
  - `lazygit` - Terminal UI for git (required for snacks.lazygit keymap `<leader>gg`)
  - `imagemagick` - Image manipulation (required for snacks.image preview support)

### Synced (Historical snapshot)

- **nvim**: Synced live config from `~/.config/nvim` to dotfiles repo
  - Added `lazy-lock.json` for plugin version locking
  - At that time, `treesitter.lua` used the frozen `master` API:
    - `nvim-treesitter/nvim-treesitter` on `master` branch (v0.10-era)
    - `require("nvim-treesitter.configs").setup()`
  - At that time, `telescope.lua` was on `0.1.x`
  - Minor formatting fix in `git.lua`

**Historical note**: The January 2025 migration to treesitter `main` was attempted and reverted at that time. As of February 2026, treesitter is migrated to `main` with the new API (see entries above).

## January 2025

### Changed

- **nvim/lsp-config**: Replaced deprecated `sign_define()` with `vim.diagnostic.config()`
  - Diagnostic signs now configured via `signs.text` table in `vim.diagnostic.config()`
  - Fixes deprecation warning: "Defining diagnostic signs with :sign-define or sign_define() is deprecated"
  - See `nvim/lua/plugins/lsp-config.lua`

- **nvim/lsp-config**: Added `virtual_lines` for inline diagnostic messages
  - Shows full diagnostic message below the error line when cursor is on it
  - Configured with `virtual_lines = { current_line = true }`
  - Requires Neovim 0.11+

- **nvim/lsp-config**: Added descriptions to all LSP keymaps
  - `gd` → "Go to definition", `gD` → "Go to declaration", etc.
  - Descriptions now appear in which-key popup
  - See `nvim/lua/plugins/lsp-config.lua`

- **nvim/which-key**: Disabled icon rules to fix blue square glyphs
  - Added `icons = { rules = false }` to which-key setup
  - Prevents filetype icon fallback that caused rendering issues
  - See `nvim/lua/plugins/which-key.lua`

- **nvim/vim-options**: Enabled relative line numbers
  - Changed `vim.opt.relativenumber` from `false` to `true`
  - See `nvim/lua/vim-options.lua`

### Added

- **Brewfile**: Added `btop` system monitor for performance monitoring

- **opencode**: Added opencode.json configuration
  - Catppuccin theme
  - MCP server configs (RepoPrompt, Ref, Exa)
  - API keys redacted with `****` - replace with your own

- **bin/tmux-sessionizer**: New fzf-based project switcher script
  - Fuzzy find and switch between project directories
  - Creates named tmux sessions for each project
  - Session name visible in status bar provides project context
  - Bound to `C-a f` in tmux
  - Inspired by ThePrimeagen's workflow

- **nvim**: Git merge conflict resolution via `git-conflict.nvim`
  - VSCode-like visual highlighting of conflict regions
  - Keymaps: `co` (ours), `ct` (theirs), `cb` (both), `c0` (none)
  - Navigation: `]x` / `[x` to jump between conflicts
  - `:GitConflictListQf` to list all conflicts in quickfix
  - See `nvim/lua/plugins/git.lua`

- **npm-global-packages.txt**: Added `tree-sitter-cli` as a required dependency

- **nvim**: Debugging support via nvim-dap ecosystem
  - `nvim-dap` + `nvim-dap-ui` + `nvim-dap-virtual-text`
  - `mason-nvim-dap` for auto-installing debug adapters
  - Go debugging via `nvim-dap-go` (delve)
  - Python debugging via `nvim-dap-python` (debugpy)
  - Keymaps under `<leader>d` prefix (dc=continue, db=breakpoint, etc.)
  - DAP UI auto-opens when debugging starts
  - See `nvim/lua/plugins/debugging.lua`

- **zshrc**: Added OpenCode to PATH (`export PATH="$HOME/.opencode/bin:$PATH"`)

### Changed

- **nvim**: Switched colorscheme from Nord to Catppuccin Mocha
  - Replaced `shaunsingh/nord.nvim` with `catppuccin/nvim`
  - Updated lualine theme from `nord` to `catppuccin`
  - See `nvim/lua/plugins/colorscheme.lua` and `nvim/lua/plugins/lualine.lua`

- **ghostty**: Switched from manual Nord palette to Catppuccin Mocha
  - Replaced 20+ lines of manual color definitions with `theme = Catppuccin Mocha`
  - Uses Ghostty's built-in theme support for cleaner config

- **tmux**: Switched from Nord theme to Catppuccin Mocha
  - Replaced: `set -g @plugin 'nordtheme/tmux'`
  - Added: `set -g @plugin 'catppuccin/tmux'` with mocha flavor
  - Status bar shows directory + session name for project context
  - Rounded window status style

- **zshrc**: Switched from `agnoster` to `robbyrussell` theme
  - Faster prompt rendering (no powerline overhead)
  - Project context now provided by tmux session name instead of prompt
  - Part of "speed-focused" terminal setup

- **tmux**: Replaced `vim-tmux-navigator` TPM plugin with manual `is_vim` script
  - Removed: `set -g @plugin 'christoomey/vim-tmux-navigator'`
  - Added: Manual `is_vim` detection script (~15 lines in tmux.conf)
  - Benefits: Reduces dependencies, same functionality, transparent implementation
  - Still works seamlessly with `nvim-tmux-navigation` Neovim plugin
  - C-h/j/k/l switches between vim splits and tmux panes as before

- **nvim/telescope**: [ATTEMPTED, REVERTED] Migrated telescope.nvim from `0.1.x` to `master` branch
  - The `0.1.x` branch is incompatible with nvim-treesitter `main` branch
  - `0.1.x` uses deprecated `nvim-treesitter.parsers.ft_to_lang()` which no longer exists
  - `master` branch uses built-in `vim.treesitter.language.get_lang()` (requires Neovim >= 0.9)
  - Fix for error: `attempt to call field 'ft_to_lang' (a nil value)`
  - **REVERTED**: Back to `0.1.x` for stability (see February 2026)

- **nvim/treesitter**: Disabled folding by default (`vim.opt.foldenable = false`)
  - Treesitter-based folding was collapsing all code blocks on file open
  - Users can still use `zR` to open all folds or toggle with `:set foldenable`

- **nvim**: [ATTEMPTED, REVERTED] Migrated nvim-treesitter to `main` branch (breaking change from `master`)
  - `master` branch is now frozen; `main` branch is a complete rewrite
  - Replaced `require("nvim-treesitter.configs").setup()` with new API
  - Now uses `require("nvim-treesitter").install()` for parser installation
  - Highlighting/indentation enabled via `FileType` autocmd (`vim.treesitter.start()`)
  - Added treesitter-based folding (`vim.opt.foldexpr`)
  - Requires `tree-sitter-cli` >= 0.26.1 (install via `npm install -g tree-sitter-cli`)
  - See `nvim/lua/plugins/treesitter.lua`
  - **REVERTED**: Back to `master` branch with old API for stability (see February 2026)

- **Brewfile**: Added `ripgrep` (required for Telescope live grep)

- **Brewfile**: Removed `starship` prompt (deprecated, using oh-my-zsh agnoster theme)

- **zshrc**: Added `unsetopt autocd` to prevent directory name commands from triggering cd

- **tmux**: Replaced manual Nord theme styles with `nordtheme/tmux` TPM plugin
  - Removed: 12 lines of hand-coded status bar styles
  - Added: `set -g @plugin 'nordtheme/tmux'`
  - Benefits: Official theme, powerline-style status bar, maintained upstream

- **tmux**: Added reload keybind (`C-a r` to source ~/.tmux.conf)

- **tmux**: Status bar positioned at top (`status-position top`)

- **zshrc**: Enhanced history settings
  - `HISTSIZE=10000`, `SAVEHIST=50000`
  - `inc_append_history` - save immediately, not on exit
  - `share_history` - share between terminal sessions

### Removed

- **warp**: Removed `themes/nord.yaml` (deprecated, switched to Catppuccin)

- **ghostty**: Removed split keybindings (`cmd+s>h/j/k/l/x`, `cmd+s>Arrow`, `shift+enter`)
  - Using tmux for all split/pane management instead
  - Simplifies config, avoids redundant functionality

### Documentation

- Updated `nvim/AGENTS.md` with debugging keybindings and touch points
- Removed deprecated `CLAUDE.md` files (replaced by `AGENTS.md`)
- Added this CHANGELOG

## January 2026

### Changed

- **nvim**: Migrated from none-ls to modern conform.nvim + nvim-lint architecture
  - **BREAKING**: Removed `nvim/lua/plugins/none-ls.lua` (none-ls deprecated)
  - **NEW**: Added `nvim/lua/plugins/conform.lua` for formatting (format-on-save)
  - **NEW**: Added `nvim/lua/plugins/nvim-lint.lua` for linting (async, non-blocking)
  - Separates formatting and linting concerns for better performance and maintainability
  - Community-standard approach used by LazyVim, AstroNvim
  - See migration details below

- **nvim/Python stack**: Switched to Astral's unified Python toolchain (Ruff + ty)
  - **Linting**: Replaced flake8 with Ruff (~100x faster, < 10ms)
  - **Formatting**: Replaced black + isort with Ruff (drop-in compatible, < 20ms)
  - **Type checking**: Replaced mypy on-save with ty LSP (10-100x faster than mypy/Pyright)
  - **ty v0.0.11 (Beta)**: Production-ready per Astral, stable release planned 2026
  - **NOTE**: ty installed via `uv tool install ty@latest` (not in Mason yet)
  - Pyright installed as fallback option if needed

- **nvim/performance**: Disabled legacy providers for 5x faster Python file loading
  - Added `vim.g.loaded_python3_provider = 0` (saves ~1.2s per Python file)
  - Also disabled: `loaded_ruby_provider`, `loaded_perl_provider`, `loaded_node_provider`
  - **Performance improvement**: Python files load in ~287ms (down from ~1400ms)
  - **Caveat**: If you use Python-based nvim plugins (rare), remove this line
  - Modern Lua-based plugins unaffected

- **nvim/lsp-config**: Disabled pyright auto-enable to prevent LSP conflicts
  - Commented out `"pyright"` in mason-lspconfig ensure_installed
  - ty is now the primary Python LSP, pyright available as fallback
  - Prevents double LSP attachment (both ty and pyright attaching to same file)

- **nvim/completions**: Prevented Enter from auto-accepting first completion
  - `cmp.mapping.confirm({ select = false })` now requires explicit selection
  - See `nvim/lua/plugins/completions.lua`

- **nvim/vim-options**: Added language-specific indentation rules
  - **Python/Go**: 4 spaces (shiftwidth, tabstop, softtabstop = 4)
  - **JavaScript/TypeScript**: 2 spaces (shiftwidth, tabstop, softtabstop = 2)
  - Uses FileType autocmds for per-language configuration
  - Removed global hardcoded 2-space indent settings

- **nvim/nvim-lint**: Optimized linting triggers for better performance
  - Runs on BufWritePost only (after save, not on file open)
  - Changed event trigger from BufReadPre to BufReadPost (delayed load)
  - Removed BufEnter autocmd to prevent linting on every buffer switch
  - Async execution prevents blocking editor

### Performance Summary

**Before migration:**
- Python file load: ~1400ms
- Python file save: ~2-5s (mypy + flake8 + black + isort)

**After migration:**
- Python file load: ~287ms (5x faster)
- Python file save: < 50ms (100x faster)
- Type checking: Real-time via ty LSP (< 10ms incremental updates)

### Installation Notes

**New dependencies:**
```bash
# uv (Astral package manager) - auto-installed during setup
curl -LsSf https://astral.sh/uv/install.sh | sh

# ty (Type checker) - install via uv
uv tool install ty@latest

# Mason tools (install via :MasonInstall in nvim)
:MasonInstall ruff pyright
```

**PATH configuration:**
Added to ~/.zshrc: `export PATH="$HOME/.local/bin:$PATH"`

### Toolchain Summary

**Python:**
- Indent: 4 spaces
- Linting: Ruff (replaces flake8)
- Formatting: Ruff (replaces black + isort)
- Type checking: ty LSP (replaces mypy/pyright)

**Go:**
- Indent: 4 spaces
- Linting: golangci-lint
- Formatting: goimports + gofmt
- Type checking: gopls

**JavaScript/TypeScript:**
- Indent: 2 spaces
- Linting: biome
- Formatting: biome
- Type checking: ts_ls

**Lua:**
- Formatting: stylua

### Rollback Instructions

If you need to revert these changes:
```bash
# Restore from backup
rm -rf ~/.config/nvim
cp -r ~/.config/nvim.backup.20260109140837 ~/.config/nvim
```

Or switch to Pyright instead of ty:
1. Uncomment `"pyright"` in lsp-config.lua line 31
2. Comment out ty configuration (lines 54-67)
3. Restart nvim

---

- **opencode**: Switched MCP web search tool from Exa to Tavily

## Previous (Undated)

Initial dotfiles setup with:
- Neovim config (lazy.nvim, Nord theme, LSP, Treesitter, Telescope)
- tmux config (Nord theme, TPM plugins, session persistence)
- Ghostty terminal config
- Zsh with oh-my-zsh, nvm, syntax highlighting
- Karabiner keyboard remapping
- MCP configs for AI coding assistants
- Docker-based test suite
