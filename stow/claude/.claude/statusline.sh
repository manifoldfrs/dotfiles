#!/usr/bin/env bash
# Claude Code statusline: working directory, git branch, model, and context-window usage.
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

# Split on unit separator, not tab: bash collapses runs of IFS whitespace, which
# would shift every field when current_dir is absent.
IFS=$'\x1f' read -r model dir used size pct < <(printf '%s' "$input" | jq -r '
  def human: if . >= 1000000 then (. / 1000000 * 10 | round / 10 | tostring) + "M"
             elif . >= 1000 then (. / 1000 | round | tostring) + "k"
             else tostring end;

  [
    (.model.display_name // "?"),
    (.workspace.current_dir // ""),
    (.context_window.total_input_tokens // 0 | human),
    (.context_window.context_window_size // 0 | human),
    (if (.context_window.context_window_size // 0) > 0
     then ((.context_window.total_input_tokens // 0) / .context_window.context_window_size * 100 | round)
     else 0 end)
  ] | map(tostring) | join("\u001f")' 2>/dev/null) || exit 0

[ -n "${model:-}" ] || exit 0

location=""
if [ -n "${dir:-}" ]; then
  location="${dir/#$HOME/\~}"
  branch=$(git -C "$dir" symbolic-ref --short -q HEAD 2>/dev/null) \
    || branch=$(git -C "$dir" rev-parse --short HEAD 2>/dev/null) \
    || branch=""
  [ -n "$branch" ] && location="$location ($branch)"
  location="${DIM}${location}${RESET} · "
fi

color="$DIM"
if [ "${pct:-0}" -ge 90 ]; then
  color="$RED"
elif [ "${pct:-0}" -ge 75 ]; then
  color="$YELLOW"
fi

printf '%s%s · %s%s/%s (%s%%)%s' \
  "$location" \
  "${DIM}${model}${RESET}" \
  "$color" "$used" "$size" "$pct" "$RESET"
