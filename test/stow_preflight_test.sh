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
