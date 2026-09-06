#!/bin/bash

set -e

DOTFILES_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
PLUGIN_SOURCES_FILE="$DOTFILES_DIR/stow/herdr/.config/herdr/plugins.txt"

for tool in herdr bun jq; do
    if ! command -v "$tool" >/dev/null 2>&1; then
        echo "[ERROR] Herdr plugins require $tool on PATH" >&2
        exit 1
    fi
done

failed_plugins=()
while IFS= read -r plugin_source || [ -n "$plugin_source" ]; do
    plugin_source="${plugin_source%%#*}"
    plugin_source="${plugin_source//[[:space:]]/}"
    [ -z "$plugin_source" ] && continue

    echo "[INFO] Syncing Herdr plugin: $plugin_source"
    if ! herdr plugin install "$plugin_source" --yes; then
        failed_plugins+=("$plugin_source")
    fi
done < "$PLUGIN_SOURCES_FILE"

if [ "${#failed_plugins[@]}" -gt 0 ]; then
    echo "[ERROR] Failed to sync Herdr plugins: ${failed_plugins[*]}" >&2
    exit 1
fi

herdr config check
if herdr status server >/dev/null 2>&1; then
    herdr server reload-config
fi
