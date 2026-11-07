#!/bin/bash

# MCP Configuration Setup Script
# Handles: Codex config and Claude Code MCP registrations from Pi.
# Usage: ./mcp_setup.sh [backup|install|install-claude]

set -e

DOTFILES_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
MCP_DIR="$DOTFILES_DIR/mcp"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# MCP config file locations
CODEX_CONFIG="$HOME/.codex/config.toml"

backup() {
    info "Backing up MCP configurations..."
    mkdir -p "$MCP_DIR"

    # Codex
    if [ -f "$CODEX_CONFIG" ]; then
        info "Backing up Codex config..."
        cp "$CODEX_CONFIG" "$MCP_DIR/codex_config.toml"
    else
        warn "Codex config not found"
    fi

    info "Backup complete!"
    echo ""
    echo "Files saved to $MCP_DIR:"
    ls -la "$MCP_DIR"
    echo ""
    warn "IMPORTANT: Review configs and remove/replace any API keys before committing!"
    echo "  - Replace actual API keys with placeholders like YOUR_API_KEY"
    echo "  - Or add mcp/ to .gitignore if you want to keep keys"
}

install() {
    info "Installing MCP configurations..."
    
    echo ""
    warn "This will overwrite existing MCP configs. Press Ctrl+C to cancel, or Enter to continue..."
    read -r

    # Codex
    if [ -f "$MCP_DIR/codex_config.toml" ]; then
        if [ -L "$CODEX_CONFIG" ]; then
            warn "Skipping Codex config install because $CODEX_CONFIG is symlinked. Use scripts/stow.sh apply instead."
        else
            info "Installing Codex config..."
            mkdir -p "$(dirname "$CODEX_CONFIG")"
            cp "$MCP_DIR/codex_config.toml" "$CODEX_CONFIG"
            info "Installed: $CODEX_CONFIG"
        fi
    fi

    echo ""
    info "MCP configuration install complete!"
    echo ""
    echo "=========================================="
    echo "IMPORTANT: Update API keys in configs!"
    echo "=========================================="
    echo ""
    echo "Edit the following files and replace placeholders with your actual API keys:"
    if [ -L "$CODEX_CONFIG" ]; then
        echo "  - Codex: $CODEX_CONFIG is Stow-managed; update stow/codex/.codex/config.toml and run scripts/stow.sh apply"
    else
        echo "  - Codex: $CODEX_CONFIG"
    fi
    echo ""
    echo "Then restart each application to apply changes."
}

install_claude() {
    command -v claude >/dev/null 2>&1 || error "Claude Code is required"
    command -v jq >/dev/null 2>&1 || error "jq is required"

    local entries
    local entry
    local name
    local config
    local existing
    entries="$(jq -ce '.mcpServers | to_entries[]' "$DOTFILES_DIR/stow/pi/.pi/agent/mcp.json")"
    while IFS= read -r entry; do
        name="$(printf '%s' "$entry" | jq -r '.key')"
        config="$(printf '%s' "$entry" | jq -c '.value | del(.exposure, .timeout) | if has("command") then .type = "stdio" else . end')"
        if [ -f "$HOME/.claude.json" ]; then
            existing="$(jq -c --arg name "$name" '.mcpServers[$name]' "$HOME/.claude.json")"
            if [ "$existing" != "null" ]; then
                if printf '%s' "$existing" | jq -e --argjson expected "$config" '. == $expected' >/dev/null; then
                    info "Claude MCP server already matches: $name"
                    continue
                fi
                error "Claude MCP server $name differs; review it before replacing it"
            fi
        fi
        claude mcp add-json --scope user "$name" "$config"
    done <<< "$entries"
    info "Registered Pi's MCP servers in Claude Code; restart Claude to load them"
}

usage() {
    echo "Usage: $0 [backup|install|install-claude]"
    echo ""
    echo "Commands:"
    echo "  backup   Copy MCP configs from system to dotfiles/mcp/"
    echo "  install  Copy MCP configs from dotfiles/mcp/ to system locations"
    echo "  install-claude  Register Pi's MCP servers in Claude Code's user config"
    echo ""
    echo "Config locations:"
    echo "  Codex:          ~/.codex/config.toml"
    exit 1
}

case "${1:-}" in
    backup)
        backup
        ;;
    install)
        install
        ;;
    install-claude)
        install_claude
        ;;
    *)
        usage
        ;;
esac
