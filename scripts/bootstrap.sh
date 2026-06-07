#!/bin/bash

# Bootstrap non-Stow machine setup, then apply managed dotfiles.
# Usage: ./scripts/bootstrap.sh

set -e

DOTFILES_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
STOW_TARGETS=(
    "$HOME/.zshrc"
    "$HOME/.zprofile"
    "$HOME/.zshenv"
    "$HOME/.gitconfig"
    "$HOME/.gitignore_global"
    "$HOME/.config/ghostty/config"
    "$HOME/.config/opencode/opencode.json"
    "$HOME/.config/opencode/tui.json"
    "$HOME/.claude/settings.local.json"
    "$HOME/.tmux.conf"
    "$HOME/.config/nvim"
    "$HOME/.local/bin/tmux-sessionizer"
)

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

load_homebrew_path() {
    if command -v brew &> /dev/null; then
        return
    fi

    if [ -x /opt/homebrew/bin/brew ]; then
        eval "$(/opt/homebrew/bin/brew shellenv)"
    elif [ -x /usr/local/bin/brew ]; then
        eval "$(/usr/local/bin/brew shellenv)"
    elif [ -x /home/linuxbrew/.linuxbrew/bin/brew ]; then
        eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    fi
}

install_homebrew() {
    load_homebrew_path

    if command -v brew &> /dev/null; then
        info "Homebrew already installed"
        return
    fi

    info "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    load_homebrew_path

    if ! command -v brew &> /dev/null; then
        error "Homebrew installation finished, but brew is not on PATH"
    fi
}

install_brewfile() {
    if [ ! -f "$DOTFILES_DIR/Brewfile" ]; then
        warn "No Brewfile found, skipping Homebrew packages"
        return
    fi

    info "Installing packages from Brewfile..."
    brew bundle install --file="$DOTFILES_DIR/Brewfile" || warn "Some Brewfile packages failed to install"
}

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
    warn "Backed up existing before Stow: $target"
}

backup_existing_stow_targets() {
    mkdir -p "$HOME/.config/ghostty" "$HOME/.config/opencode" "$HOME/.claude" "$HOME/.local/bin"

    for target in "${STOW_TARGETS[@]}"; do
        backup_stow_target "$target"
    done
}

apply_dotfiles() {
    backup_existing_stow_targets
    "$DOTFILES_DIR/scripts/stow.sh" apply
}

install_oh_my_zsh() {
    if [ -d "$HOME/.oh-my-zsh" ]; then
        info "Oh My Zsh already installed"
        return
    fi

    info "Installing Oh My Zsh..."
    sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended --keep-zshrc
}

install_zsh_syntax_highlighting() {
    local zsh_custom="${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}"

    if [ -d "$zsh_custom/plugins/zsh-syntax-highlighting" ]; then
        info "zsh-syntax-highlighting already installed"
        return
    fi

    info "Installing zsh-syntax-highlighting plugin..."
    mkdir -p "$zsh_custom/plugins"
    git clone https://github.com/zsh-users/zsh-syntax-highlighting.git "$zsh_custom/plugins/zsh-syntax-highlighting"
}

setup_fzf() {
    local fzf_install

    if ! command -v fzf &> /dev/null; then
        return
    fi

    if [ -f /opt/homebrew/opt/fzf/install ]; then
        fzf_install=/opt/homebrew/opt/fzf/install
    elif [ -f /usr/local/opt/fzf/install ]; then
        fzf_install=/usr/local/opt/fzf/install
    else
        return
    fi

    info "Setting up fzf keybindings..."
    "$fzf_install" --key-bindings --completion --no-update-rc --no-bash --no-fish
}

sync_neovim_plugins() {
    if ! command -v nvim &> /dev/null; then
        warn "Neovim not found, skipping plugin installation"
        return
    fi

    info "Installing Neovim plugins from lockfile (Lazy restore)..."
    nvim --headless -c "Lazy! restore" -c "qa" || warn "Lazy restore may have encountered issues"
}

install_npm_globals() {
    if ! command -v npm &> /dev/null; then
        warn "npm not found, skipping global npm packages"
        return
    fi

    if [ ! -f "$DOTFILES_DIR/npm-global-packages.txt" ]; then
        return
    fi

    info "Installing global npm packages..."
    while read -r package; do
        if [ -z "$package" ] || [[ "$package" == \#* ]]; then
            continue
        fi

        if npm list -g "$package" &> /dev/null; then
            info "$package already installed"
        else
            info "Installing $package..."
            npm install -g "$package" || warn "Failed to install $package"
        fi
    done < "$DOTFILES_DIR/npm-global-packages.txt"
}

install_amp() {
    if command -v amp &> /dev/null; then
        info "Amp CLI already installed: $(amp --version)"
        return
    fi

    info "Installing Amp CLI..."
    curl -fsSL https://ampcode.com/install.sh | bash || warn "Amp CLI installation failed"
}

main() {
    info "Bootstrapping development environment..."
    install_homebrew
    install_brewfile
    apply_dotfiles
    install_oh_my_zsh
    install_zsh_syntax_highlighting
    setup_fzf
    sync_neovim_plugins
    install_npm_globals
    install_amp

    echo ""
    info "Bootstrap complete! Restart your terminal or run: source ~/.zshrc"
}

main
