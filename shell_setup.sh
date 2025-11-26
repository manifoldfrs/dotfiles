#!/bin/bash

# Shell Setup Script
# Handles: Homebrew, Brewfile, zsh, oh-my-zsh, Warp, fzf, pyenv, rbenv, nvm
# Usage: ./shell_setup.sh [backup|install]

set -e

DOTFILES_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

link_file() {
    local src=$1
    local dest=$2
    if [ -L "$dest" ]; then
        rm "$dest"
    elif [ -f "$dest" ] || [ -d "$dest" ]; then
        mv "$dest" "$dest.backup.$(date +%Y%m%d%H%M%S)"
        warn "Backed up existing: $dest"
    fi
    ln -sf "$src" "$dest"
    info "Linked: $src -> $dest"
}

backup() {
    info "Backing up shell configuration..."

    # Export Brewfile
    if command -v brew &> /dev/null; then
        info "Exporting Homebrew packages to Brewfile..."
        brew bundle dump --file="$DOTFILES_DIR/Brewfile" --force
        info "Brewfile updated"
    else
        warn "Homebrew not installed, skipping Brewfile export"
    fi

    # Copy .zshrc from home
    if [ -f "$HOME/.zshrc" ]; then
        info "Copying .zshrc..."
        cp "$HOME/.zshrc" "$DOTFILES_DIR/.zshrc"
    fi

    # Copy .zprofile if exists
    if [ -f "$HOME/.zprofile" ]; then
        info "Copying .zprofile..."
        cp "$HOME/.zprofile" "$DOTFILES_DIR/.zprofile"
    fi

    # Copy .zshenv if exists
    if [ -f "$HOME/.zshenv" ]; then
        info "Copying .zshenv..."
        cp "$HOME/.zshenv" "$DOTFILES_DIR/.zshenv"
    fi

    # Copy Warp themes
    if [ -d "$HOME/.warp/themes" ]; then
        info "Copying Warp themes..."
        mkdir -p "$DOTFILES_DIR/warp"
        cp -r "$HOME/.warp/themes" "$DOTFILES_DIR/warp/"
    fi

    info "Backup complete!"
    echo ""
    echo "Files updated:"
    echo "  - Brewfile"
    echo "  - .zshrc"
    [ -f "$DOTFILES_DIR/.zprofile" ] && echo "  - .zprofile"
    [ -f "$DOTFILES_DIR/.zshenv" ] && echo "  - .zshenv"
    [ -d "$DOTFILES_DIR/warp/themes" ] && echo "  - warp/themes/"
}

install() {
    info "Installing shell environment..."

    # Install Homebrew
    if ! command -v brew &> /dev/null; then
        info "Installing Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        
        # Add brew to PATH for Apple Silicon
        if [ -f /opt/homebrew/bin/brew ]; then
            eval "$(/opt/homebrew/bin/brew shellenv)"
        fi
    else
        info "Homebrew already installed"
    fi

    # Install packages from Brewfile
    if [ -f "$DOTFILES_DIR/Brewfile" ]; then
        info "Installing packages from Brewfile..."
        brew bundle install --file="$DOTFILES_DIR/Brewfile"
    else
        warn "No Brewfile found, skipping package installation"
    fi

    # Install Oh My Zsh
    if [ ! -d "$HOME/.oh-my-zsh" ]; then
        info "Installing Oh My Zsh..."
        sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended
    else
        info "Oh My Zsh already installed"
    fi

    # Install zsh-syntax-highlighting plugin
    ZSH_CUSTOM="${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}"
    if [ ! -d "$ZSH_CUSTOM/plugins/zsh-syntax-highlighting" ]; then
        info "Installing zsh-syntax-highlighting plugin..."
        git clone https://github.com/zsh-users/zsh-syntax-highlighting.git "$ZSH_CUSTOM/plugins/zsh-syntax-highlighting"
    else
        info "zsh-syntax-highlighting already installed"
    fi

    # Symlink shell configs
    info "Linking shell configuration files..."
    link_file "$DOTFILES_DIR/.zshrc" "$HOME/.zshrc"
    
    [ -f "$DOTFILES_DIR/.zprofile" ] && link_file "$DOTFILES_DIR/.zprofile" "$HOME/.zprofile"
    [ -f "$DOTFILES_DIR/.zshenv" ] && link_file "$DOTFILES_DIR/.zshenv" "$HOME/.zshenv"

    # Link git config
    if [ -f "$DOTFILES_DIR/.gitconfig" ]; then
        link_file "$DOTFILES_DIR/.gitconfig" "$HOME/.gitconfig"
    elif [ -f "$DOTFILES_DIR/git/gitconfig.symlink" ]; then
        link_file "$DOTFILES_DIR/git/gitconfig.symlink" "$HOME/.gitconfig"
    fi

    # Link Warp themes
    if [ -d "$DOTFILES_DIR/warp/themes" ]; then
        info "Linking Warp themes..."
        mkdir -p "$HOME/.warp"
        link_file "$DOTFILES_DIR/warp/themes" "$HOME/.warp/themes"
    fi

    # Setup fzf
    if command -v fzf &> /dev/null; then
        info "Setting up fzf keybindings..."
        if [ -f /opt/homebrew/opt/fzf/install ]; then
            /opt/homebrew/opt/fzf/install --key-bindings --completion --no-update-rc --no-bash --no-fish
        fi
    fi

    # Setup pyenv
    if command -v pyenv &> /dev/null; then
        info "Pyenv detected - initialize with: eval \"\$(pyenv init -)\""
    fi

    # Setup rbenv
    if command -v rbenv &> /dev/null; then
        info "Rbenv detected - initialize with: eval \"\$(rbenv init -)\""
    fi

    # Install nvm if not present
    if [ ! -d "$HOME/.nvm" ]; then
        info "Installing nvm..."
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    else
        info "nvm already installed"
    fi

    echo ""
    info "Shell setup complete!"
    echo ""
    echo "Next steps:"
    echo "  1. Restart your terminal or run: source ~/.zshrc"
    echo "  2. Warp: Settings Sync available in Settings > Account"
    echo "  3. Install Python: pyenv install 3.12 && pyenv global 3.12"
    echo "  4. Install Node: nvm install --lts"
}

usage() {
    echo "Usage: $0 [backup|install]"
    echo ""
    echo "Commands:"
    echo "  backup   Export current Brewfile and copy shell configs to dotfiles"
    echo "  install  Install Homebrew, packages, oh-my-zsh, and link configs"
    exit 1
}

case "${1:-}" in
    backup)
        backup
        ;;
    install)
        install
        ;;
    *)
        usage
        ;;
esac
