# dotfiles

Configuration files for terminal, shell, and development tools.

## What's Included

- **Shell Configuration**: `.zshrc`, `.bashrc`, `.bash_profile`
- **Git Configuration**: `.gitconfig`
- **Terminal Multiplexer**: `.tmux.conf`
- **Terminal Emulators**:
  - Alacritty (`alacritty.yml`)
  - Kitty (`kitty/`)
- **Editor**: Neovim configuration (`nvim/`)
- **Keyboard Customization**: Karabiner-Elements (`karabiner/`)
- **Shell Prompt**: Starship (`starship.toml`)
- **Fonts**: Nerd Fonts for powerline symbols (`setup_fonts.sh`)

## Installation

1. Clone this repository:

   ```bash
   git clone <repository-url> ~/dotfiles
   cd ~/dotfiles
   ```

2. Run the installation script:
   ```bash
   ./install.sh
   ```

This will create symlinks from your home directory to the dotfiles in this repository. Existing files will be backed up with a `.backup` extension.

The installer will also offer to install Nerd Fonts for proper powerline symbol display.

## Manual Sync

To sync your current configurations to this repository:

```bash
# Copy current configs to dotfiles directory
cp ~/.zshrc .
cp ~/.bashrc .
cp ~/.bash_profile .
cp ~/.gitconfig .
cp ~/.tmux.conf .
cp ~/.config/alacritty/alacritty.yml .
cp ~/.config/starship.toml .
cp -r ~/.config/nvim .
cp -r ~/.config/karabiner .
cp -r ~/.config/kitty .
```

## Usage

After installation, restart your terminal or source the configuration files:

```bash
source ~/.zshrc
```

## Font Setup

To get powerline symbols working properly, you need Nerd Fonts installed:

```bash
# Install fonts separately
./setup_fonts.sh

# Or install specific fonts manually
brew install --cask font-jetbrains-mono-nerd-font
brew install --cask font-meslo-lg-nerd-font
brew install --cask font-fira-code-nerd-font
```

**Configure your terminal:**

- **Alacritty**: Already configured to use `JetBrainsMonoNL Nerd Font`
- **iTerm2**: Preferences → Profiles → Text → Font → Search for "Nerd Font"
- **Terminal.app**: Preferences → Profiles → Font → Select a Nerd Font

## Troubleshooting

**Broken powerline symbols?**

- Ensure your terminal is using a Nerd Font
- Restart your terminal after font installation
- Check that the font name matches exactly in your terminal settings
