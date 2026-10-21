#!/bin/bash
set -euo pipefail

DOTFILES_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_DIR=$(mktemp -d)
trap 'rm -rf "$TEST_DIR"' EXIT
mkdir -p "$TEST_DIR/bin" "$TEST_DIR/home"
export TEST_LOG="$TEST_DIR/calls.jsonl"
printf '%s\n' '#!/bin/bash' \
    '[ "$1" = mcp ] && [ "$2" = add-json ] && [ "$3" = --scope ] && [ "$4" = user ] || exit 1' \
    'printf "%s" "$6" | jq -c --arg name "$5" '\''{name: $name, config: .}'\'' >> "$TEST_LOG"' \
    > "$TEST_DIR/bin/claude"
chmod +x "$TEST_DIR/bin/claude"

HOME="$TEST_DIR/home" PATH="$TEST_DIR/bin:$PATH" bash "$DOTFILES_DIR/mcp_setup.sh" install-claude
jq -s -e '
    length == 6 and
    (map(.name) | sort) == ["Ref", "chrome-devtools", "codex-chrome", "exa", "hey", "jev"] and
    all(.[]; (.config | (has("exposure") | not) and (has("timeout") | not))) and
    all(.[] | select(.config | has("command")); .config.type == "stdio") and
    (map(select(.name == "Ref"))[0].config.headers["x-ref-api-key"] == "${REF_API_KEY}")
' "$TEST_LOG" >/dev/null
[ ! -e "$TEST_DIR/home/.claude.json" ]
jq -s 'map({key: .name, value: .config}) | from_entries | {mcpServers: .}' "$TEST_LOG" > "$TEST_DIR/home/.claude.json"
HOME="$TEST_DIR/home" PATH="$TEST_DIR/bin:$PATH" bash "$DOTFILES_DIR/mcp_setup.sh" install-claude
[ "$(wc -l < "$TEST_LOG" | tr -d ' ')" = 6 ]
jq '.mcpServers.Ref.url = "https://example.invalid/custom"' "$TEST_DIR/home/.claude.json" > "$TEST_DIR/conflict.json"
mv "$TEST_DIR/conflict.json" "$TEST_DIR/home/.claude.json"
if HOME="$TEST_DIR/home" PATH="$TEST_DIR/bin:$PATH" bash "$DOTFILES_DIR/mcp_setup.sh" install-claude > "$TEST_DIR/conflict.log" 2>&1; then
    printf 'FAIL: conflicting registration was accepted\n' >&2
    exit 1
fi
[ "$(wc -l < "$TEST_LOG" | tr -d ' ')" = 6 ]
jq -e '.mcpServers.Ref.url == "https://example.invalid/custom"' "$TEST_DIR/home/.claude.json" >/dev/null
printf 'PASS: Claude MCP import preserves placeholders, skips matching registrations, and refuses conflicts\n'
