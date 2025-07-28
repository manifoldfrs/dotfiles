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
link_file "$DOTFILES_DIR/.bashrc" "$HOME/.bashrc"
link_file "$DOTFILES_DIR/.bash_profile" "$HOME/.bash_profile"

# Link git configuration
link_file "$DOTFILES_DIR/.gitconfig" "$HOME/.gitconfig"

# Link tmux configuration
link_file "$DOTFILES_DIR/.tmux.conf" "$HOME/.tmux.conf"

# Link alacritty configuration
link_file "$DOTFILES_DIR/alacritty.yml" "$HOME/.config/alacritty.yml"

# Link starship configuration
link_file "$DOTFILES_DIR/starship.toml" "$HOME/.config/starship.toml"

# Link neovim configuration
link_file "$DOTFILES_DIR/nvim" "$HOME/.config/nvim"

# Link karabiner configuration
link_file "$DOTFILES_DIR/karabiner" "$HOME/.config/karabiner"

# Link kitty configuration
link_file "$DOTFILES_DIR/kitty" "$HOME/.config/kitty"

echo "Dotfiles installation complete!"
echo "You may need to restart your terminal or source your shell configuration files."
