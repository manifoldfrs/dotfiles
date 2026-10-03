#!/bin/bash
set -euo pipefail

repo_dir=${1:?Pass the dotfiles repository directory}
test_dir=$(mktemp -d "${TMPDIR:-/tmp}/opencode-relaunch-test.XXXXXX")
trap 'rm -rf "$test_dir"' EXIT

cat >"$test_dir/opencode" <<'BASH'
#!/bin/bash
printf '%s\n' "$*" >>"$TEST_LOG"
case "${1:-}" in
    upgrade) exit "${UPGRADE_STATUS:-0}" ;;
    service) exit "${RESTART_STATUS:-0}" ;;
esac
if [[ -n ${OPENCODE_RELAUNCH_FILE:-} && $TEST_ACTION != none && ! -f $TEST_DONE ]]; then
    printf '%s\nses_test123\n' "$TEST_ACTION" >"$OPENCODE_RELAUNCH_FILE"
    touch "$TEST_DONE"
    printf '%s\n' "$OPENCODE_RELAUNCH_FILE" >"$TEST_FILE"
fi
exit "${TUI_STATUS:-0}"
BASH
chmod +x "$test_dir/opencode"
export PATH="$test_dir:$PATH"
export TEST_LOG="$test_dir/log" TEST_DONE="$test_dir/done" TEST_FILE="$test_dir/file"
source "$repo_dir/stow/bash/.config/bash/functions.bash"

run_case() {
    rm -f "$TEST_LOG" "$TEST_DONE" "$TEST_FILE"
    local status=0
    opencode "$@" || status=$?
    if [[ -f $TEST_FILE && -e $(<"$TEST_FILE") ]]; then
        printf 'FAIL: relaunch request was not cleaned up\n' >&2
        exit 1
    fi
    return "$status"
}

export TEST_ACTION=restart
run_case '/project with spaces' --auto --session ses_original --prompt 'first prompt'
expected=$(printf '%s\n' '/project with spaces --auto --session ses_original --prompt first prompt' 'service restart' '/project with spaces --auto --session ses_test123')
[[ $(<"$TEST_LOG") == "$expected" ]]

export TEST_ACTION=update
run_case
expected=$(printf '\nupgrade\nservice restart\n--session ses_test123')
[[ $(<"$TEST_LOG") == "$expected" ]]

export UPGRADE_STATUS=1
run_case
expected=$(printf '\nupgrade\n--session ses_test123')
[[ $(<"$TEST_LOG") == "$expected" ]]
unset UPGRADE_STATUS

export RESTART_STATUS=1
if run_case; then
    printf 'FAIL: shared server restart failure was ignored\n' >&2
    exit 1
fi
expected=$(printf '\nupgrade\nservice restart')
[[ $(<"$TEST_LOG") == "$expected" ]]
unset RESTART_STATUS

for arg in --standalone --server=http://example.test mini run; do
    run_case "$arg"
    [[ $(<"$TEST_LOG") == "$arg" ]]
done

export TEST_ACTION=invalid
if run_case; then
    printf 'FAIL: invalid relaunch action was accepted\n' >&2
    exit 1
fi
[[ $(wc -l <"$TEST_LOG") -eq 1 ]]

export TUI_STATUS=7 TEST_ACTION=none
status=0
run_case || status=$?
[[ $status -eq 7 ]]

printf 'PASS: OpenCode relaunch preserves sessions, sequences upgrades and shared server restarts, and handles failures\n'
