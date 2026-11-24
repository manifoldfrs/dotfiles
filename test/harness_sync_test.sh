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

for file in scripts/harness_sync.sh mcp/shared/servers.json stow/codex/.codex/config.toml \
    mcp/shared/jev.ts stow/claude/.claude/mods/jev-checks/hooks/jev-shared.ts; do
    copy "$file"
done
sync="$test_dir/scripts/harness_sync.sh"
shared_mcp="$test_dir/mcp/shared/servers.json"
codex="$test_dir/stow/codex/.codex/config.toml"

bash "$sync" --check >/dev/null || fail "the tracked generated files are stale"
jev_args=$(awk '/^\[/{section=$0} section=="[mcp_servers.jev]" && /^args = / {print}' "$codex")
[[ "$jev_args" =~ @jkudish/jev-mcp@[0-9]+\.[0-9]+\.[0-9]+ ]] || fail "Codex Jev is missing its version pin"

cat >> "$codex" <<'TOML'

[mcp_servers.jev.tools.fixture]
approval_mode = "approve"

[mcp_servers.superlogical.tools.fixture]
approval_mode = "approve"

[mcp_servers.node_repl]
command = "node"

[mcp_servers.computer-use]
enabled = false

[hooks.state]
TOML

# Removing a shared server removes its generated copies.
jq 'del(.mcpServers.superlogical) | .mcpServers.jev.args = ["-y", "@jkudish/jev-mcp@fixture"] | .mcpServers.docs = {url: "https://docs.test/mcp", headers: {"x-team": "dotfiles"}, exposure: "direct"}' "$shared_mcp" > "$shared_mcp.new"
mv "$shared_mcp.new" "$shared_mcp"
printf '\n// changed in shared Jev\n' >> "$test_dir/mcp/shared/jev.ts"
bash "$sync" >/dev/null
grep -Eq '^\[mcp_servers\.superlogical(\.|\])' "$codex" && fail "Codex kept a removed shared server"
grep -A1 -F '[mcp_servers.jev.tools.fixture]' "$codex" | grep -qx 'approval_mode = "approve"' || fail "Codex lost a tool approval"
grep -q '^\[mcp_servers.docs.http_headers\]' "$codex" || fail "Codex is missing a literal header table"
awk '/^\[/{section=$0} section=="[mcp_servers.docs]" && $0=="omit_tools_from = [\"deferred\"]" {found=1} END {exit !found}' "$codex" \
    || fail "Codex did not keep the docs server direct and callable from Code Mode"
awk '/^\[/{section=$0} section=="[mcp_servers.jev]" && $0=="omit_tools_from = [\"direct\",\"deferred\"]" {found=1} END {exit !found}' "$codex" \
    || fail "Codex did not make Jev available only through Code Mode"
awk -v args="$jev_args" '
    /^\[/ {section=$0}
    section=="[mcp_servers.jev]" && /^\[/ {count++}
    section=="[mcp_servers.jev]" && $0==args {preserved=1}
    END {exit !(count == 1 && preserved)}
' "$codex" \
    || fail "The shared Jev server overrode or duplicated the Codex-owned registration"
grep -q '^\[mcp_servers.node_repl\]' "$codex" || fail "Codex lost a ChatGPT app server"
grep -q '^\[mcp_servers.computer-use\]' "$codex" || fail "Codex lost a ChatGPT app server"
awk '/^\[/{section=$0} section=="[mcp_servers.xai-search]" && $0 ~ /^env_vars = .*XAI_API_KEY/ {found=1} END {exit !found}' "$codex" \
    || fail "Codex lost its direct xAI server"
grep -q '^\[hooks.state\]' "$codex" || fail "Codex lost unrelated settings"
tail -1 "$test_dir/stow/claude/.claude/mods/jev-checks/hooks/jev-shared.ts" | grep -q 'changed in shared Jev' || fail "Claude's jev copy did not follow the shared source"
bash "$sync" --check >/dev/null || fail "a fresh sync is not up to date"
# tomllib needs Python 3.11; older Pythons skip only this parse check.
if python3 -c 'import tomllib' 2>/dev/null; then
    python3 -c 'import sys, tomllib; tomllib.load(open(sys.argv[1], "rb"))' "$codex" || fail "generated Codex config is not valid TOML"
fi

# Codex cannot express a secret inside a larger value, so the sync refuses rather than drop it.
jq '.mcpServers.docs.headers = {Authorization: "Bearer ${DOCS_TOKEN}"}' "$shared_mcp" > "$shared_mcp.new"
mv "$shared_mcp.new" "$shared_mcp"
bash "$sync" >/dev/null 2>&1 && fail "the sync accepted a header Codex cannot express"

if [ "$failures" -gt 0 ]; then
    exit 1
fi
echo "PASS: harness sync generates Codex and Claude files from shared sources and keeps Codex-owned servers"
