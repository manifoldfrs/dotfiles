status is-interactive; or return

set -g fish_greeting
set -g fish_autosuggestion_enabled 1

if set -q PNPM_HOME
    fish_add_path --path --move "$PNPM_HOME/bin"
end

if command -q fzf
    fzf --fish | source
end

if command -q atuin
    if command -q fzf
        function __dotfiles_history
            set -l match (atuin history list --cmd-only --print0 | fzf --read0 --print0 --tac --scheme=history \
                --query=(commandline) --bind 'ctrl-d:reload(atuin history list --cmd-only --print0 --cwd)' | string split0)
            if set -q match[1]
                commandline -r -- "$match[1]"
            end
        end
        atuin init fish --disable-ctrl-r --disable-up-arrow | source
        bind ctrl-r __dotfiles_history
        bind ctrl-f __dotfiles_history
    else
        atuin init fish --disable-up-arrow | source
    end
end

if command -q zoxide
    zoxide init fish | source
end

for name in claude rexbox
    function $name --inherit-variable name
        command bash -c 'source "$HOME/.config/bash/functions.bash"; "$@"' bash $name $argv
    end
end

abbr --add pn pnpm
abbr --add cc claude
abbr --add ccc claude --continue
