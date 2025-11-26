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

copy_file() {
    local src=$1
    local dest=$2
    if [ -f "$dest" ] || [ -d "$dest" ]; then
        mv "$dest" "$dest.backup.$(date +%Y%m%d%H%M%S)"
        warn "Backed up existing: $dest"
    fi
    cp -r "$src" "$dest"
    info "Copied: $src -> $dest"
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

    # Export global npm packages
    if command -v npm &> /dev/null; then
        info "Exporting global npm packages..."
        echo "# Global npm packages to install" > "$DOTFILES_DIR/npm-global-packages.txt"
        echo "# Format: package-name (without version to get latest)" >> "$DOTFILES_DIR/npm-global-packages.txt"
        echo "# Run: grep -v '^#' npm-global-packages.txt | grep -v '^\$' | xargs npm install -g" >> "$DOTFILES_DIR/npm-global-packages.txt"
        echo "" >> "$DOTFILES_DIR/npm-global-packages.txt"
        npm list -g --depth=0 2>/dev/null | tail -n +2 | awk '{print $2}' | cut -d'@' -f1 | grep -v "^npm$\|^corepack$\|^$" >> "$DOTFILES_DIR/npm-global-packages.txt"
        info "npm-global-packages.txt updated"
    else
        warn "npm not installed, skipping npm packages export"
    fi

    info "Backup complete!"
    echo ""
    echo "Files updated:"
    echo "  - Brewfile"
    echo "  - .zshrc"
    [ -f "$DOTFILES_DIR/.zprofile" ] && echo "  - .zprofile"
    [ -f "$DOTFILES_DIR/.zshenv" ] && echo "  - .zshenv"
    [ -d "$DOTFILES_DIR/warp/themes" ] && echo "  - warp/themes/"
    [ -f "$DOTFILES_DIR/npm-global-packages.txt" ] && echo "  - npm-global-packages.txt"
}

install() {
    info "Installing shell environment..."

    # 1. Install Homebrew
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

    # 2. Install packages from Brewfile
    if [ -f "$DOTFILES_DIR/Brewfile" ]; then
        info "Installing packages from Brewfile..."
        brew bundle install --file="$DOTFILES_DIR/Brewfile" || warn "Some Brewfile packages failed to install"
    else
        warn "No Brewfile found, skipping package installation"
    fi

    # 3. Install Nerd Fonts explicitly (required for powerline/agnoster theme)
    info "Installing Nerd Fonts for powerline symbols..."
    brew install --cask font-jetbrains-mono-nerd-font || warn "JetBrains Mono Nerd Font may already be installed"
    brew install --cask font-meslo-lg-nerd-font || warn "Meslo Nerd Font may already be installed"

    # 4. Install Oh My Zsh (with --keep-zshrc to preserve our config)
    if [ ! -d "$HOME/.oh-my-zsh" ]; then
        info "Installing Oh My Zsh..."
        sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended --keep-zshrc
    else
        info "Oh My Zsh already installed"
    fi

    # 5. Install zsh-syntax-highlighting plugin
    ZSH_CUSTOM="${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}"
    if [ ! -d "$ZSH_CUSTOM/plugins/zsh-syntax-highlighting" ]; then
        info "Installing zsh-syntax-highlighting plugin..."
        git clone https://github.com/zsh-users/zsh-syntax-highlighting.git "$ZSH_CUSTOM/plugins/zsh-syntax-highlighting"
    else
        info "zsh-syntax-highlighting already installed"
    fi

    # 6. COPY shell configs (not symlink - creates independent files)
    info "Copying shell configuration files..."
    copy_file "$DOTFILES_DIR/.zshrc" "$HOME/.zshrc"
    
    [ -f "$DOTFILES_DIR/.zprofile" ] && copy_file "$DOTFILES_DIR/.zprofile" "$HOME/.zprofile"
    [ -f "$DOTFILES_DIR/.zshenv" ] && copy_file "$DOTFILES_DIR/.zshenv" "$HOME/.zshenv"

    # 7. Copy git config
    if [ -f "$DOTFILES_DIR/.gitconfig" ]; then
        copy_file "$DOTFILES_DIR/.gitconfig" "$HOME/.gitconfig"
    elif [ -f "$DOTFILES_DIR/git/gitconfig.symlink" ]; then
        copy_file "$DOTFILES_DIR/git/gitconfig.symlink" "$HOME/.gitconfig"
    fi

    # 8. Copy Warp themes
    if [ -d "$DOTFILES_DIR/warp/themes" ]; then
        info "Copying Warp themes..."
        mkdir -p "$HOME/.warp"
        cp -r "$DOTFILES_DIR/warp/themes" "$HOME/.warp/"
        info "Warp themes copied to ~/.warp/themes"
    fi

    # 9. Setup fzf keybindings
    if command -v fzf &> /dev/null; then
        info "Setting up fzf keybindings..."
        if [ -f /opt/homebrew/opt/fzf/install ]; then
            /opt/homebrew/opt/fzf/install --key-bindings --completion --no-update-rc --no-bash --no-fish
        fi
    fi

    # 10. Install nvm if not present (using direct HTTPS clone to avoid SSH issues)
    if [ ! -d "$HOME/.nvm" ]; then
        info "Installing nvm..."
        export NVM_DIR="$HOME/.nvm"
        mkdir -p "$NVM_DIR"
        git clone https://github.com/nvm-sh/nvm.git "$NVM_DIR"
        cd "$NVM_DIR"
        git checkout $(git describe --abbrev=0 --tags --match "v[0-9]*" $(git rev-list --tags --max-count=1))
        cd "$DOTFILES_DIR"
        info "nvm installed - run 'nvm install --lts' after restarting terminal"
    else
        info "nvm already installed"
    fi

    # 11. Install global npm packages (after nvm is set up)
    if [ -f "$DOTFILES_DIR/npm-global-packages.txt" ]; then
        info "To install global npm packages after setting up Node, run:"
        echo "  nvm install --lts"
        echo "  grep -v '^#' ~/dotfiles/npm-global-packages.txt | grep -v '^$' | xargs npm install -g"
    fi

    # 12. Install Droid CLI
    if ! command -v droid &> /dev/null; then
        info "Installing Droid CLI..."
        curl -fsSL https://app.factory.ai/install.sh | bash || warn "Droid installation failed - install manually"
    else
        info "Droid already installed"
    fi

    echo ""
    info "Shell setup complete!"
    echo ""
    echo "=========================================="
    echo "IMPORTANT - Configure Warp font manually:"
    echo "=========================================="
    echo "  1. Open Warp"
    echo "  2. Go to: Settings > Appearance > Text"
    echo "  3. Set Font to: JetBrainsMono Nerd Font"
    echo "  4. Restart Warp"
    echo ""
    echo "Then restart your terminal or run: source ~/.zshrc"
    echo ""
    echo "Next steps:"
    echo "  1. Install Node: nvm install --lts"
    echo "  2. Install npm packages: grep -v '^#' ~/dotfiles/npm-global-packages.txt | grep -v '^$' | xargs npm install -g"
    echo "  3. Install Python: pyenv install 3.12 && pyenv global 3.12"
}

usage() {
    echo "Usage: $0 [backup|install]"
    echo ""
    echo "Commands:"
    echo "  backup   Export current Brewfile and copy shell configs to dotfiles"
    echo "  install  Install Homebrew, packages, oh-my-zsh, and COPY configs to home"
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
