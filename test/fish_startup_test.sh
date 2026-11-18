#!/bin/bash
set -euo pipefail

repo=${1:?Pass the dotfiles repository directory}
test_home=$(mktemp -d)
trap 'rm -rf "$test_home"' EXIT
mkdir -p "$test_home/.config" "$test_home/bin" "$test_home/.local/share/pnpm/bin" "$test_home/.bun/bin"
ln -s "$repo/stow/bash/.config/bash" "$test_home/.config/bash"
ln -s "$repo/stow/bash/.config/fish" "$test_home/.config/fish"
ln -s "$repo/stow/bash/.bashrc" "$test_home/.bashrc"
ln -s "$repo/stow/bash/.bash_profile" "$test_home/.bash_profile"
ln -s "$(command -v fish)" "$test_home/bin/fish"

for name in fzf atuin zoxide; do
    if command -v "$name" >/dev/null; then
        ln -s "$(command -v "$name")" "$test_home/bin/$name"
    fi
done

printf '#!/bin/bash\nprintf "pi <%%s>\\n" "$@"\n' > "$test_home/.local/share/pnpm/bin/pi"
printf '#!/bin/bash\nexit 99\n' > "$test_home/.bun/bin/pi"
chmod +x "$test_home/.local/share/pnpm/bin/pi" "$test_home/.bun/bin/pi"
export HOME="$test_home" XDG_CONFIG_HOME="$test_home/.config" XDG_DATA_HOME="$test_home/.local/share"
export PATH="$test_home/bin:/usr/bin:/bin:/usr/sbin:/sbin" TERM=xterm
unset PNPM_HOME ATUIN_SESSION
fish --no-config -c 'set -U fish_user_paths "$HOME/.bun/bin"'

fish --no-execute "$test_home/.config/fish/config.fish"
result=$(printf '%s\n' 'echo "fish=$version"' 'functions -q pi; or exit 1' 'pi "one argument"' 'exit' | /bin/bash --login -i 2>&1)
grep -q '^fish=[0-9]' <<< "$result"
grep -Fxq 'pi <one argument>' <<< "$result"

result=$(/bin/bash --login -ic 'printf "bash=%s\n" "$BASH_VERSION"' 2>/dev/null)
grep -q '^bash=[0-9]' <<< "$result"
result=$(printf '%s\n' 'echo "bash=$BASH_VERSION"' 'exit' | DOTFILES_KEEP_BASH=1 /bin/bash --login -i 2>&1)
grep -q '^bash=[0-9]' <<< "$result"

fish -ic '
    test "$fish_autosuggestion_enabled" = 1; or exit 1
    if command -q fzf; and command -q atuin
        bind ctrl-r | string match -q "*__dotfiles_history*"; or exit 1
        bind ctrl-t >/dev/null; or exit 1
    end
    if command -q zoxide
        functions -q z; or exit 1
    end
'
git init -q -b prompt-check "$test_home/project"
git -C "$test_home/project" -c user.name=Test -c user.email=test@example.invalid commit -q --allow-empty -m 'Prompt test'
(
    cd "$test_home/project"
    export TERM=dumb
    success=$(fish -c 'true; fish_prompt')
    failure=$(fish -c 'false; fish_prompt')
    [[ "$success" == ' ~/project  prompt-check  ' ]]
    [[ "$failure" == " 1 $success" ]]
    git checkout -q --detach
    short_commit=$(git rev-parse --short HEAD)
    detached=$(fish -c 'true; fish_prompt')
    [[ "$detached" == " ~/project  $short_commit  " ]]
    clock=$(fish -c 'fish_right_prompt')
    [[ "$clock" =~ ^[0-9]{2}:[0-9]{2}:[0-9]{2}$ ]]
)
printf 'PASS: Fish login, prompt, interactive bindings, Pi launcher, and Bash commands\n'
