#!/usr/bin/env bash
# Claude Code prose uses the terminal's default foreground, which no theme token reaches.
# Usage: set-terminal-text-color.sh '#rrggbb' | reset

set -uo pipefail

pid=$PPID
tty=""
while [ -n "$pid" ] && [ "$pid" -gt 1 ]; do
  tty=$(ps -o tty= -p "$pid" | tr -d ' ')
  if [ -n "$tty" ] && [ "$tty" != "??" ]; then
    break
  fi
  tty=""
  pid=$(ps -o ppid= -p "$pid" | tr -d ' ')
done

if [ -z "$tty" ] || [ ! -w "/dev/$tty" ]; then
  exit 0
fi

if [ "${1:-}" = "reset" ]; then
  printf '\033]110\007' > "/dev/$tty"
else
  printf '\033]10;%s\007' "$1" > "/dev/$tty"
fi
