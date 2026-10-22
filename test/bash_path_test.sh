#!/bin/bash
set -euo pipefail

repo_dir=${1:?Pass the dotfiles repository directory}
test_home=$(mktemp -d)
trap 'rm -rf "$test_home"' EXIT

mkdir -p \
    "$test_home/.local/bin" \
    "$test_home/.opencode/bin" \
    "$test_home/.config/opencode/scripts" \
    "$test_home/.cargo/bin" \
    "$test_home/.deno/bin" \
    "$test_home/.bun/bin" \
    "$test_home/.pyenv/bin" \
    "$test_home/.local/opt/go/bin" \
    "$test_home/go/bin" \
    "$test_home/path-first" \
    "$test_home/path-last" \
    "$test_home/rex-bin"

ln -s "$repo_dir/stow/bash/.config/bash" "$test_home/.config/bash"
ln -s "$repo_dir/stow/bash/.bashrc" "$test_home/.bashrc"

for command_name in herdr pi; do
    printf '#!/bin/bash\nexit 0\n' >"$test_home/path-last/$command_name"
    chmod +x "$test_home/path-last/$command_name"
done

printf '#!/bin/bash\nexit 0\n' >"$test_home/rex-bin/rex"
chmod +x "$test_home/rex-bin/rex"

for startup_file in .config/bash/environment.bash .bashrc .bash_profile; do
    env -i \
        HOME="$test_home" \
        REX_BIN_DIR="$test_home/rex-bin" \
        PATH="$test_home/path-first:/usr/bin:/bin:/usr/sbin:/sbin:$test_home/path-last" \
        /bin/bash --noprofile --norc -c '
            set -euo pipefail
            repo_dir=$1
            startup_file=$2

            source "$repo_dir/stow/bash/$startup_file"
            expected_path=$PATH

            for ((iteration = 1; iteration < 100; iteration++)); do
                source "$repo_dir/stow/bash/$startup_file"
            done

            if [[ $PATH != "$expected_path" ]]; then
                printf "FAIL: %s changes PATH when sourced repeatedly\n" "$startup_file"
                exit 1
            fi

            for directory in \
                "$HOME/path-first" \
                /usr/bin \
                /bin \
                /usr/sbin \
                /sbin \
                "$HOME/path-last" \
                "$HOME/.local/bin" \
                "$HOME/.opencode/bin" \
                "$HOME/.cargo/bin" \
                "$HOME/.deno/bin" \
                "$HOME/.bun/bin" \
                "$HOME/.pyenv/bin" \
                "$HOME/.local/opt/go/bin" \
                "$HOME/go/bin" \
                "$REX_BIN_DIR"; do
                count=$(printf "%s\n" "$PATH" | /usr/bin/tr ":" "\n" | /usr/bin/grep -Fxc "$directory" || true)
                if [[ $count -ne 1 ]]; then
                    printf "FAIL: %s contains %s copies of PATH entry %s\n" "$startup_file" "$count" "$directory"
                    exit 1
                fi
            done

            duplicates=$(printf "%s\n" "$PATH" | /usr/bin/tr ":" "\n" | /usr/bin/sort | /usr/bin/uniq -d)
            if [[ -n $duplicates ]]; then
                printf "FAIL: %s created duplicate PATH entries:\n%s\n" "$startup_file" "$duplicates"
                exit 1
            fi

            for command_name in awk bash env git grep herdr pi rex rm sed; do
                command -v "$command_name" >/dev/null || {
                    printf "FAIL: %s lost command %s\n" "$startup_file" "$command_name"
                    exit 1
                }
            done
        ' bash "$repo_dir" "$startup_file"
done

# mise prints the current PATH into its activation script, so a cached copy
# would restore a stale PATH in every later shell.
mkdir -p "$test_home/mise-bin"
printf '%s\n' '#!/bin/bash' '[ "$1" = activate ] && printf "export PATH=%q\n" "$PATH"' >"$test_home/mise-bin/mise"
chmod +x "$test_home/mise-bin/mise"
for rex_bin_dir in "" "$test_home/rex-bin"; do
    found=$(env -i \
        HOME="$test_home" \
        XDG_CACHE_HOME="$test_home/.cache" \
        REX_BIN_DIR="$rex_bin_dir" \
        PATH="$test_home/mise-bin:/usr/bin:/bin:/usr/sbin:/sbin" \
        /bin/bash --rcfile "$repo_dir/stow/bash/.bashrc" -i -c 'command -v rex || true' 2>/dev/null)
done
if [[ $found != "$test_home/rex-bin/rex" ]]; then
    printf 'FAIL: interactive Bash restored a stale PATH from cached mise activation\n'
    exit 1
fi

printf 'PASS: repeated Bash startup preserves PATH and required commands\n'
