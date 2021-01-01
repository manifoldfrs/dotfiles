[ -f ~/fubectl.source ] && source ~/fubectl.source

# configure pants ulimit
ulimit -n 10000

# aliases
alias pip="pip3"

alias dad_joke='curl https://icanhazdadjoke.com'

if [[ -f ~/.git-completion.bash ]]; then
    source ~/.git-completion.bash

    # optional protip: you can also set nice short-commands that will still get auto-completion if you want to do things like `g p origin branchname`
    __git_complete g __git_main
    __git_complete gc _git_commit
    __git_complete gl _git_log
    __git_complete gchk _git_checkout
    __git_complete gm _git_merge
    __git_complete pl _git_pull
    __git_complete p _git_push
fi

if command -v pyenv 1>/dev/null 2>&1; then
  eval "$(pyenv init -)"
fi

kattach(){
    echo "Usage: kattach POD-SEARCH-STRING (note: must have stdin: true; tty: true set on deployment)"
    pod=$(kubectl get pods | cut -f 1 -d ' ' |grep $1)
    kubectl attach $pod -c $(echo "${pod}" | gsed -r 's/-([^-]*)-([^-]*)$//') -i -t
}

# starship
eval "$(starship init bash)"

export PYENV_ROOT="$HOME/.pyenv"
export PATH="$PYENV_ROOT/bin:$PATH"

# Codi
# Usage: codi [filetype] [filename]
codi() {
  local syntax="${1:-python}"
  shift
  vim -c \
    "let g:startify_disable_at_vimenter = 1 |\
    set bt=nofile ls=0 noru nonu nornu |\
    hi ColorColumn ctermbg=NONE |\
    hi VertSplit ctermbg=NONE |\
    hi NonText ctermfg=0 |\
    Codi $syntax" "$@"
}

eval "$(direnv hook bash)"
