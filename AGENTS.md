# AGENTS.md

> Guidance for AI coding agents working with this dotfiles repository.

## Project Snapshot

- **Type**: Personal dotfiles (macOS-focused configuration files)
- **Stack**: Shell scripts (bash), Lua (Neovim), JSON/YAML configs
- **Theme**: Nord + JetBrainsMono Nerd Font across all tools
- **Sub-configs**: See [nvim/AGENTS.md](nvim/AGENTS.md), [mcp/AGENTS.md](mcp/AGENTS.md)

## Setup Commands

```bash
# Full installation (new Mac)
./shell_setup.sh install

# Backup current configs
./shell_setup.sh backup

# Cursor IDE setup
./cursor_setup.sh install

# MCP configs for AI tools
./mcp_setup.sh install

# Run tests
./test/docker_test.sh
```

## Universal Conventions

### Script Pattern
All setup scripts follow: `./script.sh [backup|install]`
- `backup`: Export current system configs to this repo
- `install`: Copy repo configs to system locations

### File Locations After Install
| Config | System Location |
|--------|-----------------|
| `.zshrc` | `~/.zshrc` |
| `nvim/` | `~/.config/nvim/` |
| `ghostty/config` | `~/.config/ghostty/config` |
| `tmux/tmux.conf` | `~/.tmux.conf` |
| `karabiner/` | `~/.config/karabiner/` |

### Commit Style
- Descriptive commits: `update nvim lsp config`, `add ghostty keybindings`
- No conventional commit prefixes required

## Security & Secrets

- **NEVER commit API keys** - Use `.example` files as templates
- Secrets locations: `mcp/*.json` (gitignored), `~/.ssh/`
- See `mcp/README.md` for API key setup

## JIT Index

### Directory Map
```
dotfiles/
├── shell_setup.sh      # Main installer (Homebrew, zsh, nvm, configs)
├── cursor_setup.sh     # Cursor IDE settings/extensions
├── mcp_setup.sh        # MCP configs for AI tools
├── Brewfile            # Homebrew packages
├── .zshrc              # Zsh config (agnoster theme)
├── nvim/               # Neovim config → [nvim/AGENTS.md](nvim/AGENTS.md)
├── cursor/             # Cursor IDE JSON configs
├── mcp/                # MCP server configs → [mcp/AGENTS.md](mcp/AGENTS.md)
├── karabiner/          # Keyboard remapping (Caps→Ctrl)
├── ghostty/            # Ghostty terminal config
├── tmux/               # tmux config (C-a prefix)
├── git/                # Git config (.gitconfig)
├── warp/               # Warp terminal themes
├── test/               # Docker-based tests
└── old/                # Legacy/archived configs
```

### Quick Find Commands
```bash
# Find a config file
find . -name "*.json" -o -name "*.lua" -o -name "*.yaml" | grep -v old/

# Search shell scripts
grep -rn "PATTERN" *.sh

# Find Neovim plugin config
grep -rn "PATTERN" nvim/lua/user/plugins/

# Check what gets installed
grep -A5 "install()" shell_setup.sh
```

## Definition of Done

Before committing changes:
- [ ] Script syntax valid: `bash -n script.sh`
- [ ] No secrets in committed files
- [ ] Test locally if modifying setup scripts: `./test/docker_test.sh`

## Key Examples

| Task | Reference File |
|------|----------------|
| Add Homebrew package | `Brewfile` |
| Add zsh plugin | `.zshrc` (plugins array) |
| Add Neovim plugin | `nvim/lua/user/plugins/*.lua` |
| Add Cursor keybinding | `cursor/keybindings.json` |
| Add MCP server | `mcp/*.example` files |
