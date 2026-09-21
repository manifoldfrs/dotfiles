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

source_cached_init fzf-bash fzf --bash
source_cached_init mise-activate mise activate bash
source_cached_init zoxide-init zoxide init bash
source_cached_init starship-full-init starship init bash --print-full-init
unset -f source_cached_init

if declare -F __fzf_history__ &> /dev/null; then
    bind -m emacs-standard -x '"\C-f": __fzf_history__'
fi
