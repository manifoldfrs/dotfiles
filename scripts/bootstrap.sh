#!/bin/bash

# Bootstrap non-Stow machine setup, then apply managed dotfiles.
# Usage: ./scripts/bootstrap.sh

set -e

DOTFILES_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
STOW_TARGETS=(
    "$HOME/.config/fish/config.fish"
    "$HOME/.config/fish/fish_plugins"
    "$HOME/.config/starship.toml"
    "$HOME/.gitconfig"
    "$HOME/.gitignore_global"
    "$HOME/.config/ghostty/config"
    "$HOME/.config/opencode/opencode.jsonc"
    "$HOME/.config/opencode/tui.json"
    "$HOME/.claude/settings.local.json"
    "$HOME/.config/herdr/config.toml"
    "$HOME/.config/herdr/plugins.txt"
    "$HOME/.config/plannotator-tui/config.toml"
    "$HOME/.config/nvim"
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

    if brew help trust >/dev/null 2>&1; then
        brew trust plannotator/tap oven-sh/bun || warn "Could not trust the Plannotator and Bun taps"
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
    mkdir -p "$HOME/.config/ghostty" "$HOME/.config/fish" "$HOME/.config/opencode" "$HOME/.claude" "$HOME/.local/bin"

    for target in "${STOW_TARGETS[@]}"; do
        backup_stow_target "$target"
    done
}

apply_dotfiles() {
    backup_existing_stow_targets
    "$DOTFILES_DIR/scripts/stow.sh" apply
}

install_fisher_plugins() {
    if ! command -v fish &> /dev/null; then
        warn "Fish not found, skipping Fisher plugins"
        return
    fi

    info "Installing Fisher and declared Fish plugins..."
    fish -c '
        if not functions -q fisher
            curl -fsSL https://raw.githubusercontent.com/jorgebucaran/fisher/main/functions/fisher.fish | source
            fisher install jorgebucaran/fisher
        end
        fisher update
    ' || warn "Fisher plugin installation failed"
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
    bash "$DOTFILES_DIR/scripts/sync_herdr_plugins.sh" || warn "Herdr plugin setup failed. Install Bun if missing, then rerun scripts/sync_herdr_plugins.sh"
    install_fisher_plugins
    sync_neovim_plugins
    install_npm_globals
    install_amp

    echo ""
    info "Bootstrap complete! Restart Ghostty or run: exec fish --login"
}

main
