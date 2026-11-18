#!/bin/bash

# Snapshot current machine config back into tracked dotfile sources.
# Usage: ./scripts/backup.sh

set -e

DOTFILES_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
STOW_DIR="$DOTFILES_DIR/stow"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

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
    # Cursor extensions are tracked in cursor/extensions.txt, not the Brewfile.
    brew bundle dump --file="$DOTFILES_DIR/Brewfile" --force --no-vscode
}

export_npm_globals() {
    if ! command -v npm &> /dev/null; then
        warn "npm not installed, skipping npm package export"
        return
    fi

    info "Exporting global npm packages..."
    local manifest="$DOTFILES_DIR/npm-global-packages.txt"
    local packages

    if ! packages=$(npm list -g --depth=0 --json 2>/dev/null | node -e '
        const tree = JSON.parse(require("fs").readFileSync(0, "utf8"));
        const names = Object.keys(tree.dependencies ?? {}).filter((name) => name !== "npm" && name !== "corepack");
        process.stdout.write(names.map((name) => `${name}\n`).join(""));
    '); then
        warn "npm package export failed, keeping existing $manifest"
        return
    fi

    {
        echo "# Global npm packages to install"
        echo "# Format: package-name (without version to get latest)"
        echo "# Run: ./scripts/bootstrap.sh"
        echo ""
        printf '%s' "$packages"
    } > "$manifest.tmp"
    mv "$manifest.tmp" "$manifest"
}

backup_warp_themes() {
    if [ ! -d "$HOME/.warp/themes" ]; then
        return
    fi

    info "Copying Warp themes..."
    mkdir -p "$DOTFILES_DIR/warp"
    cp -R "$HOME/.warp/themes" "$DOTFILES_DIR/warp/"
}

backup_stow_package() {
    local package=$1
    local tracked
    local relative

    while IFS= read -r tracked; do
        relative="${tracked#"$STOW_DIR/$package/"}"
        copy_file "$HOME/$relative" "$tracked" "$relative"
    done < <(find "$STOW_DIR/$package" -type f | sort)
}

backup_shared_config() {
    info "Backing up shell/editor configuration..."

    export_brewfile
    backup_stow_package bash
    copy_file "$HOME/.gitconfig" "$STOW_DIR/git/.gitconfig" ".gitconfig"
    copy_file "$HOME/.gitignore_global" "$STOW_DIR/git/.gitignore_global" ".gitignore_global"
    copy_file "$HOME/.config/ghostty/config" "$STOW_DIR/ghostty/.config/ghostty/config" "Ghostty config"
    copy_file "$HOME/.config/herdr/config.toml" "$STOW_DIR/herdr/.config/herdr/config.toml" "Herdr config"
    copy_file "$HOME/.config/herdr/plugins.txt" "$STOW_DIR/herdr/.config/herdr/plugins.txt" "Herdr plugins"
    copy_file "$HOME/.config/plannotator-tui/config.toml" "$STOW_DIR/herdr/.config/plannotator-tui/config.toml" "Plannotator TUI config"
    backup_stow_package rex
    backup_stow_package cursor
    backup_warp_themes
    export_npm_globals
}

main() {
    backup_shared_config

    echo ""
    info "Backup complete. Review changes with: git status --short && git diff"
}

main
