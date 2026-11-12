#!/bin/sh
# Start the codemode runner in a fresh run directory, with Node's permission model limiting it
# to reading its own source and reading and writing that directory: no network or child processes.
set -e
here="$(cd "$(dirname "$0")" && pwd -P)"
dir="$(mktemp -d "${TMPDIR:-/tmp}/claude-codemode.XXXXXX")"
dir="$(cd "$dir" && pwd -P)"
exec node --permission \
  --allow-fs-read="$here/runner.mjs" \
  --allow-fs-read="$dir" \
  --allow-fs-write="$dir" \
  "$here/runner.mjs" "$dir"
