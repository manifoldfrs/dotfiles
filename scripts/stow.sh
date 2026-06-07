#!/bin/bash

# Apply or remove GNU Stow-managed dotfiles.
# Usage: ./scripts/stow.sh [apply|dry-run|delete]

set -e

DOTFILES_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
STOW_DIR="$DOTFILES_DIR/stow"
STOW_PACKAGES=(zsh git ghostty tmux nvim bin)
STOW_FLAGS=(--no-folding -v -t "$HOME" -d "$STOW_DIR")

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

require_stow() {
    if ! command -v stow &> /dev/null; then
        error "GNU Stow is required. Install it with: brew install stow"
    fi

    if [ ! -d "$STOW_DIR" ]; then
        error "Stow directory not found: $STOW_DIR"
    fi
}

apply_dotfiles() {
    info "Applying Stow packages into $HOME..."
    stow -R "${STOW_FLAGS[@]}" "${STOW_PACKAGES[@]}"
}

dry_run_dotfiles() {
    info "Previewing Stow changes for $HOME..."
    stow -n "${STOW_FLAGS[@]}" "${STOW_PACKAGES[@]}"
}

delete_dotfiles() {
    warn "Removing Stow-managed symlinks from $HOME..."
    stow -D "${STOW_FLAGS[@]}" "${STOW_PACKAGES[@]}"
}

usage() {
    local status=${1:-1}

    echo "Usage: $0 [apply|dry-run|delete]"
    echo ""
    echo "Commands:"
    echo "  apply    Restow all managed dotfiles into home"
    echo "  dry-run  Preview Stow changes without modifying files"
    echo "  delete   Remove Stow-managed symlinks from home"
    exit "$status"
}

case "${1:-apply}" in
    apply)
        require_stow
        apply_dotfiles
        ;;
    dry-run)
        require_stow
        dry_run_dotfiles
        ;;
    delete)
        require_stow
        delete_dotfiles
        ;;
    help|--help|-h)
        usage 0
        ;;
    *)
        usage
        ;;
esac
