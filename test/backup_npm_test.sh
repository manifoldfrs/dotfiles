#!/bin/bash
set -euo pipefail

repo_dir=${1:?Pass the dotfiles repository directory}
test_root=$(mktemp -d)
trap 'rm -rf "$test_root"' EXIT

mkdir -p "$test_root/repo/scripts" "$test_root/repo/stow/bash" "$test_root/repo/stow/rex" \
    "$test_root/repo/stow/cursor" "$test_root/home" "$test_root/bin"
cp "$repo_dir/scripts/backup.sh" "$test_root/repo/scripts/backup.sh"
ln -s "$(command -v node)" "$test_root/bin/node"
manifest="$test_root/repo/npm-global-packages.txt"

run_backup() {
    HOME="$test_root/home" PATH="$test_root/bin:/usr/bin:/bin" \
        bash "$test_root/repo/scripts/backup.sh" >"$test_root/backup.log" 2>&1
}

fail_with_log() {
    printf 'FAIL: %s\n' "$1"
    cat "$test_root/backup.log"
    exit 1
}

cat >"$test_root/bin/npm" <<'NPM'
#!/bin/bash
cat <<'JSON'
{"name":"lib","dependencies":{"@openai/codex":{"version":"0.1.0"},"corepack":{"version":"0.1.0"},"npm":{"version":"11.0.0"},"vercel":{"version":"1.0.0"}}}
JSON
NPM
chmod +x "$test_root/bin/npm"

run_backup || fail_with_log 'backup failed with a working npm'
[[ $(grep -v '^#' "$manifest" | sed '/^$/d') == $'@openai/codex\nvercel' ]] \
    || fail_with_log "npm export wrote: $(cat "$manifest")"

printf '#!/bin/bash\nexit 1\n' >"$test_root/bin/npm"
run_backup || fail_with_log 'backup failed when npm export failed'
grep -qx '@openai/codex' "$manifest" || fail_with_log 'failed npm export replaced the manifest'

printf 'PASS: npm export keeps scoped packages and keeps the manifest when npm fails\n'
