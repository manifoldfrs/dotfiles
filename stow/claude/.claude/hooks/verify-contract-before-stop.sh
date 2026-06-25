#!/usr/bin/env bash
# Stop hook: if this turn changed a file that looks like a hand-written external
# or serialized contract type, block the stop until the work is verified against
# a real captured response (global Implementation Rule 8). The model clears the
# block by logging proof to .claude/state/contract-verify.log, or dismisses a
# false positive the same way. Fails open: any error or non-repo allows the stop.
set -uo pipefail

input=$(cat) || exit 0
command -v jq >/dev/null 2>&1 || exit 0

# Loop guard. Never block a stop that is already a continuation from a prior block.
[ "$(printf '%s' "$input" | jq -r '.stop_hook_active // false')" = "true" ] && exit 0

cwd=$(printf '%s' "$input" | jq -r '.cwd // empty')
[ -n "$cwd" ] && [ -d "$cwd" ] || exit 0

root=$(git -C "$cwd" rev-parse --show-toplevel 2>/dev/null) || exit 0
[ -n "$root" ] || exit 0

changed=$(
  {
    git -C "$root" diff --name-only HEAD 2>/dev/null
    git -C "$root" ls-files --others --exclude-standard 2>/dev/null
  } | grep -v '^\.claude/' | sort -u
)
[ -n "$changed" ] || exit 0

# Collect changed files that look like an external or serialized contract: a
# contract-shaped filename, or content carrying a serialization marker.
hits=""
while IFS= read -r f; do
  [ -n "$f" ] || continue
  signal=""
  case "$f" in
    *.dto.ts|*.dto.go|*Dto.ts|*View.ts|*[Rr]esponse.ts|*[Rr]esponse.go|*[Tt]ypes.ts|*client.ts|*Client.ts|*.d.ts)
      signal="name" ;;
  esac
  if [ -z "$signal" ]; then
    if git -C "$root" diff HEAD -- "$f" 2>/dev/null | grep -Eqi 'protojson|json_name|hand[ -]?written|no OpenAPI|proto has no'; then
      signal="content"
    elif [ -f "$root/$f" ] && grep -Eqi 'protojson|json_name|hand[ -]?written|no OpenAPI|proto has no' "$root/$f" 2>/dev/null; then
      signal="content"
    fi
  fi
  [ -n "$signal" ] && hits="$hits $f"
done <<EOF
$changed
EOF

hits=$(printf '%s' "$hits" | xargs -n1 2>/dev/null | sort -u | tr '\n' ' ')
[ -n "${hits// /}" ] || exit 0

# A VERIFIED proof entry from the last 15 minutes clears the block.
log="$root/.claude/state/contract-verify.log"
now=$(date +%s)
window=900
if [ -f "$log" ]; then
  while IFS='|' read -r ts _rest; do
    case "$ts" in ''|*[!0-9]*) continue ;; esac
    [ $((now - ts)) -le $window ] && exit 0
  done < "$log"
fi

reason="GUARDRAIL (Implementation Rule 8): this turn changed file(s) that look like a hand-written external or serialized contract type: ${hits}
Before finishing, verify their field names, casing, and nesting against a REAL captured response (curl, a throwaway go run, or protojson.Marshal output), and confirm the fixture test loads that captured response rather than a hand-built object shaped like the type. Then record proof so the turn can end:
  mkdir -p \"$root/.claude/state\" && echo \"\$(date +%s)|VERIFIED ${hits}\" >> \"$root/.claude/state/contract-verify.log\"
If these are internal types you own, not an external contract, dismiss with:
  mkdir -p \"$root/.claude/state\" && echo \"\$(date +%s)|VERIFIED not-external\" >> \"$root/.claude/state/contract-verify.log\""

jq -nc --arg r "$reason" '{decision:"block", reason:$r}'
exit 0
