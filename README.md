# dotfiles

Configuration files for zsh, Homebrew, Warp terminal, and Cursor IDE.

[![Test Dotfiles](https://github.com/manifoldfrs/dotfiles/actions/workflows/test.yml/badge.svg)](https://github.com/manifoldfrs/dotfiles/actions/workflows/test.yml)

## Quick Start (New Mac)

```bash
# 1. Clone the repo
git clone https://github.com/manifoldfrs/dotfiles.git ~/dotfiles

# 2. Run shell setup
cd ~/dotfiles
./shell_setup.sh install

# 3. Restart your terminal (quit and reopen)

# 4. Install Node.js
nvm install --lts

# 5. (Optional) Set up Cursor IDE
./cursor_setup.sh install
```

## What Gets Installed

### Shell Setup (`shell_setup.sh install`)

- **Homebrew** + all packages from `Brewfile`
- **Oh My Zsh** with `agnoster` theme
- **zsh-syntax-highlighting** plugin
- **nvm** (Node Version Manager) via HTTPS
- **Nerd Fonts**: JetBrainsMono, Meslo LG
- **Config files**: `.zshrc`, `.zprofile`, `.gitconfig`, `starship.toml`

### Cursor Setup (`cursor_setup.sh install`)

- `settings.json` and `keybindings.json`
- All extensions from `cursor/extensions.txt`
- Code snippets

## Configure Warp Terminal Font

After installation, manually set the font in Warp:

1. Open Warp
2. Go to **Settings → Appearance → Text**
3. Set **Font** to `JetBrainsMono Nerd Font` or `MesloLGS NF`

## Backup Your Current Mac

Before migrating, back up your existing configs:

```bash
cd ~/dotfiles

# Backup shell configs and Brewfile
./shell_setup.sh backup

# Backup Cursor settings and extensions
./cursor_setup.sh backup

# Commit and push
git add -A
git commit -m "Backup from old Mac"
git push
```

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
├── shell_setup.sh      # Main shell/brew/zsh installer
├── cursor_setup.sh     # Cursor IDE settings installer
├── Brewfile            # Homebrew packages
├── .zshrc              # Zsh configuration
├── .zprofile           # Zsh profile
├── .gitconfig          # Git configuration
├── starship.toml       # Starship prompt config
├── cursor/             # Cursor IDE settings
│   ├── settings.json
│   ├── keybindings.json
│   ├── extensions.txt
│   └── snippets/
├── test/               # Test suite
│   ├── Dockerfile
│   ├── run_tests.sh
│   └── docker_test.sh
└── old/                # Legacy scripts (archived)
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
