#!/bin/bash

# Dotfiles Installation Script
# This script creates symlinks from the dotfiles directory to your home directory

set -e

DOTFILES_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo "Installing dotfiles from $DOTFILES_DIR"

# Function to create symlinks
link_file() {
    local src=$1
    local dest=$2

    if [ -L "$dest" ]; then
        echo "Removing existing symlink: $dest"
        rm "$dest"
    elif [ -f "$dest" ] || [ -d "$dest" ]; then
        echo "Backing up existing file: $dest to $dest.backup"
        mv "$dest" "$dest.backup"
    fi

    echo "Linking $src -> $dest"
    ln -sf "$src" "$dest"
}

# Create ~/.config directory if it doesn't exist
mkdir -p ~/.config

# Link shell configuration files
link_file "$DOTFILES_DIR/.zshrc" "$HOME/.zshrc"

# Link git configuration
link_file "$DOTFILES_DIR/git/gitconfig.symlink" "$HOME/.gitconfig"
mkdir -p "$HOME/.config/git"
link_file "$DOTFILES_DIR/git/gitignore_global.symlink" "$HOME/.config/git/ignore"

# Note: tmux, alacritty, and starship configs removed as no longer used

# Link neovim configuration
link_file "$DOTFILES_DIR/nvim" "$HOME/.config/nvim"

# Link karabiner configuration
link_file "$DOTFILES_DIR/karabiner" "$HOME/.config/karabiner"

# Link kitty configuration (fallback terminal) - uncomment if needed
# link_file "$DOTFILES_DIR/kitty" "$HOME/.config/kitty"

# Link Warp terminal configuration
mkdir -p "$HOME/.warp"
link_file "$DOTFILES_DIR/warp/themes" "$HOME/.warp/themes"

# Link Cursor configuration
mkdir -p "$HOME/Library/Application Support/Cursor/User"
link_file "$DOTFILES_DIR/cursor/settings.json" "$HOME/Library/Application Support/Cursor/User/settings.json"
link_file "$DOTFILES_DIR/cursor/keybindings.json" "$HOME/Library/Application Support/Cursor/User/keybindings.json"

# Link Cursor snippets if they exist
if [ -d "$DOTFILES_DIR/cursor/snippets" ]; then
    link_file "$DOTFILES_DIR/cursor/snippets" "$HOME/Library/Application Support/Cursor/User/snippets"
fi

echo "Dotfiles installation complete!"

# Offer to install fonts
echo ""
read -p "🔤 Would you like to install Nerd Fonts for powerline support? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Installing fonts..."
    ./setup_fonts.sh
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "🔧 Additional setup options:"
echo "   • Install development tools: ./install_dev_tools.sh"
echo "   • Install Cursor extensions: ./install_cursor_extensions.sh"
echo "   • Sync current Cursor settings: ./sync_cursor_settings.sh"
echo "   • Export current packages: ./export_brew_packages.sh"
echo ""
echo "💡 Next steps:"
echo "   1. Restart Cursor (for integrated terminal) or Warp"
echo "   2. If you see broken symbols, ensure Nerd Fonts are installed"
echo "   3. Source your zsh configuration: source ~/.zshrc"
echo "   4. In Warp: Nord theme should be available in Settings > Appearance"
echo "   5. Oh My Zsh agnoster theme should display powerline symbols correctly"
echo "   6. Verify fonts with: ./verify_fonts.sh"
