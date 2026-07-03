#!/bin/bash

# Apply or remove GNU Stow-managed dotfiles.
# Usage: ./scripts/stow.sh [--cb] [apply|dry-run|delete]

set -e

DOTFILES_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
STOW_DIR="$DOTFILES_DIR/stow"
TPM_DIR="$HOME/.tmux/plugins/tpm"
TPM_REPO=https://github.com/tmux-plugins/tpm
CODEX_THEME_FILE="tokyonight-frsh.tmTheme"
DEFAULT_STOW_PACKAGES=(zsh git ghostty tmux nvim bin opencode claude codex pi)
CB_STOW_PACKAGES=(zsh zsh-cb git git-cb ghostty tmux nvim bin pi)
STOW_FLAGS=(--no-folding -v -t "$HOME" -d "$STOW_DIR")
CODEX_SKILL_NAMES=(grill-me grill-me-with-docs quiz-me tldr)
SHARED_BACKUP_TARGETS=(
    "$HOME/.local/bin/agent-commander"
    "$HOME/.local/share/agent-guardrails/block-dangerous-bash.sh"
    "$HOME/.local/share/agent-guardrails/block-generated-edits.sh"
)
CODEX_BACKUP_TARGETS=(
    "$HOME/.codex/config.toml"
    "$HOME/.codex/hooks.json"
    "$HOME/.codex/hooks/block-dangerous-bash.sh"
    "$HOME/.codex/hooks/block-generated-edits.sh"
    "$HOME/.codex/themes/$CODEX_THEME_FILE"
    "$HOME/.agents/skills/grill-me"
    "$HOME/.agents/skills/grill-me-with-docs"
    "$HOME/.agents/skills/quiz-me"
    "$HOME/.agents/skills/tldr"
)
PI_BACKUP_TARGETS=(
    "$HOME/.pi/agent/mcp.json"
    "$HOME/.pi/agent/settings.json"
)
CB_BACKUP_TARGETS=(
    "$HOME/.zshrc"
    "$HOME/.zshrc.local"
    "$HOME/.zprofile"
    "$HOME/.zshenv"
    "$HOME/.gitconfig"
    "$HOME/.gitconfig.local"
    "$HOME/.gitignore_global"
    "$HOME/.tmux.conf"
    "$HOME/.config/nvim"
    "$HOME/.config/ghostty/config"
    "$HOME/.local/bin/tmux-sessionizer"
)

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

usage() {
    local status=${1:-1}

    echo "Usage: $0 [--cb] [apply|dry-run|delete]"
    echo ""
    echo "Commands:"
    echo "  apply    Restow managed dotfiles into home"
    echo "  dry-run  Preview Stow changes without modifying files"
    echo "  delete   Remove Stow-managed symlinks from home"
    echo ""
    echo "Options:"
    echo "  --cb     Use Coinbase laptop package profile"
    exit "$status"
}

require_stow() {
    if ! command -v stow &> /dev/null; then
        error "GNU Stow is required. Install it with: brew install stow"
    fi

    if [ ! -d "$STOW_DIR" ]; then
        error "Stow directory not found: $STOW_DIR"
    fi
}

backup_stow_target() {
    local target=$1

    if [ ! -e "$target" ] && [ ! -L "$target" ]; then
        return
    fi

    if is_stow_managed_tree "$target"; then
        return
    fi

    mv "$target" "$target.backup.$(date +%Y%m%d%H%M%S)"
    warn "Backed up existing before Stow: $target"
}

is_stow_managed_link() {
    local target=$1
    local link_dest

    if [ ! -L "$target" ]; then
        return 1
    fi

    link_dest="$(readlink "$target")"
    case "$link_dest" in
        *dotfiles/stow/*|*"$DOTFILES_DIR/stow"*)
            return 0
            ;;
    esac

    return 1
}

is_stow_managed_tree() {
    local target=$1
    local entry
    local saw_entry=0

    if is_stow_managed_link "$target"; then
        return 0
    fi

    if [ ! -d "$target" ]; then
        return 1
    fi

    for entry in "$target"/* "$target"/.[!.]* "$target"/..?*; do
        if [ ! -e "$entry" ] && [ ! -L "$entry" ]; then
            continue
        fi

        saw_entry=1
        if ! is_stow_managed_tree "$entry"; then
            return 1
        fi
    done

    [ "$saw_entry" -eq 1 ]
}

backup_pi_stow_targets() {
    mkdir -p "$HOME/.pi/agent"

    for target in "${PI_BACKUP_TARGETS[@]}"; do
        backup_stow_target "$target"
    done
}

backup_shared_stow_targets() {
    mkdir -p "$HOME/.local/bin" "$HOME/.local/share/agent-guardrails"

    for target in "${SHARED_BACKUP_TARGETS[@]}"; do
        backup_stow_target "$target"
    done
}

backup_cb_stow_targets() {
    mkdir -p "$HOME/.config/ghostty" "$HOME/.local/bin"

    for target in "${CB_BACKUP_TARGETS[@]}"; do
        backup_stow_target "$target"
    done
}

backup_codex_stow_targets() {
    mkdir -p "$HOME/.codex/themes"

    for target in "${CODEX_BACKUP_TARGETS[@]}"; do
        backup_stow_target "$target"
    done
}

install_tpm() {
    if [ -d "$TPM_DIR" ]; then
        info "TPM already installed"
        return 0
    fi

    if ! command -v git &> /dev/null; then
        warn "git not found, skipping TPM installation"
        return 1
    fi

    info "Installing tmux plugin manager (TPM)..."
    mkdir -p "$(dirname "$TPM_DIR")"
    git clone "$TPM_REPO" "$TPM_DIR" || {
        warn "TPM installation failed - install manually"
        return 1
    }
}

install_tmux_plugins() {
    if ! command -v tmux &> /dev/null; then
        warn "tmux not found, skipping tmux plugin installation"
        return
    fi

    if ! install_tpm; then
        return
    fi

    if [ ! -x "$TPM_DIR/bin/install_plugins" ]; then
        warn "TPM install script not found - run tmux plugin installation manually"
        return
    fi

    info "Installing tmux plugins from ~/.tmux.conf..."
    "$TPM_DIR/bin/install_plugins" || warn "tmux plugin installation failed - run manually"
}

parse_args() {
    ACTION=apply
    PROFILE=default

    while [ "$#" -gt 0 ]; do
        case "$1" in
            --cb)
                PROFILE=cb
                ;;
            apply|dry-run|delete)
                ACTION=$1
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

select_packages() {
    if [ "$PROFILE" = "cb" ]; then
        STOW_PACKAGES=("${CB_STOW_PACKAGES[@]}")
        return
    fi

    STOW_PACKAGES=("${DEFAULT_STOW_PACKAGES[@]}")
}

has_stow_package() {
    local package=$1
    local selected

    for selected in "${STOW_PACKAGES[@]}"; do
        if [ "$selected" = "$package" ]; then
            return 0
        fi
    done

    return 1
}

personal_home() {
    case "$HOME" in
        */.cbcode-home)
            dirname "$HOME"
            ;;
        *)
            printf '%s\n' "$HOME"
            ;;
    esac
}

cbcode_home() {
    printf '%s\n' "${CBCODE_HOME:-$(personal_home)/.cbcode-home}"
}

codex_theme_src() {
    printf '%s\n' "$STOW_DIR/codex/.codex/themes/$CODEX_THEME_FILE"
}

ensure_cbcode_codex_theme_link() {
    local cb_home
    local src
    local dest
    local link_dest

    if ! has_stow_package codex; then
        return
    fi

    cb_home="$(cbcode_home)"
    if [ ! -d "$cb_home/.codex" ]; then
        return
    fi

    src="$(codex_theme_src)"
    dest="$cb_home/.codex/themes/$CODEX_THEME_FILE"

    if [ ! -f "$src" ]; then
        warn "Codex theme source missing: $src"
        return
    fi

    mkdir -p "$cb_home/.codex/themes"

    if [ -L "$dest" ]; then
        link_dest="$(readlink "$dest")"
        if [ "$link_dest" = "$src" ]; then
            return
        fi

        if is_stow_managed_link "$dest"; then
            rm "$dest"
        fi
    fi

    if [ -e "$dest" ] || [ -L "$dest" ]; then
        backup_stow_target "$dest"
    fi

    ln -s "$src" "$dest"
    info "Linked cbcode Codex theme: $dest -> $src"
}

remove_cbcode_codex_theme_link() {
    local cb_home
    local src
    local dest
    local link_dest

    if ! has_stow_package codex; then
        return
    fi

    cb_home="$(cbcode_home)"
    src="$(codex_theme_src)"
    dest="$cb_home/.codex/themes/$CODEX_THEME_FILE"

    if [ ! -L "$dest" ]; then
        return
    fi

    link_dest="$(readlink "$dest")"
    if [ "$link_dest" != "$src" ]; then
        return
    fi

    rm "$dest"
    info "Removed cbcode Codex theme link: $dest"
}

ensure_codex_skill_folder_links() {
    local skill
    local src
    local dest
    local link_dest

    if ! has_stow_package codex; then
        return
    fi

    mkdir -p "$HOME/.agents/skills"

    for skill in "${CODEX_SKILL_NAMES[@]}"; do
        src="$DOTFILES_DIR/stow/codex/.agents/skills/$skill"
        dest="$HOME/.agents/skills/$skill"

        if [ ! -d "$src" ]; then
            warn "Codex skill source missing: $src"
            continue
        fi

        if [ -L "$dest" ]; then
            link_dest="$(readlink "$dest")"
            if [ "$link_dest" = "$src" ]; then
                continue
            fi
        fi

        if [ -e "$dest" ] || [ -L "$dest" ]; then
            if ! is_stow_managed_tree "$dest"; then
                warn "Skipping non-Stow Codex skill target: $dest"
                continue
            fi

            rm -rf "$dest"
        fi

        ln -s "$src" "$dest"
        info "Linked Codex skill folder: $dest -> $src"
    done
}

remove_codex_skill_folder_links() {
    local skill
    local src
    local dest
    local link_dest

    if ! has_stow_package codex; then
        return
    fi

    for skill in "${CODEX_SKILL_NAMES[@]}"; do
        src="$DOTFILES_DIR/stow/codex/.agents/skills/$skill"
        dest="$HOME/.agents/skills/$skill"

        if [ ! -L "$dest" ]; then
            continue
        fi

        link_dest="$(readlink "$dest")"
        if [ "$link_dest" != "$src" ]; then
            continue
        fi

        rm "$dest"
        info "Removed Codex skill folder link: $dest"
    done
}

link_ssh_config() {
    local src="$DOTFILES_DIR/stow/ssh-cb/.ssh/config"
    local dest="$HOME/.ssh/config"

    if [ ! -f "$src" ]; then
        return
    fi

    mkdir -p "$HOME/.ssh"

    if [ -L "$dest" ] && [ "$(readlink "$dest")" = "$src" ]; then
        info "SSH config already linked: $dest"
        return
    fi

    if [ -e "$dest" ] && [ ! -L "$dest" ]; then
        mv "$dest" "$dest.backup.$(date +%Y%m%d%H%M%S)"
        warn "Backed up existing SSH config: $dest"
    fi

    ln -sf "$src" "$dest"
    info "Linked SSH config: $dest -> $src"
}

apply_dotfiles() {
    backup_shared_stow_targets
    backup_pi_stow_targets

    if [ "$PROFILE" = "cb" ]; then
        backup_cb_stow_targets
        link_ssh_config
    else
        backup_codex_stow_targets
    fi

    info "Applying Stow packages into $HOME: ${STOW_PACKAGES[*]}"
    stow -R "${STOW_FLAGS[@]}" "${STOW_PACKAGES[@]}"
    ensure_codex_skill_folder_links
    ensure_cbcode_codex_theme_link
    install_tmux_plugins
}

dry_run_dotfiles() {
    info "Previewing Stow changes for $HOME: ${STOW_PACKAGES[*]}"
    stow -n "${STOW_FLAGS[@]}" "${STOW_PACKAGES[@]}"
}

delete_dotfiles() {
    remove_codex_skill_folder_links
    remove_cbcode_codex_theme_link
    warn "Removing Stow-managed symlinks from $HOME: ${STOW_PACKAGES[*]}"
    stow -D "${STOW_FLAGS[@]}" "${STOW_PACKAGES[@]}"
}

parse_args "$@"
require_stow
select_packages

case "$ACTION" in
    apply)
        apply_dotfiles
        ;;
    dry-run)
        dry_run_dotfiles
        ;;
    delete)
        delete_dotfiles
        ;;
esac
