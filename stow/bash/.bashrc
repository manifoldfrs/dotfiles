#!/bin/bash

[[ -r "$HOME/.config/bash/environment.bash" ]] && source "$HOME/.config/bash/environment.bash"
[[ -r "$HOME/.config/bash/local.bash" ]] && source "$HOME/.config/bash/local.bash"

[[ $- != *i* ]] && return

shopt -s checkwinsize globstar histappend
HISTCONTROL=ignoreboth:erasedups
HISTSIZE=50000
HISTFILESIZE=50000

[[ -r "$HOME/.config/bash/aliases.bash" ]] && source "$HOME/.config/bash/aliases.bash"
[[ -r "$HOME/.config/bash/functions.bash" ]] && source "$HOME/.config/bash/functions.bash"

source_cached_init() {
    local cache_name=$1
    local command_name=$2
    local cache_dir="${XDG_CACHE_HOME:-$HOME/.cache}/bash/init"
    local cache_file="$cache_dir/$cache_name.bash"
    local command_path
    local temporary_file
    shift 2

    command_path=$(command -v "$command_name") || return
    if [[ ! -r $cache_file || $command_path -nt $cache_file ]]; then
        mkdir -p "$cache_dir"
        temporary_file="$cache_file.$$"
        if ! "$command_name" "$@" > "$temporary_file"; then
            rm -f "$temporary_file"
            return
        fi
        mv "$temporary_file" "$cache_file"
    fi
    source "$cache_file"
}

# Starship hooks into bash-preexec only when it is loaded first; Atuin needs it too.
[[ -r "${HOMEBREW_PREFIX:-}/etc/profile.d/bash-preexec.sh" ]] && source "$HOMEBREW_PREFIX/etc/profile.d/bash-preexec.sh"

source_cached_init fzf-bash fzf --bash
source_cached_init zoxide-init zoxide init bash
source_cached_init starship-full-init starship init bash --print-full-init
source_cached_init atuin-init atuin init bash --disable-ctrl-r --disable-up-arrow
unset -f source_cached_init

if command -v atuin &> /dev/null && command -v fzf &> /dev/null; then
    __atuin_fzf_history() {
        local selected
        selected=$(atuin history list --cmd-only --print0 |
            fzf --read0 --tac --scheme=history --query="$READLINE_LINE" \
                --bind "ctrl-d:reload(atuin history list --cmd-only --print0 --cwd)")
        [[ -n $selected ]] || return
        READLINE_LINE=$selected
        READLINE_POINT=${#selected}
    }
    bind -m emacs-standard -x '"\C-r": __atuin_fzf_history'
    bind -m emacs-standard -x '"\C-f": __atuin_fzf_history'
elif declare -F __fzf_history__ &> /dev/null; then
    bind -m emacs-standard -x '"\C-f": __fzf_history__'
fi
