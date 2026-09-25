#!/bin/bash

# Apply or remove GNU Stow-managed dotfiles.
# Usage: ./scripts/stow.sh [apply|dry-run|delete]
# With no action, this script performs a dry run and does not change HOME.

set -e

DOTFILES_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
STOW_DIR="$DOTFILES_DIR/stow"
CODEX_THEME_FILE="tokyonight-frsh.tmTheme"
STOW_PACKAGES=(bash git ghostty herdr nvim bin opencode claude codex pi agents)
STOW_FLAGS=(--no-folding -v -t "$HOME" -d "$STOW_DIR")
AGENT_SKILLS_DIR="$STOW_DIR/agents/.agents/skills"
SKILL_TARGET_DIRS=("$HOME/.agents/skills" "$HOME/.claude/skills")
SHARED_BACKUP_TARGETS=(
    "$HOME/.config/herdr/plugins.txt"
    "$HOME/.config/plannotator-tui/config.toml"
    "$HOME/.local/share/agent-guardrails/block-dangerous-bash.sh"
    "$HOME/.local/share/agent-guardrails/block-generated-edits.sh"
)
OPENCODE_BACKUP_TARGETS=(
    "$HOME/.config/opencode/AGENTS.md"
    "$HOME/.config/opencode/cli.json"
    "$HOME/.config/opencode/opencode.jsonc"
    "$HOME/.config/opencode/plugins/typesafe-ai"
    "$HOME/.config/opencode/plugins/optojr-slack"
    "$HOME/.config/opencode/plugins/tui-conveniences"
)
CODEX_BACKUP_TARGETS=(
    "$HOME/.codex/AGENTS.md"
    "$HOME/.codex/config.toml"
    "$HOME/.codex/hooks.json"
    "$HOME/.codex/hooks/block-dangerous-bash.sh"
    "$HOME/.codex/hooks/block-generated-edits.sh"
    "$HOME/.codex/themes/$CODEX_THEME_FILE"
)
PI_BACKUP_TARGETS=(
    "$HOME/.pi/agent/mcp.json"
    "$HOME/.pi/agent/settings.json"
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

    echo "Usage: $0 [apply|dry-run|delete]"
    echo ""
    echo "Commands:"
    echo "  apply    Validate in isolation, then restow managed dotfiles into home"
    echo "  dry-run  Preview Stow changes without modifying files"
    echo "  delete   Remove Stow-managed symlinks from home"
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

remove_legacy_tmux_links() {
    local target
    local link_dest

    for target in "$HOME/.tmux.conf" "$HOME/.local/bin/tmux-sessionizer"; do
        if [ ! -L "$target" ]; then
            continue
        fi

        link_dest="$(readlink "$target")"
        case "$link_dest" in
            *dotfiles/stow/tmux/*|*dotfiles/stow/bin/.local/bin/tmux-sessionizer|*"$DOTFILES_DIR/stow/tmux/"*|*"$DOTFILES_DIR/stow/bin/.local/bin/tmux-sessionizer")
                rm "$target"
                info "Removed archived tmux symlink: $target"
                ;;
        esac
    done
}

remove_legacy_opencode_links() {
    local target

    for target in \
        "$HOME/.config/opencode/tui.json" \
        "$HOME/.config/opencode/plugin/cb-guards.ts" \
        "$HOME/.config/opencode/plugins/cb-guards.ts"; do
        if is_stow_managed_link "$target"; then
            rm "$target"
            info "Removed legacy OpenCode symlink: $target"
        fi
    done

    rmdir "$HOME/.config/opencode/plugin" 2>/dev/null || true
}

remove_legacy_fish_links() {
    local link_dest
    local target

    if [ -d "$HOME/.config/fish" ]; then
        while IFS= read -r target; do
            link_dest="$(readlink "$target")"
            case "$link_dest" in
                *dotfiles/stow/fish/*|*"$DOTFILES_DIR/stow/fish/"*)
                    rm "$target"
                    info "Removed archived Fish symlink: $target"
                    ;;
            esac
        done < <(find "$HOME/.config/fish" -type l | sort)
        find "$HOME/.config/fish" -depth -type d -empty -delete 2>/dev/null || true
    fi

    target="$HOME/.config/starship.toml"
    if [ -L "$target" ]; then
        link_dest="$(readlink "$target")"
        case "$link_dest" in
            *dotfiles/stow/fish/*|*"$DOTFILES_DIR/stow/fish/"*)
                rm "$target"
                info "Removed archived Fish Starship symlink: $target"
                ;;
        esac
    fi
}

backup_opencode_stow_targets() {
    local target

    if ! has_stow_package opencode; then
        return
    fi

    mkdir -p "$HOME/.config/opencode/plugins"

    for target in "${OPENCODE_BACKUP_TARGETS[@]}"; do
        backup_stow_target "$target"
    done
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

backup_bash_stow_targets() {
    local source
    local relative

    if ! has_stow_package bash; then
        return
    fi

    while IFS= read -r source; do
        relative="${source#"$STOW_DIR/bash/"}"
        backup_stow_target "$HOME/$relative"
    done < <(find "$STOW_DIR/bash" -type f | sort)
}

backup_codex_stow_targets() {
    local target

    mkdir -p "$HOME/.codex/themes"

    for target in "${CODEX_BACKUP_TARGETS[@]}"; do
        backup_stow_target "$target"
    done
}

backup_shared_skill_targets() {
    local backup_dir
    local backup_name
    local skill_dir
    local target
    local target_dir

    if ! has_stow_package agents; then
        return
    fi

    for target_dir in "${SKILL_TARGET_DIRS[@]}"; do
        backup_dir="${target_dir%/skills}/skill-backups"
        mkdir -p "$target_dir" "$backup_dir"

        for skill_dir in "$AGENT_SKILLS_DIR"/*; do
            if [ ! -f "$skill_dir/SKILL.md" ]; then
                continue
            fi
            backup_stow_target "$target_dir/$(basename "$skill_dir")"
        done

        for target in "$target_dir"/*.backup.*; do
            if [ ! -e "$target" ] && [ ! -L "$target" ]; then
                continue
            fi

            backup_name="$(basename "$target")"
            if [ -e "$backup_dir/$backup_name" ] || [ -L "$backup_dir/$backup_name" ]; then
                warn "Skipping existing skill backup destination: $backup_dir/$backup_name"
                continue
            fi

            mv "$target" "$backup_dir/$backup_name"
            info "Moved skill backup outside agent discovery: $backup_name"
        done
    done
}

parse_args() {
    ACTION=dry-run

    while [ "$#" -gt 0 ]; do
        case "$1" in
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

ensure_shared_skill_folder_links() {
    local skill_dir
    local src
    local dest
    local link_dest
    local target_dir

    if ! has_stow_package agents; then
        return
    fi

    for target_dir in "${SKILL_TARGET_DIRS[@]}"; do
        mkdir -p "$target_dir"

        for skill_dir in "$AGENT_SKILLS_DIR"/*; do
            if [ ! -f "$skill_dir/SKILL.md" ]; then
                continue
            fi

            src="$skill_dir"
            dest="$target_dir/$(basename "$skill_dir")"

            if [ -L "$dest" ]; then
                link_dest="$(readlink "$dest")"
                if [ "$link_dest" = "$src" ]; then
                    continue
                fi
            fi

            if [ -e "$dest" ] || [ -L "$dest" ]; then
                warn "Skipping non-Stow agent skill target: $dest"
                continue
            fi

            ln -s "$src" "$dest"
            info "Linked agent skill folder: $dest -> $src"
        done
    done
}

remove_shared_skill_folder_links() {
    local skill_dir
    local src
    local dest
    local link_dest
    local target_dir

    if ! has_stow_package agents; then
        return
    fi

    for target_dir in "${SKILL_TARGET_DIRS[@]}"; do
        for skill_dir in "$AGENT_SKILLS_DIR"/*; do
            if [ ! -f "$skill_dir/SKILL.md" ]; then
                continue
            fi

            src="$skill_dir"
            dest="$target_dir/$(basename "$skill_dir")"

            if [ ! -L "$dest" ]; then
                continue
            fi

            link_dest="$(readlink "$dest")"
            if [ "$link_dest" != "$src" ]; then
                continue
            fi

            rm "$dest"
            info "Removed agent skill folder link: $dest"
        done
    done
}

apply_dotfiles() {
    info "Running isolated preflight before changing $HOME"
    "$DOTFILES_DIR/scripts/validate-dotfiles.sh" "$DOTFILES_DIR" "${STOW_PACKAGES[@]}"

    remove_legacy_tmux_links
    remove_legacy_opencode_links
    remove_legacy_fish_links
    backup_bash_stow_targets
    backup_shared_stow_targets
    backup_opencode_stow_targets
    backup_pi_stow_targets
    backup_shared_skill_targets

    backup_codex_stow_targets

    info "Applying Stow packages into $HOME: ${STOW_PACKAGES[*]}"
    stow -R "${STOW_FLAGS[@]}" "${STOW_PACKAGES[@]}"
    ensure_shared_skill_folder_links
}

dry_run_dotfiles() {
    info "Previewing Stow changes for $HOME: ${STOW_PACKAGES[*]}"
    stow -n "${STOW_FLAGS[@]}" "${STOW_PACKAGES[@]}"
}

delete_dotfiles() {
    remove_legacy_tmux_links
    remove_legacy_opencode_links
    remove_legacy_fish_links
    remove_shared_skill_folder_links
    warn "Removing Stow-managed symlinks from $HOME: ${STOW_PACKAGES[*]}"
    stow -D "${STOW_FLAGS[@]}" "${STOW_PACKAGES[@]}"
}

parse_args "$@"
require_stow

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
