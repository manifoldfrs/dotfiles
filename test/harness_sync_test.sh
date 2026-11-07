#!/bin/bash
set -euo pipefail

repo_dir=${1:?Pass the dotfiles repository directory}
test_dir=$(mktemp -d)
trap 'rm -rf "$test_dir"' EXIT
failures=0

fail() {
    echo "FAIL: $1"
    failures=$((failures + 1))
}

copy() {
    mkdir -p "$test_dir/$(dirname "$1")"
    cp "$repo_dir/$1" "$test_dir/$1"
}

for file in scripts/harness_sync.sh stow/pi/.pi/agent/mcp.json stow/opencode/.config/opencode/opencode.jsonc stow/codex/.codex/config.toml \
    stow/pi/.pi/agent/extensions/jev-guardrails/shared.ts stow/pi/.pi/agent/extensions/xai-search/xai-shared.ts \
    stow/claude/.claude/mods/jev-checks/hooks/jev-shared.ts stow/claude/.claude/mods/xai-search/hooks/xai-shared.ts; do
    copy "$file"
done
sync="$test_dir/scripts/harness_sync.sh"
pi_mcp="$test_dir/stow/pi/.pi/agent/mcp.json"
codex="$test_dir/stow/codex/.codex/config.toml"
opencode="$test_dir/stow/opencode/.config/opencode/opencode.jsonc"

bash "$sync" --check >/dev/null || fail "the tracked generated files are stale"

# Removing a server from Pi removes it everywhere, and Pi's shared files reach Claude's mods.
jq 'del(.mcpServers.hey) | .mcpServers.docs = {url: "https://docs.test/mcp", headers: {"x-team": "dotfiles"}, exposure: "direct"}' "$pi_mcp" > "$pi_mcp.new"
mv "$pi_mcp.new" "$pi_mcp"
printf '\n// changed in Pi\n' >> "$test_dir/stow/pi/.pi/agent/extensions/jev-guardrails/shared.ts"
bash "$sync" >/dev/null
grep -q '^\[mcp_servers.hey\]' "$codex" && fail "Codex kept a server Pi removed"
grep -q '"hey"' "$opencode" && fail "OpenCode kept a server Pi removed"
grep -q '^\[mcp_servers.docs.http_headers\]' "$codex" || fail "Codex is missing a literal header table"
grep -q '^\[mcp_servers.node_repl\]' "$codex" || fail "Codex lost a ChatGPT app server"
grep -q '^\[mcp_servers.computer-use\]' "$codex" || fail "Codex lost a ChatGPT app server"
grep -q '^\[hooks.state\]' "$codex" || fail "Codex lost unrelated settings"
grep -q '"codemode": false' "$opencode" || fail "OpenCode did not map direct exposure"
tail -1 "$test_dir/stow/claude/.claude/mods/jev-checks/hooks/jev-shared.ts" | grep -q 'changed in Pi' || fail "Claude's jev copy did not follow Pi"
bash "$sync" --check >/dev/null || fail "a fresh sync is not up to date"
# tomllib needs Python 3.11; older Pythons skip only this parse check.
if python3 -c 'import tomllib' 2>/dev/null; then
    python3 -c 'import sys, tomllib; tomllib.load(open(sys.argv[1], "rb"))' "$codex" || fail "generated Codex config is not valid TOML"
fi

# Codex cannot express a secret inside a larger value, so the sync refuses rather than drop it.
jq '.mcpServers.docs.headers = {Authorization: "Bearer ${DOCS_TOKEN}"}' "$pi_mcp" > "$pi_mcp.new"
mv "$pi_mcp.new" "$pi_mcp"
bash "$sync" >/dev/null 2>&1 && fail "the sync accepted a header Codex cannot express"

if [ "$failures" -gt 0 ]; then
    exit 1
fi
echo "PASS: harness sync generates OpenCode, Codex, and Claude copies from Pi and keeps the ChatGPT app's Codex servers"
