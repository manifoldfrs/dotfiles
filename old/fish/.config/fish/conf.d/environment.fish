set --global --export PYENV_ROOT "$HOME/.pyenv"
set --global --export NVM_DIR "$HOME/.nvm"
set --global --export BUN_INSTALL "$HOME/.bun"

# Keep fzf behavior from the previous shell while using the Macchiato palette.
set --global --export FZF_DEFAULT_COMMAND 'rg --files --hidden --no-ignore-vcs -g "!{node_modules,.git,Desktop,.Trash,Library,Pictures,.rvm}"'
set --global --export FZF_CTRL_T_COMMAND "$FZF_DEFAULT_COMMAND"
set --global --export FZF_ALT_C_COMMAND 'fd --type d --hidden --exclude .git'
set --global --export FZF_DEFAULT_OPTS '--layout=reverse --margin=1,1 --color=fg:#cad3f5,bg:#24273a,hl:#8aadf4,fg+:#cad3f5,bg+:#363a4f,hl+:#8aadf4,info:#8087a2,pointer:#c6a0f6,marker:#a6da95,spinner:#eed49f,header:#8087a2'
set --global --export FZF_CTRL_R_OPTS '--preview "echo {}" --preview-window up:3:hidden:wrap --bind "ctrl-/:toggle-preview" --bind "ctrl-y:execute-silent(echo -n {2..} | pbcopy)+abort" --color header:italic --header "Press CTRL-Y to copy command into clipboard"'
