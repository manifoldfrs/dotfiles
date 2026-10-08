#!/bin/bash
set -euo pipefail

repo_dir=${1:?Pass the dotfiles repository directory}
test_root=$(mktemp -d)
trap 'rm -rf "$test_root"' EXIT

mkdir -p "$test_root/repo/scripts" "$test_root/repo/stow" "$test_root/home" "$test_root/bin"
cp "$repo_dir/scripts/stow.sh" "$test_root/repo/scripts/stow.sh"

cat >"$test_root/repo/scripts/validate-dotfiles.sh" <<'VALIDATOR'
#!/bin/bash
touch "$HOME/validator-called"
exit 42
VALIDATOR
chmod +x "$test_root/repo/scripts/validate-dotfiles.sh"

cat >"$test_root/bin/stow" <<'STOW'
#!/bin/bash
for argument in "$@"; do
    if [[ $argument == -R ]]; then
        touch "$HOME/stow-mutated-home"
    fi
done
touch "$HOME/stow-invoked"
STOW
chmod +x "$test_root/bin/stow"

if HOME="$test_root/home" PATH="$test_root/bin:/usr/bin:/bin:/usr/sbin:/sbin" \
    bash "$test_root/repo/scripts/stow.sh" apply >/dev/null 2>&1; then
    printf 'FAIL: Stow apply continued after preflight failure\n'
    exit 1
fi

if [[ ! -e $test_root/home/validator-called ]]; then
    printf 'FAIL: Stow apply did not run the preflight validator\n'
    exit 1
fi

if [[ -e $test_root/home/stow-mutated-home ]]; then
    printf 'FAIL: Stow apply invoked Stow after preflight failure\n'
    exit 1
fi

unexpected_path=$(find "$test_root/home" -mindepth 1 ! -name validator-called -print -quit)
if [[ -n $unexpected_path ]]; then
    printf 'FAIL: Stow apply mutated HOME before preflight passed: %s\n' "$unexpected_path"
    exit 1
fi

cat >"$test_root/repo/scripts/validate-dotfiles.sh" <<'VALIDATOR'
#!/bin/bash
exit 0
VALIDATOR
chmod +x "$test_root/repo/scripts/validate-dotfiles.sh"

preview_home="$test_root/preview-home"
mkdir -p "$preview_home"
HOME="$preview_home" PATH="$test_root/bin:/usr/bin:/bin:/usr/sbin:/sbin" \
    bash "$test_root/repo/scripts/stow.sh" >/dev/null 2>&1

if [[ ! -e $preview_home/stow-invoked ]]; then
    printf 'FAIL: Stow without an action did not produce a preview\n'
    exit 1
fi

if [[ -e $preview_home/stow-mutated-home ]]; then
    printf 'FAIL: Stow without an explicit apply action mutated HOME\n'
    exit 1
fi

printf 'PASS: Stow requires explicit apply and fails before live mutation when preflight fails\n'

real_bin="$test_root/real-bin"
mkdir -p "$real_bin"
ln -s "$(command -v stow)" "$real_bin/stow"
apply_log="$test_root/apply.log"

apply_into() {
    HOME="$1" PATH="$real_bin:/usr/bin:/bin:/usr/sbin:/sbin" \
        bash "$repo_dir/scripts/stow.sh" apply >"$apply_log" 2>&1
}

fail_with_log() {
    printf 'FAIL: %s\n' "$1"
    cat "$apply_log"
    exit 1
}

assert_bash5_link() {
    local link="$1/.local/bin/bash"
    local major

    [[ -L $link ]] || fail_with_log "$link is not a link"
    major=$("$link" -c 'echo "${BASH_VERSINFO[0]}"') || fail_with_log "$link does not run"
    (( major >= 4 )) || fail_with_log "$link runs Bash $major, not Bash 4+"
}

fresh_home="$test_root/fresh-home"
mkdir -p "$fresh_home"
apply_into "$fresh_home" || fail_with_log 'apply with a minimal PATH failed'
assert_bash5_link "$fresh_home"
first_target=$(readlink "$fresh_home/.local/bin/bash")
apply_into "$fresh_home" || fail_with_log 'repeat apply failed'
[[ $(readlink "$fresh_home/.local/bin/bash") == "$first_target" ]] \
    || fail_with_log 'repeat apply changed the Bash link'

dangling_home="$test_root/dangling-home"
mkdir -p "$dangling_home/.local/bin"
ln -s "$test_root/missing/bash" "$dangling_home/.local/bin/bash"
apply_into "$dangling_home" || fail_with_log 'apply over a dangling Bash link failed'
assert_bash5_link "$dangling_home"

file_home="$test_root/file-home"
mkdir -p "$file_home/.local/bin"
printf 'keep me\n' >"$file_home/.local/bin/bash"
if apply_into "$file_home"; then
    fail_with_log 'apply replaced a regular file at ~/.local/bin/bash'
fi
[[ $(cat "$file_home/.local/bin/bash") == 'keep me' ]] || fail_with_log 'apply changed the regular Bash file'
[[ ! -L $file_home/.bashrc ]] || fail_with_log 'apply stowed packages after refusing the Bash file'

printf 'PASS: Stow links ~/.local/bin/bash to Bash 4+ and refuses to replace a regular file\n'

if [[ $(uname -s) == Darwin ]]; then
    [[ -L $fresh_home/.codex/config.toml ]] || fail_with_log 'macOS apply did not link the Codex config'
    printf 'PASS: macOS links the tracked Codex config\n'
    exit 0
fi

server_home="$test_root/server-home"
mkdir -p "$server_home/.codex"
printf 'model = "server"\n' >"$server_home/.codex/config.toml"
apply_into "$server_home" || fail_with_log 'apply with a server Codex config failed'
apply_into "$server_home" || fail_with_log 'repeat apply with a server Codex config failed'
[[ ! -L $server_home/.codex/config.toml ]] || fail_with_log 'apply linked the macOS Codex config'
[[ $(cat "$server_home/.codex/config.toml") == 'model = "server"' ]] \
    || fail_with_log 'apply changed the server Codex config'
! compgen -G "$server_home/.codex/config.toml.backup.*" >/dev/null \
    || fail_with_log 'apply backed up the server Codex config'
[[ -L $server_home/.codex/AGENTS.md && -L $server_home/.codex/hooks.json ]] \
    || fail_with_log 'apply skipped Codex AGENTS.md or hooks'

migrated_home="$test_root/migrated-home"
mkdir -p "$migrated_home/.codex"
ln -s "$repo_dir/stow/codex/.codex/config.toml" "$migrated_home/.codex/config.toml"
apply_into "$migrated_home" || fail_with_log 'apply over an old Codex config link failed'
[[ ! -L $migrated_home/.codex/config.toml ]] || fail_with_log 'apply kept the old Codex config link'

printf 'PASS: Linux keeps its own Codex config and still links Codex AGENTS.md and hooks\n'
