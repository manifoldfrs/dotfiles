#!/usr/bin/env bash
# Claude Code statusline: model, effort, and context-window usage.
# Reads the statusline JSON payload on stdin. Never fails hard; a broken
# statusline would replace the line with an error on every render.

set -uo pipefail

DIM=$'\033[2m'
RESET=$'\033[0m'
YELLOW=$'\033[33m'
RED=$'\033[31m'

input=$(cat) || exit 0

if ! command -v jq >/dev/null 2>&1; then
  printf '%s' "${DIM}statusline: jq not installed${RESET}"
  exit 0
fi

read -r model used size pct < <(printf '%s' "$input" | jq -r '
  def human: if . >= 1000000 then (. / 1000000 * 10 | round / 10 | tostring) + "M"
             elif . >= 1000 then (. / 1000 | round | tostring) + "k"
             else tostring end;

  [
    (.model.display_name // "?" | gsub(" "; "_")),
    (.context_window.total_input_tokens // 0 | human),
    (.context_window.context_window_size // 0 | human),
    (if (.context_window.context_window_size // 0) > 0
     then ((.context_window.total_input_tokens // 0) / .context_window.context_window_size * 100 | round)
     else 0 end)
  ] | @tsv' 2>/dev/null) || exit 0

[ -n "${model:-}" ] || exit 0

color="$DIM"
if [ "${pct:-0}" -ge 90 ]; then
  color="$RED"
elif [ "${pct:-0}" -ge 75 ]; then
  color="$YELLOW"
fi

printf '%s · %s%s/%s (%s%%)%s' \
  "${DIM}${model//_/ }${RESET}" \
  "$color" "$used" "$size" "$pct" "$RESET"
