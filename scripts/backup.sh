#!/bin/bash

# Snapshot current machine config back into tracked dotfile sources.
# Usage: ./scripts/backup.sh [--cb]

set -e

DOTFILES_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
STOW_DIR="$DOTFILES_DIR/stow"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

usage() {
    local status=${1:-1}

    echo "Usage: $0 [--cb]"
    echo ""
    echo "Options:"
    echo "  --cb     Backup only Coinbase local override files"
    exit "$status"
}

parse_args() {
    PROFILE=default

    while [ "$#" -gt 0 ]; do
        case "$1" in
            --cb)
                PROFILE=cb
                ;;
            help|--help|-h)
                usage 0
                ;;
            *)
                usage
                ;;
        esac
        shift
    done
}

copy_file() {
    local src=$1
    local dest=$2
    local label=$3

    if [ ! -f "$src" ]; then
        return
    fi

    info "Copying $label..."
    mkdir -p "$(dirname "$dest")"

    if [ -f "$dest" ] && cmp -s "$src" "$dest"; then
        info "$label already current"
        return
    fi

    cp -L "$src" "$dest"
}

export_brewfile() {
    if ! command -v brew &> /dev/null; then
        warn "Homebrew not installed, skipping Brewfile export"
        return
    fi

    info "Exporting Homebrew packages to Brewfile..."
    brew bundle dump --file="$DOTFILES_DIR/Brewfile" --force
}

export_npm_globals() {
    if ! command -v npm &> /dev/null; then
        warn "npm not installed, skipping npm package export"
        return
    fi

    info "Exporting global npm packages..."
    {
        echo "# Global npm packages to install"
        echo "# Format: package-name (without version to get latest)"
        echo "# Run: ./scripts/bootstrap.sh"
        echo ""
        npm list -g --depth=0 2>/dev/null | tail -n +2 | awk '{print $2}' | cut -d'@' -f1 | grep -v "^npm$\|^corepack$\|^$" || true
    } > "$DOTFILES_DIR/npm-global-packages.txt"
}

backup_warp_themes() {
    if [ ! -d "$HOME/.warp/themes" ]; then
        return
    fi

    info "Copying Warp themes..."
    mkdir -p "$DOTFILES_DIR/warp"
    cp -R "$HOME/.warp/themes" "$DOTFILES_DIR/warp/"
}

backup_shared_config() {
    info "Backing up shell/editor configuration..."

    export_brewfile
    copy_file "$HOME/.zshrc" "$STOW_DIR/zsh/.zshrc" ".zshrc"
    copy_file "$HOME/.zprofile" "$STOW_DIR/zsh/.zprofile" ".zprofile"
    copy_file "$HOME/.zshenv" "$STOW_DIR/zsh/.zshenv" ".zshenv"
    copy_file "$HOME/.gitconfig" "$STOW_DIR/git/.gitconfig" ".gitconfig"
    copy_file "$HOME/.gitignore_global" "$STOW_DIR/git/.gitignore_global" ".gitignore_global"
    copy_file "$HOME/.config/ghostty/config" "$STOW_DIR/ghostty/.config/ghostty/config" "Ghostty config"
    copy_file "$HOME/.config/herdr/config.toml" "$STOW_DIR/herdr/.config/herdr/config.toml" "Herdr config"
    backup_warp_themes
    export_npm_globals
}

backup_coinbase_config() {
    info "Backing up Coinbase local override configuration..."

    copy_file "$HOME/.zshrc.local" "$STOW_DIR/zsh-cb/.zshrc.local" ".zshrc.local"
    copy_file "$HOME/.gitconfig.local" "$STOW_DIR/git-cb/.gitconfig.local" ".gitconfig.local"
}

main() {
    parse_args "$@"

    if [ "$PROFILE" = "cb" ]; then
        backup_coinbase_config
    else
        backup_shared_config
    fi

    echo ""
    info "Backup complete. Review changes with: git status --short && git diff"
}

main "$@"
