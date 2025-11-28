# dotfiles

Configuration files for zsh, Homebrew, Warp terminal, and Cursor IDE.

[![Test Dotfiles](https://github.com/manifoldfrs/dotfiles/actions/workflows/test.yml/badge.svg)](https://github.com/manifoldfrs/dotfiles/actions/workflows/test.yml)

## Quick Start (New Mac)

```bash
# 1. Clone the repo
git clone https://github.com/manifoldfrs/dotfiles.git ~/dotfiles

# 2. Run shell setup (installs Homebrew, oh-my-zsh, nvm, Droid CLI, etc.)
cd ~/dotfiles
./shell_setup.sh install

# 3. Restart your terminal (quit and reopen)

# 4. Install Node.js
nvm install --lts

# 5. Install global npm packages (claude-code, codex, vercel)
grep -v '^#' ~/dotfiles/npm-global-packages.txt | grep -v '^$' | xargs npm install -g

# 6. (Optional) Set up Cursor IDE
./cursor_setup.sh install

# 7. (Optional) Set up MCP configs for AI tools
./mcp_setup.sh install
```

## What Gets Installed

### Shell Setup (`shell_setup.sh install`)

- **Homebrew** + all packages from `Brewfile`
- **Oh My Zsh** with `agnoster` theme
- **zsh-syntax-highlighting** plugin
- **nvm** (Node Version Manager) via HTTPS
- **Droid CLI** (Factory AI)
- **Nerd Fonts**: JetBrainsMono, Meslo LG
- **Config files**: `.zshrc`, `.zprofile`, `.zshenv`, `.gitconfig`, `starship.toml`

### npm Global Packages (`npm-global-packages.txt`)

- `@anthropic-ai/claude-code` - Claude Code CLI
- `@openai/codex` - OpenAI Codex CLI
- `vercel` - Vercel CLI

### Cursor Setup (`cursor_setup.sh install`)

- `settings.json` and `keybindings.json`
- All extensions from `cursor/extensions.txt`
- Code snippets

### MCP Setup (`mcp_setup.sh install`)

MCP (Model Context Protocol) configs for AI coding assistants:
- **Claude Desktop**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Cursor**: `~/.cursor/mcp.json`
- **Codex**: `~/.codex/config.toml`
- **Droid/Factory**: `~/.factory/mcp.json`

See `mcp/README.md` for setup instructions and API key configuration.

### Karabiner Elements (Keyboard Remapping)

Karabiner Elements is installed via Brewfile. To restore your keyboard settings:

```bash
# Copy config to Karabiner directory
mkdir -p ~/.config/karabiner
cp ~/dotfiles/karabiner/karabiner.json ~/.config/karabiner/
cp -r ~/dotfiles/karabiner/assets ~/.config/karabiner/
```

Current keybindings:
- **Caps Lock → Control** (system-level remap)
- **Tab + hjkl → Arrow keys** (vim-style navigation)
- **Fn + Tab → Toggle Caps Lock**

To backup your Karabiner config:
```bash
cp ~/.config/karabiner/karabiner.json ~/dotfiles/karabiner/
cp -r ~/.config/karabiner/assets ~/dotfiles/karabiner/
```

## Configure Warp Terminal Font

After installation, manually set the font in Warp:

1. Open Warp
2. Go to **Settings → Appearance → Text**
3. Set **Font** to `JetBrainsMono Nerd Font` or `MesloLGS NF`

## Backup Your Current Mac

Before migrating, back up your existing configs:

```bash
cd ~/dotfiles

# Backup shell configs, Brewfile, and npm packages
./shell_setup.sh backup

# Backup Cursor settings and extensions
./cursor_setup.sh backup

# Backup MCP configs (Claude, Cursor, Codex, Droid)
./mcp_setup.sh backup

# Commit and push
git add -A
git commit -m "Backup from old Mac"
git push
```

This exports:
- `Brewfile` - Homebrew packages
- `npm-global-packages.txt` - Global npm packages
- `.zshrc`, `.zprofile`, `.zshenv` - Shell configs
- `warp/themes/` - Warp terminal themes
- `mcp/` - MCP configs for AI tools (gitignored, contains API keys)

## Post-Install: Set Up SSH Keys

After the initial setup, configure SSH for GitHub:

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your-email@example.com"

# Start ssh-agent and add key
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Copy public key to clipboard
pbcopy < ~/.ssh/id_ed25519.pub

# Add to GitHub: https://github.com/settings/keys
```

Then uncomment the SSH config in `~/.gitconfig`:

```ini
[core]
    sshCommand = ssh -i ~/.ssh/id_ed25519
[url "git@github.com:"]
    insteadOf = https://github.com/
```

## Testing

Run tests locally before deploying:

```bash
# Docker tests (Linux)
./test/docker_test.sh

# Or run on GitHub Actions (macOS + Docker)
# Push to master and check: https://github.com/manifoldfrs/dotfiles/actions
```

## File Structure

```
dotfiles/
├── shell_setup.sh          # Main shell/brew/zsh installer
├── cursor_setup.sh         # Cursor IDE settings installer
├── Brewfile                # Homebrew packages
├── npm-global-packages.txt # Global npm packages (claude-code, codex, etc.)
├── install-tools.txt       # Documentation for curl-installed tools
├── .zshrc                  # Zsh configuration
├── .zprofile               # Zsh profile
├── .zshenv                 # Zsh environment (cargo, etc.)
├── .gitconfig              # Git configuration
├── starship.toml           # Starship prompt config
├── cursor/                 # Cursor IDE settings
│   ├── settings.json
│   ├── keybindings.json
│   ├── extensions.txt
│   └── snippets/
├── karabiner/              # Karabiner Elements keyboard remapping
│   ├── karabiner.json
│   └── assets/
├── mcp/                    # MCP configs for AI tools
│   ├── *.example           # Template configs (committed)
│   ├── *.json/toml         # Actual configs (gitignored)
│   └── README.md
├── mcp_setup.sh            # MCP config backup/install
├── test/                   # Test suite
│   ├── Dockerfile
│   ├── run_tests.sh
│   └── docker_test.sh
└── old/                    # Legacy scripts (archived)
```

## Troubleshooting

**Powerline symbols not showing?**
- Ensure Warp/terminal is using a Nerd Font
- Restart terminal after font installation

**nvm not found after install?**
- Restart your terminal or run `source ~/.zshrc`

**Homebrew packages failing?**
- Run `brew doctor` to diagnose
- Some casks may need manual installation

**Git clone fails with SSH error?**
- You're on a fresh Mac without SSH keys
- Use HTTPS clone: `git clone https://github.com/...`
