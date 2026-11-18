#!/bin/bash
set -e

DOTFILES_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION=0.1.35
AGENT_DIR="${PI_CODING_AGENT_DIR:-$HOME/.pi/agent}"
PACKAGE_DIR="$AGENT_DIR/npm/node_modules/pi-cyber-ui"
PATCH_FILE="$DOTFILES_DIR/patches/pi-cyber-ui-$VERSION.patch"

if [ ! -f "$PACKAGE_DIR/package.json" ]; then
    source="npm:pi-cyber-ui@$VERSION"
    if ! jq -e --arg source "$source" '(.packages // []) | index($source) != null' "$AGENT_DIR/settings.json" >/dev/null; then
        printf 'Configure %s in %s/settings.json before running this script.\n' "$source" "$AGENT_DIR" >&2
        exit 1
    fi
    PI_CODING_AGENT_DIR="$AGENT_DIR" pi install "$source" --no-approve
fi

if ! jq -e --arg version "$VERSION" '.name == "pi-cyber-ui" and .version == $version' "$PACKAGE_DIR/package.json" >/dev/null; then
    printf 'Expected pi-cyber-ui %s in %s; footer unchanged.\n' "$VERSION" "$PACKAGE_DIR" >&2
    exit 1
fi

if patch -d "$PACKAGE_DIR" -p1 -R -f -F 0 --dry-run < "$PATCH_FILE" >/dev/null 2>&1; then
    printf 'Pi Cyber UI footer is already configured.\n'
    exit 0
fi

patch -d "$PACKAGE_DIR" -p1 -f -F 0 --dry-run < "$PATCH_FILE" >/dev/null
patch -d "$PACKAGE_DIR" -p1 -f -F 0 < "$PATCH_FILE"
