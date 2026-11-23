#!/bin/bash
# Generate Codex's shared MCP registrations and the Claude Code Jev mod copy.
# Usage: ./scripts/harness_sync.sh [--check]

set -euo pipefail

DOTFILES_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
STOW_DIR="$DOTFILES_DIR/stow"
SHARED_MCP="$DOTFILES_DIR/mcp/shared/servers.json"
CODEX_CONFIG="$STOW_DIR/codex/.codex/config.toml"
JEV_SOURCE="mcp/shared/jev.ts"
CLAUDE_JEV="$STOW_DIR/claude/.claude/mods/jev-checks/hooks/jev-shared.ts"
CODEX_LOCAL_SERVERS="node_repl computer-use xai-search jev"

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

info() { echo -e "${GREEN}[sync]${NC} $1"; }
error() { echo -e "${RED}[sync]${NC} $1" >&2; exit 1; }

# Codex reads secrets for headers and stdio servers by variable name, so each ${NAME} value must be the whole value.
codex_servers() {
    jq -r --arg keep "$CODEX_LOCAL_SERVERS" '
        # capture yields nothing on a miss, so collect it to get null for values that are not one whole reference.
        def whole_ref: [capture("^\\$\\{(?<name>[A-Za-z_][A-Za-z0-9_]*)\\}$")][0].name;
        def table($name; $object): if ($object | length) == 0 then empty else
            "", "[mcp_servers.\($name)]", ($object | to_entries[] | "\(.key) = \(.value | tojson)") end;
        .mcpServers | to_entries[] | .key as $name | .value as $server
        | select(($keep | split(" ") | index($name)) == null)
        # jq 1.7 binds `a + b as $x` as `a + (b as $x | ...)`, so the whole sum is parenthesized.
        | ((if $server.url then {url: $server.url} else {command: $server.command, args: ($server.args // [])} end)
          + (if $server.enabled == false then {enabled: false} else {} end)
          + (if $server.timeout then {tool_timeout_sec: $server.timeout} else {} end)
          + (if $server.exposure == "direct" then {omit_tools_from: ["deferred"]}
             elif $server.exposure == "codemode" then {omit_tools_from: ["direct","deferred"]}
             else {} end)) as $main
        | ($server.headers // {} | to_entries) as $headers
        | ($server.env // {} | to_entries) as $env
        | if ($headers | map(select((.value | whole_ref) == null and (.value | test("\\$\\{")))) | length) > 0
             or ($env | map(select((.value | test("\\$\\{")) and (.value | whole_ref) != .key)) | length) > 0
          then error("\($name): Codex can only pass a whole ${NAME} value, and stdio env must reuse the same name")
          else
            ($main + (if ($env | map(select(.value | whole_ref)) | length) > 0 then {env_vars: [$env[] | select(.value | whole_ref) | .key]} else {} end)) as $main
            | table($name; $main),
              table("\($name).env_http_headers"; [$headers[] | select(.value | whole_ref) | {key, value: (.value | whole_ref)}] | from_entries),
              table("\($name).http_headers"; [$headers[] | select((.value | whole_ref) == null)] | from_entries),
              table("\($name).env"; [$env[] | select((.value | test("\\$\\{")) | not)] | from_entries)
          end
    ' "$SHARED_MCP"
}

render_codex() {
    local servers
    servers="$(codex_servers | sed '1{/^$/d;}')"
    SERVERS="$servers" awk -v keep="$CODEX_LOCAL_SERVERS" '
        BEGIN {
            servers = ENVIRON["SERVERS"]
            split(keep, names, " ")
            for (i in names) kept[names[i]] = 1
            count = split(servers, lines, "\n")
            for (i = 1; i <= count; i++)
                if (lines[i] ~ /^\[mcp_servers\.[^.]+\]$/) generated[server_of(lines[i])] = 1
        }
        function server_of(header,   name) {
            name = header
            sub(/^\[mcp_servers\./, "", name)
            sub(/[.\]].*$/, "", name)
            return name
        }
        /^\[/ {
            server = server_of($0)
            # Codex records tool approvals separately from the shared server connections.
            tool_policy = ($0 ~ /^\[mcp_servers\.[^.]+\.tools\./) && (server in generated)
            owned = ($0 ~ /^\[mcp_servers\./) && !(server in kept) && !tool_policy
            if (owned && !placed) { printf "%s", pending; pending = ""; print servers; print ""; placed = 1 }
        }
        owned { pending = ""; next }
        /^$/ { pending = pending "\n"; next }
        { printf "%s", pending; pending = ""; print }
        END { if (!placed) { print ""; print servers } }
    ' "$CODEX_CONFIG"
}

# Writes or checks one generated file; prints its path when it is stale.
apply() {
    local mode=$1 target=$2 rendered=$3
    if cmp -s "$rendered" "$target"; then
        return 0
    fi
    if [ "$mode" = check ]; then
        echo "${target#"$DOTFILES_DIR"/}"
        return 1
    fi
    cp "$rendered" "$target"
    info "wrote ${target#"$DOTFILES_DIR"/}"
}

main() {
    local mode=write stale=0 tmp
    case "${1:-}" in
        "") ;;
        --check) mode=check ;;
        *) error "Usage: $0 [--check]" ;;
    esac
    command -v jq &> /dev/null || error "jq is required"
    tmp="$(mktemp -d)"
    # The trap runs after main returns, when its locals are gone, so it gets the path expanded now.
    trap "rm -rf '$tmp'" EXIT

    render_codex > "$tmp/config.toml"
    apply "$mode" "$CODEX_CONFIG" "$tmp/config.toml" || stale=1
    {
        printf '// Generated by scripts/harness_sync.sh from %s; edit that file instead.\n' "$JEV_SOURCE"
        cat "$DOTFILES_DIR/$JEV_SOURCE"
    } > "$tmp/jev-shared.ts"
    if [ "$mode" = write ] && [ -L "$CLAUDE_JEV" ]; then
        rm "$CLAUDE_JEV"
    fi
    apply "$mode" "$CLAUDE_JEV" "$tmp/jev-shared.ts" || stale=1

    if [ "$stale" -ne 0 ]; then
        error "generated harness files are stale; run ./scripts/harness_sync.sh"
    fi
    [ "$mode" = check ] && info "generated harness files are up to date"
    return 0
}

main "$@"
