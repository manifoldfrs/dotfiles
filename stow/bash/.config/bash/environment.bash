#!/bin/bash

if [[ -d /opt/homebrew ]]; then
    export HOMEBREW_PREFIX=/opt/homebrew
    export HOMEBREW_CELLAR=/opt/homebrew/Cellar
    export HOMEBREW_REPOSITORY=/opt/homebrew
elif [[ -d /usr/local/Homebrew ]]; then
    export HOMEBREW_PREFIX=/usr/local
    export HOMEBREW_CELLAR=/usr/local/Cellar
    export HOMEBREW_REPOSITORY=/usr/local/Homebrew
elif [[ -d /home/linuxbrew/.linuxbrew ]]; then
    export HOMEBREW_PREFIX=/home/linuxbrew/.linuxbrew
    export HOMEBREW_CELLAR="$HOMEBREW_PREFIX/Cellar"
    export HOMEBREW_REPOSITORY="$HOMEBREW_PREFIX/Homebrew"
fi

if [[ -n ${HOMEBREW_PREFIX:-} && -x "$HOMEBREW_PREFIX/bin/bash" ]]; then
    export SHELL="$HOMEBREW_PREFIX/bin/bash"
fi

path_prepend() {
    local entry
    local remaining=$PATH
    local updated=$1

    [[ -d $1 ]] || return 0
    while [[ -n $remaining ]]; do
        entry=${remaining%%:*}
        if [[ $remaining == *:* ]]; then
            remaining=${remaining#*:}
        else
            remaining=
        fi
        [[ -z $entry || $entry == "$1" ]] && continue
        updated="$updated:$entry"
    done
    PATH=$updated
}

[[ -n ${HOMEBREW_PREFIX:-} ]] && path_prepend "$HOMEBREW_PREFIX/sbin"
[[ -n ${HOMEBREW_PREFIX:-} ]] && path_prepend "$HOMEBREW_PREFIX/bin"
path_prepend "$HOME/.local/bin"
path_prepend "$HOME/.opencode/bin"
path_prepend "$HOME/.cargo/bin"
path_prepend "$HOME/.deno/bin"
path_prepend "$HOME/.bun/bin"
path_prepend "$HOME/.pyenv/bin"
path_prepend "$HOME/.local/opt/go/bin"
path_prepend "$HOME/go/bin"
path_prepend "/Applications/Postgres.app/Contents/Versions/latest/bin"
path_prepend "/Applications/Ghostty.app/Contents/MacOS"
# Rex exports its CLI directory to its terminals but leaves PATH to the shell.
[[ -n ${REX_BIN_DIR:-} ]] && path_prepend "$REX_BIN_DIR"

if [[ -n ${HOMEBREW_PREFIX:-} && -x "$HOMEBREW_PREFIX/opt/ruby/bin/ruby" ]]; then
    path_prepend "$HOMEBREW_PREFIX/opt/ruby/bin"
fi

export PATH
export EDITOR=nvim
export VISUAL=nvim
export MANPAGER='nvim +Man!'
export PYENV_ROOT="$HOME/.pyenv"
export NVM_DIR="$HOME/.nvm"
export BUN_INSTALL="$HOME/.bun"

export FZF_DEFAULT_COMMAND='rg --files --hidden --no-ignore-vcs -g "!{node_modules,.git,Desktop,.Trash,Library,Pictures,.rvm}"'
export FZF_CTRL_T_COMMAND="$FZF_DEFAULT_COMMAND"
export CLICOLOR=1
export LSCOLORS='Exgxfxdxcxegedabagacad'
export LS_COLORS='di=1;34:ln=36:so=35:pi=33:ex=32:bd=34;46:cd=34;43:su=30;41:sg=30;46:tw=30;42:ow=30;43'
export FZF_ALT_C_COMMAND='fd --type d --hidden --exclude .git'
export FZF_DEFAULT_OPTS='--layout=reverse --margin=1,1 --color=fg:#c0caf5,bg:#1a1b26,hl:#7aa2f7,fg+:#c0caf5,bg+:#283457,hl+:#7aa2f7,info:#565f89,pointer:#bb9af7,marker:#9ece6a,spinner:#7aa2f7,header:#565f89'
export FZF_CTRL_R_OPTS='--preview "echo {}" --preview-window up:3:hidden:wrap --bind "ctrl-/:toggle-preview" --bind "ctrl-y:execute-silent(echo -n {2..} | pbcopy)+abort" --color header:italic --header "Press CTRL-Y to copy command into clipboard"'

[[ -r "$HOME/.deno/env" ]] && source "$HOME/.deno/env"
[[ -r "$HOME/.config/envman/load.sh" ]] && source "$HOME/.config/envman/load.sh"

unset -f path_prepend
