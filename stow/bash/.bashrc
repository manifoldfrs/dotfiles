#!/bin/bash

[[ -r "$HOME/.config/bash/environment.bash" ]] && source "$HOME/.config/bash/environment.bash"
[[ -r "$HOME/.config/bash/local.bash" ]] && source "$HOME/.config/bash/local.bash"

[[ $- != *i* ]] && return

shopt -s checkwinsize globstar histappend
HISTCONTROL=ignoreboth:erasedups
HISTSIZE=50000
HISTFILESIZE=50000

if [[ -n ${HOMEBREW_PREFIX:-} && -r "$HOMEBREW_PREFIX/etc/profile.d/bash_completion.sh" ]]; then
    source "$HOMEBREW_PREFIX/etc/profile.d/bash_completion.sh"
fi

if [[ -r "$HOME/.local/share/blesh/ble.sh" ]]; then
    source -- "$HOME/.local/share/blesh/ble.sh" --noattach
fi

[[ -r "$HOME/.config/bash/aliases.bash" ]] && source "$HOME/.config/bash/aliases.bash"
[[ -r "$HOME/.config/bash/functions.bash" ]] && source "$HOME/.config/bash/functions.bash"

if command -v mise &> /dev/null; then
    eval "$(mise activate bash)"
fi

if command -v zoxide &> /dev/null; then
    eval "$(zoxide init bash)"
fi

if command -v starship &> /dev/null; then
    eval "$(starship init bash)"
fi

if [[ ${BLE_VERSION:-} ]]; then
    ble-attach
fi
