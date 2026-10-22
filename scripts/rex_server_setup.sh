#!/bin/bash

# Configure the Rex login server on a Linux host (agentbox) from tracked files.
# Run as root after installing the rex package. Safe to rerun.
# Usage: sudo ./scripts/rex_server_setup.sh

set -e

DOTFILES_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
SOURCE_DIR="$DOTFILES_DIR/server/rex"
SERVICE="rex-login-server.service"
ACCOUNTS_SOURCE="$SOURCE_DIR/accounts.jsonc"
ACCOUNTS_TARGET="/etc/rex/accounts.jsonc"
OVERRIDE_SOURCE="$SOURCE_DIR/rex-login-server.service.d/override.conf"
OVERRIDE_TARGET="/etc/systemd/system/rex-login-server.service.d/override.conf"
LISTENER="--extra-listen tailnet://:7297"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Print a unit's ExecStart command line with continuations joined and spaces collapsed.
exec_start() {
    sed -e ':a' -e '/\\$/N; s/\\\n//; ta' "$1" \
        | sed -n 's/^ExecStart=\(..*\)$/\1/p' \
        | tr -s ' \t' ' ' \
        | sed 's/ $//'
}

# Install a tracked file, keeping a timestamped backup of a different existing file.
# Prints "changed" when the target was replaced.
install_file() {
    local src=$1
    local dest=$2

    if [ -f "$dest" ] && cmp -s "$src" "$dest"; then
        return
    fi
    if [ -f "$dest" ]; then
        cp -p "$dest" "$dest.backup.$(date +%Y%m%d%H%M%S)"
    fi
    install -D -m 0644 "$src" "$dest"
    echo changed
}

[ "$(id -u)" -eq 0 ] || error "Run as root: sudo $0"
command -v rex >/dev/null 2>&1 || error "Install the rex package first: https://www.superlogical.com/rex/docs/linux/installation"
command -v systemctl >/dev/null 2>&1 || error "systemd is required"

packaged_unit="$(systemctl show -p FragmentPath --value "$SERVICE")"
[ -f "$packaged_unit" ] || error "$SERVICE is not installed"

packaged_command="$(exec_start "$packaged_unit")"
tracked_command="$(exec_start "$OVERRIDE_SOURCE" | sed "s| $LISTENER\$||")"
if [ "$packaged_command" != "$tracked_command" ]; then
    error "The packaged ExecStart changed; update $OVERRIDE_SOURCE to match:
  packaged: $packaged_command
  tracked:  $tracked_command"
fi

accounts_changed="$(install_file "$ACCOUNTS_SOURCE" "$ACCOUNTS_TARGET")"
override_changed="$(install_file "$OVERRIDE_SOURCE" "$OVERRIDE_TARGET")"

if [ -n "$override_changed" ]; then
    systemctl daemon-reload
fi

if ! systemctl is-active --quiet "$SERVICE"; then
    info "Starting $SERVICE"
    systemctl enable --now "$SERVICE"
elif [ -n "$override_changed" ]; then
    # Restarting the login server leaves each account's server and sessions running.
    info "Restarting $SERVICE for the new listener"
    systemctl restart "$SERVICE"
elif [ -n "$accounts_changed" ]; then
    info "Reloading $SERVICE for the new accounts"
    systemctl reload "$SERVICE"
else
    systemctl enable --quiet "$SERVICE"
    info "$SERVICE already matches the tracked configuration"
fi

systemctl is-active --quiet "$SERVICE" || error "$SERVICE failed to start; see: journalctl -u $SERVICE"
info "Rex login server is listening on tailnet port 7297"
