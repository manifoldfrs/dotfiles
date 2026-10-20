#!/bin/bash
set -euo pipefail

DOTFILES_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_DIR=$(mktemp -d)
trap 'rm -rf "$TEST_DIR"' EXIT
export HOME="$TEST_DIR/home"
export TEST_DIR
mkdir -p "$TEST_DIR/bin" "$HOME/.config/bash"
ln -s "$DOTFILES_DIR/stow/bash/.config/bash/functions.bash" "$HOME/.config/bash/functions.bash"
ln -s "$DOTFILES_DIR/stow/bin/.local/bin/claude-proxy" "$TEST_DIR/bin/claude-proxy"
export PATH="$TEST_DIR/bin:$PATH"

cat > "$TEST_DIR/bin/openssl" <<'BASH'
#!/bin/bash
printf '%064d\n' 0
BASH
cat > "$TEST_DIR/bin/curl" <<'BASH'
#!/bin/bash
IFS= read -r header
[[ $header == 'header = "Authorization: Bearer '* ]] || exit 1
[ "${FAIL_PROXY:-0}" = 0 ] || exit 22
printf '%s\n' '{"data":[{"id":"gpt-test","owned_by":"openai"},{"id":"muse-test","owned_by":"meta"}]}'
BASH
cat > "$TEST_DIR/bin/cliproxyapi" <<'BASH'
#!/bin/bash
printf '%s\n' "$PWD" "$@" > "$TEST_DIR/proxy-args"
BASH
cat > "$TEST_DIR/bin/claude" <<'BASH'
#!/bin/bash
jq -n --arg url "$ANTHROPIC_BASE_URL" --arg token "$ANTHROPIC_AUTH_TOKEN" \
    --arg api_key "$ANTHROPIC_API_KEY" --arg subagent "$CLAUDE_CODE_SUBAGENT_MODEL" \
    --arg opus "$ANTHROPIC_DEFAULT_OPUS_MODEL" --arg sonnet "$ANTHROPIC_DEFAULT_SONNET_MODEL" \
    --arg haiku "$ANTHROPIC_DEFAULT_HAIKU_MODEL" --arg fable "$ANTHROPIC_DEFAULT_FABLE_MODEL" \
    --arg search "$ENABLE_TOOL_SEARCH" --args \
    '{url:$url,token:$token,api_key:$api_key,subagent:$subagent,opus:$opus,sonnet:$sonnet,haiku:$haiku,fable:$fable,search:$search,args:$ARGS.positional}' -- "$@" > "$TEST_DIR/claude-call.json"
if [ "${TEST_RELAUNCH:-0}" = 1 ] && [ ! -e "$TEST_DIR/relaunched" ]; then
    touch "$TEST_DIR/relaunched"
    printf 'test-session\n' > "$CLAUDE_RELAUNCH_FILE"
fi
exit "${CLAUDE_TEST_STATUS:-0}"
BASH
chmod +x "$TEST_DIR/bin/"*

if claude-proxy run codex > /dev/null 2>&1; then
    echo 'FAIL: unconfigured launch succeeded' >&2
    exit 1
fi
claude-proxy init
config="$HOME/.config/claude-proxy/config.yaml"
find "$config" -prune -perm 0600 | grep -q .
find "$HOME/.config/claude-proxy/auth" -prune -perm 0700 | grep -q .
jq -e '.server == {host:"127.0.0.1",port:8317} and .management["disable-control-panel"] == true and .observability.logs["request-log"] == false' "$config" > /dev/null
before=$(cksum "$config")
claude-proxy init
[ "$before" = "$(cksum "$config")" ]

claude-proxy serve
[ "$(head -1 "$TEST_DIR/proxy-args")" = "$HOME/.config/claude-proxy" ]
claude-proxy login codex
grep -q -- '-codex-login' "$TEST_DIR/proxy-args"
claude-proxy login muse
grep -q -- '-meta-login' "$TEST_DIR/proxy-args"
claude-proxy models | grep -q muse-test
claude-proxy select codex gpt-test
claude-proxy select muse muse-test
if claude-proxy select codex missing-model > /dev/null 2>&1; then
    echo 'FAIL: unavailable model accepted' >&2
    exit 1
fi
if claude-proxy select codex muse-test > /dev/null 2>&1; then
    echo 'FAIL: model from the wrong provider accepted' >&2
    exit 1
fi
[ "$(<"$HOME/.config/claude-proxy/codex-model")" = gpt-test ]

source "$HOME/.config/bash/functions.bash"
export ANTHROPIC_BASE_URL=https://original.invalid
export ANTHROPIC_API_KEY=original-key
claudex --continue
jq -e '.url == "http://127.0.0.1:8317" and .api_key == "" and .subagent == "gpt-test" and .opus == "gpt-test" and .sonnet == "gpt-test" and .haiku == "gpt-test" and .fable == "gpt-test" and .search == "false" and .args == ["--settings","{\"env\":{\"ENABLE_TOOL_SEARCH\":\"false\"}}","--model","gpt-test","--continue"]' "$TEST_DIR/claude-call.json" > /dev/null
[ "$ANTHROPIC_BASE_URL" = https://original.invalid ]
[ "$ANTHROPIC_API_KEY" = original-key ]
claude-muse 'hello world'
jq -e '.subagent == "muse-test" and .args == ["--settings","{\"env\":{\"ENABLE_TOOL_SEARCH\":\"false\"}}","--model","muse-test","hello world"]' "$TEST_DIR/claude-call.json" > /dev/null

TEST_RELAUNCH=1 claudex
jq -e '.subagent == "gpt-test" and .args == ["--settings","{\"env\":{\"ENABLE_TOOL_SEARCH\":\"false\"}}","--resume","test-session"]' "$TEST_DIR/claude-call.json" > /dev/null

rm "$TEST_DIR/claude-call.json"
if FAIL_PROXY=1 claudex > /dev/null 2>&1; then
    echo 'FAIL: unavailable proxy launched Claude' >&2
    exit 1
fi
[ ! -e "$TEST_DIR/claude-call.json" ]
status=0
CLAUDE_TEST_STATUS=7 claudex > /dev/null 2>&1 || status=$?
[ "$status" -eq 7 ]
printf 'PASS: subscription launchers isolate credentials, preserve arguments, reject missing models, and fail closed without a proxy\n'
