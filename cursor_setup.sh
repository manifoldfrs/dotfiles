#!/bin/bash

# Cursor Setup Script
# Handles: Cursor settings, keybindings, extensions
# Usage: ./cursor_setup.sh [backup|install]

set -e

DOTFILES_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CURSOR_USER_DIR="$HOME/Library/Application Support/Cursor/User"
CURSOR_DIR="$DOTFILES_DIR/cursor"

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
    elif [ -f "$dest" ]; then
        mv "$dest" "$dest.backup.$(date +%Y%m%d%H%M%S)"
        warn "Backed up existing: $dest"
    fi
    ln -sf "$src" "$dest"
    info "Linked: $src -> $dest"
}

backup() {
    info "Backing up Cursor configuration..."

    mkdir -p "$CURSOR_DIR"

    # Check if Cursor is installed
    if [ ! -d "$CURSOR_USER_DIR" ]; then
        error "Cursor not found at: $CURSOR_USER_DIR"
    fi

    # Backup settings.json
    if [ -f "$CURSOR_USER_DIR/settings.json" ]; then
        info "Copying settings.json..."
        cp "$CURSOR_USER_DIR/settings.json" "$CURSOR_DIR/settings.json"
    else
        warn "settings.json not found"
    fi

    # Backup keybindings.json
    if [ -f "$CURSOR_USER_DIR/keybindings.json" ]; then
        info "Copying keybindings.json..."
        cp "$CURSOR_USER_DIR/keybindings.json" "$CURSOR_DIR/keybindings.json"
    else
        warn "keybindings.json not found"
    fi

    # Export extensions list
    info "Exporting extensions list..."
    if command -v cursor &> /dev/null; then
        cursor --list-extensions > "$CURSOR_DIR/extensions.txt" 2>/dev/null || true
        info "Extensions exported via Cursor CLI"
    else
        # Try to get from extensions directory
        if [ -d "$HOME/.cursor/extensions" ]; then
            ls "$HOME/.cursor/extensions" 2>/dev/null | grep -v '.obsolete' | sed 's/-[0-9.]*$//' | sort -u > "$CURSOR_DIR/extensions.txt"
            info "Extensions exported from extensions directory"
        else
            warn "Could not export extensions - Cursor CLI not available"
        fi
    fi

    # Backup snippets
    if [ -d "$CURSOR_USER_DIR/snippets" ]; then
        info "Copying snippets..."
        rm -rf "$CURSOR_DIR/snippets"
        cp -r "$CURSOR_USER_DIR/snippets" "$CURSOR_DIR/snippets"
    fi

    info "Backup complete!"
    echo ""
    echo "Files updated in cursor/:"
    [ -f "$CURSOR_DIR/settings.json" ] && echo "  - settings.json"
    [ -f "$CURSOR_DIR/keybindings.json" ] && echo "  - keybindings.json"
    [ -f "$CURSOR_DIR/extensions.txt" ] && echo "  - extensions.txt"
    [ -d "$CURSOR_DIR/snippets" ] && echo "  - snippets/"
}

install() {
    info "Installing Cursor configuration..."

    # Check if cursor directory exists
    if [ ! -d "$CURSOR_DIR" ]; then
        error "cursor/ directory not found in dotfiles"
    fi

    # Create Cursor User directory
    mkdir -p "$CURSOR_USER_DIR"

    # Link settings.json
    if [ -f "$CURSOR_DIR/settings.json" ]; then
        link_file "$CURSOR_DIR/settings.json" "$CURSOR_USER_DIR/settings.json"
    else
        warn "settings.json not found in dotfiles"
    fi

    # Link keybindings.json
    if [ -f "$CURSOR_DIR/keybindings.json" ]; then
        link_file "$CURSOR_DIR/keybindings.json" "$CURSOR_USER_DIR/keybindings.json"
    else
        warn "keybindings.json not found in dotfiles"
    fi

    # Link snippets
    if [ -d "$CURSOR_DIR/snippets" ]; then
        link_file "$CURSOR_DIR/snippets" "$CURSOR_USER_DIR/snippets"
    fi

    # Install extensions
    if [ -f "$CURSOR_DIR/extensions.txt" ]; then
        info "Installing extensions..."
        
        if command -v cursor &> /dev/null; then
            while IFS= read -r extension || [ -n "$extension" ]; do
                [[ -z "$extension" || "$extension" =~ ^# ]] && continue
                echo "  Installing: $extension"
                cursor --install-extension "$extension" --force 2>/dev/null || warn "Failed: $extension"
            done < "$CURSOR_DIR/extensions.txt"
        else
            warn "Cursor CLI not available"
            echo ""
            echo "To install extensions manually:"
            echo "  1. Open Cursor"
            echo "  2. Go to Extensions (Cmd+Shift+X)"
            echo "  3. Install each extension from extensions.txt"
        fi
    fi

    echo ""
    info "Cursor setup complete!"
    echo ""
    echo "Next steps:"
    echo "  1. Restart Cursor for settings to take effect"
    echo "  2. Sign in to sync any cloud settings"
}

usage() {
    echo "Usage: $0 [backup|install]"
    echo ""
    echo "Commands:"
    echo "  backup   Copy Cursor settings, keybindings, and extensions to dotfiles"
    echo "  install  Link settings/keybindings and install extensions"
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
