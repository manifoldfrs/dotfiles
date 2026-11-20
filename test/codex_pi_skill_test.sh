#!/bin/bash
set -euo pipefail

bridge="$1/stow/codex/.codex/skills/pi-skill/scripts/pi-skill"
test_dir=$(mktemp -d)
trap 'rm -rf "$test_dir"' EXIT
export CODEX_HOME="$test_dir/codex"
export PI_TEST_CALL="$test_dir/call"
export PI_TEST_STATE="$test_dir/pi state"
mkdir -p "$CODEX_HOME" "$PI_TEST_STATE" "$test_dir/project"

cat >"$test_dir/pi pinned" <<'PI'
#!/bin/bash
set -euo pipefail
[[ $PI_CODING_AGENT_DIR -ef $PI_TEST_STATE ]]

case "$1" in
    --offline)
        [[ "$*" == "--offline --mode rpc --no-session" ]]
        input=$(cat)
        if [[ ${PI_TEST_FAIL_CATALOG:-} == yes ]]; then
            exit 1
        fi
        if [[ $input == *get_available_models* ]]; then
            printf '%s\n' '{"type":"response","id":"pi-worker-catalog","success":true,"data":{"models":[{"provider":"provider","id":"model"}]}}'
        else
            printf '%s\n' '{"type":"response","id":"pi-worker-catalog","success":true,"data":{"commands":[{"name":"pistack-status","source":"extension"},{"name":"skill:council","description":"Council review","source":"skill"},{"name":"skill:pistack-interrogate","description":"Adversarial review","source":"skill"}]}}'
        fi
        ;;
    --print)
        [[ $2 == --mode && $3 == json && $4 == --no-session ]]
        if read -r unused; then
            exit 98
        fi
        printf '%s\n' "$PWD" "${@:5}" >"$PI_TEST_CALL"
        case "${PI_TEST_RESULT:-ok}" in
            error) printf '%s\n' '{"type":"message_end","message":{"role":"assistant","stopReason":"error","errorMessage":"provider rejected request"}}' ;;
            empty) printf '%s\n' 'extension diagnostic, not a final answer' ;;
            wait)
                trap '' TERM
                sleep 30 &
                printf '%s %s\n' "$$" "$!" >"$PI_TEST_CALL.pids"
                wait
                ;;
            *) printf '%s\n' '{"type":"message_end","message":{"role":"assistant","stopReason":"stop","provider":"provider","model":"model","content":[{"type":"text","text":"review result"}]}}' ;;
        esac
        ;;
    *) exit 99 ;;
esac
PI
chmod +x "$test_dir/pi pinned"

configure() {
    jq -n --arg executable "$test_dir/pi pinned" --arg agentDir "$PI_TEST_STATE" --argjson timeoutSeconds "$1" \
        '{executable:$executable,agentDir:$agentDir,timeoutSeconds:$timeoutSeconds}' >"$CODEX_HOME/pi-worker.json"
}

cd "$test_dir/project"
if bash "$bridge" list >"$test_dir/output" 2>&1; then
    exit 1
fi
grep -q 'create .*pi-worker.json' "$test_dir/output"
configure 12
[[ $(bash "$bridge" list) == $'council\tCouncil review\npistack-interrogate\tAdversarial review' ]]
if bash "$bridge" run pistack-status review >"$test_dir/output" 2>&1; then
    exit 1
fi
grep -q 'Pi did not load skill pistack-status' "$test_dir/output"
if bash "$bridge" model provider/missing review >"$test_dir/output" 2>&1; then
    exit 1
fi
grep -q 'no fallback was attempted' "$test_dir/output"
[[ ! -e $PI_TEST_CALL ]]
if PI_TEST_FAIL_CATALOG=yes bash "$bridge" list >"$test_dir/output" 2>&1; then
    exit 1
fi
grep -q 'did not return its get_commands catalog' "$test_dir/output"

brief=$'Review only.\nKeep $(literal) and "quotes".'
[[ $(bash "$bridge" run council "$brief" <<<"do not forward stdin") == 'review result' ]]
[[ $(cat "$PI_TEST_CALL") == "$PWD"$'\n'"/skill:council $brief" ]]
[[ $(bash "$bridge" model provider/model "$brief") == 'review result' ]]
[[ $(cat "$PI_TEST_CALL") == "$PWD"$'\n--model\nprovider/model\nTask:\n'"$brief" ]]

if PI_TEST_RESULT=error bash "$bridge" run council "$brief" >"$test_dir/output" 2>&1; then
    exit 1
fi
grep -q 'provider rejected request' "$test_dir/output"
if PI_TEST_RESULT=empty bash "$bridge" run council "$brief" >"$test_dir/output" 2>&1; then
    exit 1
fi
grep -q 'without a final answer' "$test_dir/output"

assert_group_stopped() {
    local pid state
    for pid in $(cat "$PI_TEST_CALL.pids"); do
        state=$(ps -p "$pid" -o stat= 2>/dev/null || true)
        [[ -z $state || $state == *Z* ]]
    done
}

PI_TEST_RESULT=wait bash "$bridge" run council "$brief" >"$test_dir/output" 2>"$test_dir/stderr" &
launcher=$!
for ((i=0; i<100; i++)); do
    [[ ! -s $PI_TEST_CALL.pids ]] || break
    sleep 0.05
done
[[ -s $PI_TEST_CALL.pids ]]
job=$(awk '/^pi-skill: job / {print $3}' "$test_dir/stderr")
[[ $(bash "$bridge" cancel "$job") == 'Cancellation requested' ]]
status=0
wait "$launcher" || status=$?
[[ $status == 130 ]]
assert_group_stopped

configure 1
rm "$PI_TEST_CALL.pids"
status=0
PI_TEST_RESULT=wait bash "$bridge" run council "$brief" >"$test_dir/output" 2>"$test_dir/stderr" || status=$?
[[ $status == 124 ]]
grep -q 'timed out after 1s' "$test_dir/stderr"
assert_group_stopped

printf 'PASS: Codex Pi worker pins its executable and state, checks exact routes and JSON results, and stops process groups on cancel or deadline\n'
