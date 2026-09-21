#!/bin/bash
set -euo pipefail

DOTFILES_DIR=${1:-"$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"}
shift || true
STOW_DIR="$DOTFILES_DIR/stow"
STOW_PACKAGES=("$@")

if [[ ${#STOW_PACKAGES[@]} -eq 0 ]]; then
    STOW_PACKAGES=(bash git ghostty herdr nvim bin opencode claude codex pi agents)
fi

if ! command -v stow &>/dev/null; then
    printf 'ERROR: GNU Stow is required for preflight validation\n' >&2
    exit 1
fi

for script in \
    "$DOTFILES_DIR/scripts/bootstrap.sh" \
    "$DOTFILES_DIR/scripts/backup.sh" \
    "$DOTFILES_DIR/scripts/stow.sh" \
    "$DOTFILES_DIR/scripts/validate-dotfiles.sh" \
    "$DOTFILES_DIR/stow/bash/.bash_profile" \
    "$DOTFILES_DIR/stow/bash/.bashrc" \
    "$DOTFILES_DIR/stow/bash/.config/bash/aliases.bash" \
    "$DOTFILES_DIR/stow/bash/.config/bash/environment.bash" \
    "$DOTFILES_DIR/stow/bash/.config/bash/functions.bash"; do
    bash -n "$script"
done

bash "$DOTFILES_DIR/test/bash_path_test.sh" "$DOTFILES_DIR"

validation_home=$(mktemp -d)
validation_log=$(mktemp)
cleanup() {
    rm -rf "$validation_home"
    rm -f "$validation_log"
}
trap cleanup EXIT

if ! stow -R --no-folding -t "$validation_home" -d "$STOW_DIR" "${STOW_PACKAGES[@]}" >"$validation_log" 2>&1; then
    cat "$validation_log" >&2
    printf 'ERROR: isolated Stow preflight failed\n' >&2
    exit 1
fi

env -i \
    HOME="$validation_home" \
    PATH=/usr/bin:/bin:/usr/sbin:/sbin \
    /bin/bash --noprofile --norc -c '
        if ! source "$HOME/.bash_profile"; then
            printf "ERROR: isolated Bash startup failed\n" >&2
            exit 1
        fi
        for command_name in awk bash env git grep rm sed; do
            if ! command -v "$command_name" >/dev/null; then
                printf "ERROR: isolated Bash startup lost command %s\n" "$command_name" >&2
                exit 1
            fi
        done
    '

printf 'PASS: isolated dotfiles preflight completed without live changes\n'
