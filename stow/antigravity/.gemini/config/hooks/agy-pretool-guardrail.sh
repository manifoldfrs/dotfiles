#!/bin/bash
# Antigravity PreToolUse harness adapter for the shared Codex guardrail scripts.
# Reads Antigravity camelCase hook JSON on stdin, runs the canonical guardrail
# script, and emits Antigravity's JSON decision contract on stdout (exit 0).

set -uo pipefail

deny() {
    local reason=$1
    if command -v jq >/dev/null 2>&1; then
        jq -n --arg reason "$reason" '{decision: "deny", reason: $reason}'
    else
        printf '{"decision":"deny","reason":"jq not installed but required by agy-pretool-guardrail.sh. Install jq or remove this hook."}\n'
    fi
    exit 0
}

allow() {
    printf '{"decision":"allow"}\n'
    exit 0
}

trap 'deny "Hook error in $(basename "$0") at line $LINENO. Failing closed."' ERR

mode=${1:-}
if [ "$mode" != "bash" ] && [ "$mode" != "edit" ]; then
    deny "Hook $(basename "$0"): expected mode 'bash' or 'edit', got '${mode:-<empty>}'. Failing closed."
fi

if ! command -v jq >/dev/null 2>&1; then
    deny "jq not installed but required by $(basename "$0"). Install jq or remove this hook."
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
input=$(cat) || deny "Hook $(basename "$0"): failed to read stdin. Failing closed."

if [ "$mode" = "bash" ]; then
    cmd=$(printf '%s' "$input" | jq -r '
        [
            .toolCall.args.CommandLine?,
            .toolCall.args.commandLine?,
            .toolCall.args.command?,
            .toolCall.arguments.CommandLine?,
            .toolCall.arguments.commandLine?,
            .toolCall.arguments.command?,
            .tool_input.command?
        ]
        | map(select(type == "string" and length > 0))
        | .[0] // empty
    ' 2>/dev/null) || deny "Hook $(basename "$0"): malformed JSON input. Failing closed."

    [ -n "$cmd" ] || allow

    hook_script="$script_dir/block-dangerous-bash.sh"
    [ -x "$hook_script" ] || deny "Hook $(basename "$0"): missing guardrail script $hook_script. Failing closed."

    payload=$(jq -n --arg command "$cmd" '{tool_input: {command: $command}}')
else
    file_path=$(printf '%s' "$input" | jq -r '
        [
            .toolCall.args.Path?,
            .toolCall.args.path?,
            .toolCall.args.TargetFile?,
            .toolCall.args.targetFile?,
            .toolCall.args.target_file?,
            .toolCall.args.file_path?,
            .toolCall.args.AbsolutePath?,
            .toolCall.arguments.Path?,
            .toolCall.arguments.path?,
            .toolCall.arguments.TargetFile?,
            .toolCall.arguments.file_path?,
            .tool_input.file_path?,
            .tool_input.path?
        ]
        | map(select(type == "string" and length > 0))
        | .[0] // empty
    ' 2>/dev/null) || deny "Hook $(basename "$0"): malformed JSON input. Failing closed."

    [ -n "$file_path" ] || allow

    hook_cwd=$(printf '%s' "$input" | jq -r '
        [
            .cwd?,
            .workspacePaths?[0]
        ]
        | map(select(type == "string" and length > 0))
        | .[0] // empty
    ' 2>/dev/null) || deny "Hook $(basename "$0"): malformed JSON input. Failing closed."

    hook_script="$script_dir/block-generated-edits.sh"
    [ -x "$hook_script" ] || deny "Hook $(basename "$0"): missing guardrail script $hook_script. Failing closed."

    payload=$(jq -n --arg path "$file_path" --arg cwd "$hook_cwd" '{cwd: $cwd, tool_input: {file_path: $path}}')
fi

status=0
output=$(printf '%s' "$payload" | bash "$hook_script" 2>&1) || status=$?

if [ "$status" -eq 0 ]; then
    allow
fi

[ -n "$output" ] || output="Blocked by guardrail hook ($mode)."
deny "$output"
