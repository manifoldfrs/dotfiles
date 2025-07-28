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
