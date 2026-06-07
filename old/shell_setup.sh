#!/bin/bash

# Shell Setup Script
# Handles: Homebrew, Brewfile, zsh, oh-my-zsh, GNU Stow, fzf, pyenv, rbenv, nvm, Amp
# Usage: ./shell_setup.sh [backup|install]

set -e

DOTFILES_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
STOW_DIR="$DOTFILES_DIR/stow"
STOW_PACKAGES=(zsh git ghostty tmux nvim bin)

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

backup_stow_target() {
    local target=$1
    local link_dest

    if [ ! -e "$target" ] && [ ! -L "$target" ]; then
        return
    fi

    if [ -L "$target" ]; then
        link_dest="$(readlink "$target")"
        case "$link_dest" in
            *dotfiles/stow/*|*"$DOTFILES_DIR/stow"*)
                return
                ;;
        esac
    fi

    mv "$target" "$target.backup.$(date +%Y%m%d%H%M%S)"
    warn "Backed up existing before stow: $target"
}

stow_dotfiles() {
    if ! command -v stow &> /dev/null; then
        error "GNU Stow is required. Install it with: brew install stow"
    fi

    if [ ! -d "$STOW_DIR" ]; then
        error "Stow directory not found: $STOW_DIR"
    fi

    mkdir -p "$HOME/.config/ghostty" "$HOME/.local/bin"

    backup_stow_target "$HOME/.zshrc"
    backup_stow_target "$HOME/.zprofile"
    backup_stow_target "$HOME/.zshenv"
    backup_stow_target "$HOME/.gitconfig"
    backup_stow_target "$HOME/.gitignore_global"
    backup_stow_target "$HOME/.config/ghostty/config"
    backup_stow_target "$HOME/.tmux.conf"
    backup_stow_target "$HOME/.config/nvim"
    backup_stow_target "$HOME/.local/bin/tmux-sessionizer"

    info "Stowing dotfiles into $HOME..."
    stow -R -v -t "$HOME" -d "$STOW_DIR" "${STOW_PACKAGES[@]}"
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
        cp -L "$HOME/.zshrc" "$STOW_DIR/zsh/.zshrc"
    fi

    # Copy .zprofile if exists
    if [ -f "$HOME/.zprofile" ]; then
        info "Copying .zprofile..."
        cp -L "$HOME/.zprofile" "$STOW_DIR/zsh/.zprofile"
    fi

    # Copy .zshenv if exists
    if [ -f "$HOME/.zshenv" ]; then
        info "Copying .zshenv..."
        cp -L "$HOME/.zshenv" "$STOW_DIR/zsh/.zshenv"
    fi

    if [ -f "$HOME/.gitconfig" ]; then
        info "Copying .gitconfig..."
        cp -L "$HOME/.gitconfig" "$STOW_DIR/git/.gitconfig"
    fi

    # Copy tmux config
    if [ -f "$HOME/.tmux.conf" ]; then
        info "Copying tmux config..."
        mkdir -p "$STOW_DIR/tmux"
        cp -L "$HOME/.tmux.conf" "$STOW_DIR/tmux/.tmux.conf"
    fi

    # Copy tmux-sessionizer script
    if [ -f "$HOME/.local/bin/tmux-sessionizer" ]; then
        info "Copying tmux-sessionizer script..."
        mkdir -p "$STOW_DIR/bin/.local/bin"
        cp -L "$HOME/.local/bin/tmux-sessionizer" "$STOW_DIR/bin/.local/bin/tmux-sessionizer"
    fi

    if [ -f "$HOME/.config/ghostty/config" ]; then
        info "Copying Ghostty config..."
        mkdir -p "$STOW_DIR/ghostty/.config/ghostty"
        cp -L "$HOME/.config/ghostty/config" "$STOW_DIR/ghostty/.config/ghostty/config"
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
    echo "  - stow/zsh/.zshrc"
    [ -f "$STOW_DIR/zsh/.zprofile" ] && echo "  - stow/zsh/.zprofile"
    [ -f "$STOW_DIR/zsh/.zshenv" ] && echo "  - stow/zsh/.zshenv"
    [ -f "$STOW_DIR/git/.gitconfig" ] && echo "  - stow/git/.gitconfig"
    [ -f "$STOW_DIR/tmux/.tmux.conf" ] && echo "  - stow/tmux/.tmux.conf"
    [ -f "$STOW_DIR/bin/.local/bin/tmux-sessionizer" ] && echo "  - stow/bin/.local/bin/tmux-sessionizer"
    [ -f "$STOW_DIR/ghostty/.config/ghostty/config" ] && echo "  - stow/ghostty/.config/ghostty/config"
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

    # 3. Install Nerd Fonts explicitly (required for powerline symbols)
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

    # 6. Symlink managed config files with GNU Stow
    stow_dotfiles

    if [ ! -d "$HOME/.tmux/plugins/tpm" ]; then
        info "Installing tmux plugin manager (TPM)..."
        git clone https://github.com/tmux-plugins/tpm "$HOME/.tmux/plugins/tpm" || warn "TPM installation failed - install manually"
    else
        info "TPM already installed"
    fi

    if [ -x "$HOME/.tmux/plugins/tpm/bin/install_plugins" ]; then
        info "Installing tmux plugins..."
        "$HOME/.tmux/plugins/tpm/bin/install_plugins" || warn "tmux plugin installation failed - run manually"
    else
        warn "TPM install script not found - run tmux plugin installation manually"
    fi

    # Install Neovim plugins via lazy.nvim (headless)
    if command -v nvim &> /dev/null; then
        info "Installing Neovim plugins (Lazy sync)..."
        nvim --headless -c "Lazy! sync" -c "qa" 2>&1 | tail -20 || warn "Lazy sync may have encountered issues"
    else
        warn "Neovim not found, skipping plugin installation"
    fi

    # Setup fzf keybindings
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
    else
        info "nvm already installed"
    fi

    # 11. Source nvm and ensure Node.js LTS is installed
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

    if ! command -v node &> /dev/null; then
        info "Installing Node.js LTS via nvm..."
        nvm install --lts
        nvm use --lts
    else
        info "Node.js already installed: $(node --version)"
    fi

    # 12. Install global npm packages
    if [ -f "$DOTFILES_DIR/npm-global-packages.txt" ]; then
        info "Installing global npm packages..."
        grep -v '^#' "$DOTFILES_DIR/npm-global-packages.txt" | grep -v '^$' | while read -r package; do
            if ! npm list -g "$package" &> /dev/null; then
                info "Installing $package..."
                npm install -g "$package" || warn "Failed to install $package"
            else
                info "$package already installed"
            fi
        done
    fi

    # 13. Install Amp CLI
    if ! command -v amp &> /dev/null; then
        info "Installing Amp CLI..."
        curl -fsSL https://ampcode.com/install.sh | bash || warn "Amp CLI installation failed"
    else
        info "Amp CLI already installed: $(amp --version)"
    fi

    echo ""
    info "Shell setup complete!"
    echo ""
    echo "=========================================="
    echo "Amp CLI"
    echo "=========================================="
    echo "  Installed to: ~/.local/bin/amp (or via npm if preferred)"
    echo "  Sign in on first run: amp"
    echo ""
    echo "Ghostty"
    echo "=========================================="
    echo "  Config stowed to: ~/.config/ghostty/config"
    echo "  Font: JetBrainsMono Nerd Font (installed via Brewfile)"
    echo ""
    echo "tmux"
    echo "=========================================="
    echo "  Config stowed to: ~/.tmux.conf"
    echo "  TPM: ~/.tmux/plugins/tpm"
    echo "  Plugins: installed automatically when TPM is available"
    echo ""
    echo "Neovim"
    echo "=========================================="
    echo "  Config stowed to: ~/.config/nvim"
    echo ""
    echo "Then restart your terminal or run: source ~/.zshrc"
    echo ""
    echo "Next steps:"
    echo "  1. Install Python: pyenv install 3.12 && pyenv global 3.12"
}

usage() {
    echo "Usage: $0 [backup|install]"
    echo ""
    echo "Commands:"
    echo "  backup   Export current Brewfile and copy shell configs to stow packages"
    echo "  install  Install Homebrew, packages, oh-my-zsh, and stow configs to home"
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
