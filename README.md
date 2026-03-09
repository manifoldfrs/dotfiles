# dotfiles

Configuration files for zsh, Homebrew, Ghostty terminal, tmux, Neovim, and OpenCode. Currently using the **One Dark** theme family across Neovim, Ghostty, tmux, and OpenCode.

## Requirements

| Tool | Minimum Version | Notes |
|------|-----------------|-------|
| **Neovim** | >= 0.11.0 | Required for mason-lspconfig v2 and vim.lsp.config() |
| **Git** | >= 2.19.0 | Required for lazy.nvim partial clones |
| **Ghostty** | Latest | Uses `macos-option-as-alt` syntax |
| **Node.js** | LTS | For LSP servers via Mason |
| **tree-sitter-cli** | >= 0.26.1 | Required for nvim-treesitter `main` branch parser compilation |
| **lazygit** | >= 0.40 | Required for snacks.lazygit keymap (`<leader>gg`) |
| **ripgrep** | >= 13.0 | Required for nvim-spectre search backend |
| **gnu-sed** | Latest | Recommended on macOS for nvim-spectre replace engine (`brew install gnu-sed`) |
| **imagemagick** | >= 7.0 | Required for snacks.image preview support |

[![Test Dotfiles](https://github.com/manifoldfrs/dotfiles/actions/workflows/test.yml/badge.svg)](https://github.com/manifoldfrs/dotfiles/actions/workflows/test.yml)

## Quick Start (New Mac)

```bash
# 1. Clone the repo
git clone https://github.com/manifoldfrs/dotfiles.git ~/dotfiles

# 2. Run the installer
cd ~/dotfiles
./shell_setup.sh install

# 3. Fully quit and reopen your terminal

# 4. Verify Node.js works
node --version

# 5. Install OpenCode (optional, for AI features)
curl -fsSL https://opencode.ai/install | bash
```

## Update an Existing Mac / Work Laptop

Use this when the repo is already on the machine and you just want the latest dotfiles applied.

```bash
# 1. Get the latest committed dotfiles
cd ~/dotfiles
git pull

# 2. Reapply all tracked shell/editor/terminal config
./shell_setup.sh install

# 3. Fully quit and reopen your terminal

# 4. Restart tmux so the new config/theme is guaranteed to load cleanly
tmux kill-server

# 5. Verify the basics
node --version
tmux -V
```

What this already handles for you:
- recopies your zsh, Ghostty, tmux, and Neovim config
- installs Homebrew packages from `Brewfile`
- installs tmux TPM if needed and installs tmux plugins automatically
- runs Neovim headless plugin sync automatically

Ghostty note on this macOS setup:
- the canonical live config path is `~/Library/Application Support/com.mitchellh.ghostty/config`
- the legacy path `~/.config/ghostty/config` is deprecated on macOS
- `./shell_setup.sh install` now moves any legacy file aside to `~/.config/ghostty/config.deprecated.*`

What is still separate:
- `./mcp_setup.sh install` for Claude/Codex MCP configs
- OpenCode install/config if you use it on that machine

## What Gets Installed

### Shell Setup (`shell_setup.sh install`)

- **Homebrew** + all packages from `Brewfile` (includes Ghostty, tmux, Nerd Fonts)
- **Oh My Zsh** with `robbyrussell` theme (minimal, fast)
- **zsh-syntax-highlighting** plugin
- **nvm** (Node Version Manager) via HTTPS
- **Node.js LTS** via nvm (installed if missing)
- **Configs copied**: `.zshrc`, `.zprofile`, `.zshenv`, `.gitconfig`, `ghostty/config` → `~/Library/Application Support/com.mitchellh.ghostty/config` on macOS (`~/.config/ghostty/config` fallback elsewhere), `tmux/tmux.conf` → `~/.tmux.conf`, `nvim/` → `~/.config/nvim`, `bin/tmux-sessionizer` → `~/.local/bin/tmux-sessionizer`
- **Ghostty legacy cleanup on macOS**: if `~/.config/ghostty/config` exists, the installer moves it aside as `~/.config/ghostty/config.deprecated.*` so there is one canonical live path
- **tmux TPM + plugins**: TPM is installed if missing, then tmux plugins are installed automatically
- **Neovim plugins synced** headlessly via lazy.nvim (`nvim --headless -c "Lazy! sync" -c "qa"`)

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

### Karabiner Status

Karabiner is deprecated in this repo and no longer installed by `shell_setup.sh`/`Brewfile`.
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
| render-markdown.nvim | In-buffer markdown rendering |
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

- Per-language indentation now lives in `nvim/ftplugin/*.lua` for simpler ownership and less global autocmd logic
- Go uses real tabs; Python, JavaScript, and TypeScript stay space-based
- Incremental search and autoread are enabled for faster search feedback and cleaner external file reloads
- Visible whitespace (`listchars`) and an 80-column guide (`colorcolumn`) are enabled globally

## Keybindings

### Neovim

Tiny which-key guide: `<leader>g` Git, `<leader>s` Search, `<leader>t` Test, `<leader>j` Jump, `<leader>u` Toggle.

| Keys | Action |
|------|--------|
| `Space` | Leader key |
| `jk` (insert) | Escape to Normal |
| `%%` (command) | Insert current file directory |
| `<C-n>` | Toggle neo-tree |
| `<leader>h` | Clear search highlight |
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
| `<leader>sj` | Jumps |
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

**Note:** Status bar is positioned at the top with the One Dark tmux theme (`odedlaz/tmux-onedark-theme`) plus a current-directory widget. The terminal/tmux cursor uses a blinking block. Pane navigation uses a manual `is_vim` script (not the TPM navigator plugin) for transparency and fewer dependencies. Works seamlessly with `nvim-tmux-navigation` in Neovim.

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

## File Structure

```
dotfiles/
├── shell_setup.sh          # Main shell/brew/zsh installer
├── mcp_setup.sh            # MCP config backup/install
├── Brewfile                # Homebrew packages
├── npm-global-packages.txt # Global npm packages
├── .zshrc                  # Zsh configuration
├── .zprofile               # Zsh profile
├── .zshenv                 # Zsh environment
├── .gitconfig              # Git configuration
├── CHANGELOG.md            # Change history
├── ghostty/                # Ghostty terminal config (Atom One Dark)
│   └── config
├── bin/                    # Shell scripts
│   └── tmux-sessionizer    # Project switcher (fzf-based)
├── tmux/                   # tmux configuration (One Dark)
│   └── tmux.conf
├── nvim/                   # Neovim config (lazy.nvim + navarasu/onedark.nvim)
│   ├── init.lua
│   ├── lazy-lock.json      # Plugin version lock
│   ├── ftplugin/           # Filetype-specific editing defaults
│   │   ├── go.lua
│   │   ├── python.lua
│   │   ├── javascript.lua
│   │   └── typescript.lua
│   └── lua/
│       ├── vim-options.lua # Global options and base keymaps
│       └── plugins/        # Plugin configurations
│           ├── snacks.lua      # QoL plugins + picker
│           ├── blink.lua       # Autocompletion (Rust)
│           ├── flash.lua       # Motion/jump plugin
│           ├── noice.lua       # Command-line + message UI
│           ├── lsp-config.lua  # LSP configuration
│           ├── treesitter.lua  # Treesitter main-branch config
│           ├── render-markdown.lua  # Markdown rendering
│           └── ...
├── old/karabiner/           # Deprecated keyboard remapping archive
├── mcp/                    # MCP configs for AI tools
├── opencode/               # OpenCode configuration (built-in one-dark theme)
│   ├── opencode.jsonc
│   └── tui.json
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
- `nvim/lazy-lock.json` checksum must stay unchanged unless `--allow-lockfile-change` is explicitly passed
- isolated startup checks in a throwaway XDG profile
- one-by-one rollout for changed plugin files under `nvim/lua/plugins/*.lua`
- guardrails against known `background`/`OptionSet` loop traps
- high-risk plugin lazy-loading checks (`noice.lua`)

## Backup Your Current Mac

```bash
cd ~/dotfiles

# Backup shell configs and Brewfile
./shell_setup.sh backup

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

## Troubleshooting

**Neovim LSP not working?**
- Requires Neovim >= 0.11.0 for mason-lspconfig v2
- Run `:Mason` to check installed servers
- Run `:LspInfo` to verify attachment

**Treesitter parsers not compiling?**
- Requires `tree-sitter-cli` >= 0.26.1 for nvim-treesitter `main` branch
- Run `:checkhealth nvim-treesitter` to verify CLI is found
- Install via: `npm install -g tree-sitter-cli`

**Markdown files crash Neovim with `CODESIGNING Invalid Page`?**
- Check for stale parser files in `~/.local/share/nvim/site/parser`:
  - `markdown.so.disabled`
  - `markdown_inline.so.disabled`
- Move those files out of parser runtime path (for example to `/tmp`) and retry.
- Confirm active runtime parser paths with:
  - `nvim --noplugin --headless "+lua for _,f in ipairs(vim.api.nvim_get_runtime_file('parser/markdown*', true)) do print(f) end" +qa`

**Seeing `module 'nvim-treesitter.configs' not found`?**
- This usually means old treesitter `master`-style config is mixed with `main`-branch plugin files
- Re-copy your dotfiles Neovim config and rerun setup: `./shell_setup.sh install`
- The setup script runs headless `Lazy! sync` to install/update plugin files

**Powerline symbols not showing?**
- Ensure terminal uses a Nerd Font (JetBrainsMono Nerd Font)
- Restart terminal after font installation

**tmux plugins not loading?**
- First rerun the installer from repo root: `./shell_setup.sh install`
- If you want to force just the tmux plugin step, run `~/.tmux/plugins/tpm/bin/install_plugins`
- If the bar still looks plain, ensure a Nerd Font is enabled in Ghostty and restart the terminal

**Pretty tmux bar not rendering?**
- Kill and restart tmux first so no old server state is cached: `tmux kill-server && tmux`
- Reload config after restart: `tmux source-file ~/.tmux.conf`
- Ensure the theme plugin is actually present: `ls ~/.tmux/plugins/tmux-onedark-theme`
- Ensure the One Dark plugin is configured in `~/.tmux.conf`:
  - `set -g @plugin 'odedlaz/tmux-onedark-theme'`
  - `set -g @onedark_widgets "#{b:pane_current_path}"`
- On tmux 3.x+, keep `set -g status-style "fg=#aab2bf,bg=#282c34"` after TPM init so the unused status background does not stay default green
- Verify theme content is being applied:
  - `tmux show -g status-left`
  - `tmux show -g status-right`
- If symbols are still wrong, re-run plugin install and keep Nerd Font enabled in terminal

**C-h/j/k/l not working between nvim and tmux?**
- Ensure `nvim-tmux-navigation` plugin is installed in Neovim
- Reload tmux config: `tmux source-file ~/.tmux.conf`

**nvm not found?**
- Restart terminal or `source ~/.zshrc`

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

# Add to .zshrc (after oh-my-zsh sourcing)
eval "$(zoxide init zsh)"
```

Currently not using this because `cd` + fzf works well enough, but worth revisiting if directory jumping becomes a bottleneck.
