#!/bin/bash
set -euo pipefail

plugin_cache="${CODEX_HOME:-$HOME/.codex}/plugins/cache/open-pstack/pstack"
watcher_suffix="/skills/poteto-mode/scripts/watch-pr/watch-pr"
watcher=${1:-}
plugin_dir=${watcher%"$watcher_suffix"}
version=${plugin_dir#"$plugin_cache/"}

if [[ "$watcher" != "$plugin_cache/"*"$watcher_suffix" || -z "$version" || "$version" == */* || ! -f "$watcher" ]]; then
    printf 'Usage: %s <installed Codex pstack watch-pr path> [watcher options]\n' "${0##*/}" >&2
    exit 2
fi
shift

cache_dir="${XDG_CACHE_HOME:-$HOME/Library/Caches}/open-pstack/poteto-mode/$version"
if [[ "$(uname -s)" != Darwin && -z "${XDG_CACHE_HOME:-}" ]]; then
    cache_dir="$HOME/.cache/open-pstack/poteto-mode/$version"
fi

# Run the upstream CLI directly so its bootstrap cannot write into the trusted plugin.
PSTACK_WATCH_PR_CLI="${watcher%/*}/cli.ts" \
    NODE_PATH="$cache_dir/node_modules" \
    BUN_INSTALL_CACHE_DIR="$cache_dir/bun" \
    exec bun --install=force -e '
        const { main } = await import(process.env.PSTACK_WATCH_PR_CLI);
        process.exitCode = await main(process.argv.slice(1));
    ' -- "$@"
