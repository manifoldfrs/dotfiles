# Enable p10k instant prompt. Must stay at the very top of .zshrc —
# anything that writes to stdout before this will break instant prompt.
if [[ -r "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh" ]]; then
  source "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh"
fi

# Ghostty shell integration
if [[ -n $GHOSTTY_RESOURCES_DIR ]]; then
  source "$GHOSTTY_RESOURCES_DIR"/shell-integration/zsh/ghostty-integration
fi

# ── Core zsh options ──────────────────────────────────────────────────────────
autoload -U colors && colors
zstyle ':completion:*' menu select
bindkey -e

# ── History ───────────────────────────────────────────────────────────────────
HISTFILE="$HOME/.zsh_history"
HISTSIZE=50000
SAVEHIST=50000
setopt extended_history
setopt hist_expire_dups_first
setopt hist_ignore_dups
setopt hist_ignore_space
setopt hist_verify
setopt share_history
setopt inc_append_history

# ── Completion: run compinit once per day, not on every shell open ─────────────
autoload -Uz compinit
setopt EXTENDEDGLOB
for dump in ~/.zcompdump(#qN.m+1); do
  compinit && compdump
done
unsetopt EXTENDEDGLOB
compinit -u

# ── Arrow-key prefix history search ───────────────────────────────────────────
autoload -U history-search-end
zle -N history-beginning-search-backward-end history-search-end
zle -N history-beginning-search-forward-end history-search-end
bindkey "^[[A" history-beginning-search-backward-end
bindkey "^[[B" history-beginning-search-forward-end

# ── ctrl-z: toggle process to/from background ─────────────────────────────────
function _fg_bg() {
  if [[ $#BUFFER -eq 0 ]]; then
    fg
  else
    zle push-input
  fi
}
zle -N _fg_bg
bindkey '^Z' _fg_bg

# ── Powerlevel10k ─────────────────────────────────────────────────────────────
if [[ $(arch) == 'arm64' ]]; then
  _brew_prefix=/opt/homebrew
else
  _brew_prefix=/usr/local
fi

for _p10k in \
  "$_brew_prefix/opt/powerlevel10k/powerlevel10k.zsh-theme" \
  "$_brew_prefix/opt/powerlevel10k/share/powerlevel10k/powerlevel10k.zsh-theme"; do
  [[ -f "$_p10k" ]] && { source "$_p10k"; break }
done
unset _p10k _brew_prefix

[[ -f ~/.p10k.zsh ]] && source ~/.p10k.zsh

# ── fzf ───────────────────────────────────────────────────────────────────────
export FZF_DEFAULT_COMMAND='rg --files --hidden --no-ignore-vcs -g "!{node_modules,.git,Desktop,.Trash,Library,Pictures,.rvm}"'
export FZF_CTRL_T_COMMAND="$FZF_DEFAULT_COMMAND"
export FZF_ALT_C_COMMAND="fd --type d --hidden --exclude .git"
export FZF_DEFAULT_OPTS="--color=dark --layout=reverse --margin=1,1 --color=fg:15,bg:-1,hl:1,fg+:#ffffff,bg+:0,hl+:1 --color=info:8,pointer:12,marker:4,spinner:11,header:-1"
export FZF_CTRL_R_OPTS="
  --preview 'echo {}' --preview-window up:3:hidden:wrap
  --bind 'ctrl-/:toggle-preview'
  --bind 'ctrl-y:execute-silent(echo -n {2..} | pbcopy)+abort'
  --color header:italic
  --header 'Press CTRL-Y to copy command into clipboard'"

if [[ -f ~/.fzf.zsh ]]; then
  source ~/.fzf.zsh
  bindkey -M emacs '^F' fzf-history-widget
  bindkey -M viins '^F' fzf-history-widget
fi

# ── Syntax highlighting ────────────────────────────────────────────────────────
for _hl in \
  /opt/homebrew/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh \
  /usr/local/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh; do
  [[ -f "$_hl" ]] && { source "$_hl"; break }
done
unset _hl

# ── Tool initializers ─────────────────────────────────────────────────────────
export PYENV_ROOT="$HOME/.pyenv"
command -v pyenv >/dev/null || export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init - zsh --no-rehash)"

eval "$(rbenv init - zsh --no-rehash)"

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" --no-use
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

[ -f "$HOME/.deno/env" ] && . "$HOME/.deno/env"
[ -s "$HOME/.config/envman/load.sh" ] && source "$HOME/.config/envman/load.sh"

export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"
[ -s "$HOME/.bun/_bun" ] && source "$HOME/.bun/_bun"

export PATH="/Applications/Postgres.app/Contents/Versions/latest/bin:$PATH"
export PATH="$HOME/.opencode/bin:$PATH"

# Force arm64 on Apple Silicon so brew doesn't accidentally run under Rosetta.
[[ $(arch) == 'arm64' ]] && alias brew='arch -arm64 /opt/homebrew/bin/brew'

# ── Local overrides ───────────────────────────────────────────────────────────
[ -f "$HOME/.zshrc.local" ] && source "$HOME/.zshrc.local"
