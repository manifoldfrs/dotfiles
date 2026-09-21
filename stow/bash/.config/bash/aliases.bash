#!/bin/bash

alias c='clear'
alias code='vim'
alias grep='grep --color=auto --exclude-dir={.bzr,CVS,.git,.hg,.svn,.idea,.tox}'
alias pbc='pbcopy'
alias pbp='pbpaste'
alias pn='pnpm'
alias vimdiff='nvim -d'
alias wr='wrangler'
alias cc='claude'
alias oc='opencode'

if [[ $(uname -m) == arm64 && -x /opt/homebrew/bin/brew ]]; then
    alias brew='arch -arm64 /opt/homebrew/bin/brew'
fi
