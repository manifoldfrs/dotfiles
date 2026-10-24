#!/bin/bash

# Track Rex app settings (themes, font, tabs, cursor) in dotfiles.
# Usage: ./scripts/rex_prefs.sh save|load|watch

set -e

DOTFILES_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
DOMAIN="com.superlogical.rex"
PREFS_FILE="$DOTFILES_DIR/rex/preferences.plist"
AGENT_LABEL="dev.hbb.rex-prefs"
AGENT_FILE="$HOME/Library/LaunchAgents/$AGENT_LABEL.plist"
PLISTBUDDY="/usr/libexec/PlistBuddy"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Window frames, update checks, sessions, and server/host state are machine-local.
is_tracked_key() {
    case "$1" in
        Workspace.lastFocusedSession|Workspace.programActivitySeen) return 1 ;;
        Workspace.*|rex.developer-mode-enabled) return 0 ;;
        *) return 1 ;;
    esac
}

top_level_keys() {
    plutil -p "$1" | sed -n 's/^  "\(.*\)" => .*/\1/p'
}

save() {
    local tmp
    tmp="$(mktemp)"
    defaults export "$DOMAIN" "$tmp"

    local key
    while IFS= read -r key; do
        if ! is_tracked_key "$key"; then
            "$PLISTBUDDY" -c "Delete :'$key'" "$tmp"
        fi
    done < <(top_level_keys "$tmp")

    plutil -convert xml1 "$tmp"
    mkdir -p "$(dirname "$PREFS_FILE")"

    if [ -f "$PREFS_FILE" ] && cmp -s "$tmp" "$PREFS_FILE"; then
        rm "$tmp"
        info "Rex settings already current"
        return
    fi

    mv "$tmp" "$PREFS_FILE"
    info "Saved Rex settings to $PREFS_FILE"
}

load() {
    [ -f "$PREFS_FILE" ] || error "No tracked Rex settings at $PREFS_FILE"
    if pgrep -xq "Rex"; then
        error "Quit Rex first so it doesn't overwrite the restored settings"
    fi

    local tmp
    tmp="$(mktemp)"
    defaults export "$DOMAIN" "$tmp" 2>/dev/null || plutil -create xml1 "$tmp"

    local key
    while IFS= read -r key; do
        "$PLISTBUDDY" -c "Delete :'$key'" "$tmp" 2>/dev/null || true
    done < <(top_level_keys "$PREFS_FILE")

    "$PLISTBUDDY" -c "Merge '$PREFS_FILE'" "$tmp"
    defaults import "$DOMAIN" "$tmp"
    rm "$tmp"
    info "Loaded Rex settings from $PREFS_FILE"
}

# Saves automatically whenever Rex writes its preferences.
watch() {
    mkdir -p "$(dirname "$AGENT_FILE")"
    cat > "$AGENT_FILE" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>$AGENT_LABEL</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>$DOTFILES_DIR/scripts/rex_prefs.sh</string>
        <string>save</string>
    </array>
    <key>WatchPaths</key>
    <array>
        <string>$HOME/Library/Preferences/$DOMAIN.plist</string>
    </array>
    <key>StandardErrorPath</key>
    <string>/tmp/$AGENT_LABEL.log</string>
</dict>
</plist>
EOF

    launchctl bootout "gui/$(id -u)/$AGENT_LABEL" 2>/dev/null || true
    launchctl bootstrap "gui/$(id -u)" "$AGENT_FILE"
    info "Watching Rex settings; changes save to $PREFS_FILE"
}

case "$1" in
    save) save ;;
    load) load ;;
    watch) watch ;;
    *) warn "Usage: $0 save|load|watch"; exit 1 ;;
esac
