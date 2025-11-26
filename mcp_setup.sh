#!/bin/bash

# MCP Configuration Setup Script
# Handles: Claude Desktop, Claude Code, Cursor, Codex, Droid/Factory MCP configs
# Usage: ./mcp_setup.sh [backup|install]

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
CLAUDE_DESKTOP_CONFIG="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
CLAUDE_CODE_CONFIG="$HOME/.claude.json"
CURSOR_MCP_CONFIG="$HOME/.cursor/mcp.json"
CODEX_CONFIG="$HOME/.codex/config.toml"
FACTORY_MCP_CONFIG="$HOME/.factory/mcp.json"

backup() {
    info "Backing up MCP configurations..."
    mkdir -p "$MCP_DIR"

    # Claude Desktop
    if [ -f "$CLAUDE_DESKTOP_CONFIG" ]; then
        info "Backing up Claude Desktop MCP config..."
        cp "$CLAUDE_DESKTOP_CONFIG" "$MCP_DIR/claude_desktop_config.json"
    else
        warn "Claude Desktop config not found"
    fi

    # Cursor
    if [ -f "$CURSOR_MCP_CONFIG" ]; then
        info "Backing up Cursor MCP config..."
        cp "$CURSOR_MCP_CONFIG" "$MCP_DIR/cursor_mcp.json"
    else
        warn "Cursor MCP config not found"
    fi

    # Codex
    if [ -f "$CODEX_CONFIG" ]; then
        info "Backing up Codex config..."
        cp "$CODEX_CONFIG" "$MCP_DIR/codex_config.toml"
    else
        warn "Codex config not found"
    fi

    # Factory/Droid
    if [ -f "$FACTORY_MCP_CONFIG" ]; then
        info "Backing up Factory/Droid MCP config..."
        cp "$FACTORY_MCP_CONFIG" "$MCP_DIR/factory_mcp.json"
    else
        warn "Factory MCP config not found"
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

    # Claude Desktop
    if [ -f "$MCP_DIR/claude_desktop_config.json" ]; then
        info "Installing Claude Desktop MCP config..."
        mkdir -p "$(dirname "$CLAUDE_DESKTOP_CONFIG")"
        cp "$MCP_DIR/claude_desktop_config.json" "$CLAUDE_DESKTOP_CONFIG"
        info "Installed: $CLAUDE_DESKTOP_CONFIG"
    fi

    # Cursor
    if [ -f "$MCP_DIR/cursor_mcp.json" ]; then
        info "Installing Cursor MCP config..."
        mkdir -p "$(dirname "$CURSOR_MCP_CONFIG")"
        cp "$MCP_DIR/cursor_mcp.json" "$CURSOR_MCP_CONFIG"
        info "Installed: $CURSOR_MCP_CONFIG"
    fi

    # Codex
    if [ -f "$MCP_DIR/codex_config.toml" ]; then
        info "Installing Codex config..."
        mkdir -p "$(dirname "$CODEX_CONFIG")"
        cp "$MCP_DIR/codex_config.toml" "$CODEX_CONFIG"
        info "Installed: $CODEX_CONFIG"
    fi

    # Factory/Droid
    if [ -f "$MCP_DIR/factory_mcp.json" ]; then
        info "Installing Factory/Droid MCP config..."
        mkdir -p "$(dirname "$FACTORY_MCP_CONFIG")"
        cp "$MCP_DIR/factory_mcp.json" "$FACTORY_MCP_CONFIG"
        info "Installed: $FACTORY_MCP_CONFIG"
    fi

    echo ""
    info "MCP configuration install complete!"
    echo ""
    echo "=========================================="
    echo "IMPORTANT: Update API keys in configs!"
    echo "=========================================="
    echo ""
    echo "Edit the following files and replace placeholders with your actual API keys:"
    echo "  - Claude Desktop: $CLAUDE_DESKTOP_CONFIG"
    echo "  - Cursor: $CURSOR_MCP_CONFIG"
    echo "  - Codex: $CODEX_CONFIG"
    echo "  - Droid: $FACTORY_MCP_CONFIG"
    echo ""
    echo "Then restart each application to apply changes."
}

usage() {
    echo "Usage: $0 [backup|install]"
    echo ""
    echo "Commands:"
    echo "  backup   Copy MCP configs from system to dotfiles/mcp/"
    echo "  install  Copy MCP configs from dotfiles/mcp/ to system locations"
    echo ""
    echo "Config locations:"
    echo "  Claude Desktop: ~/Library/Application Support/Claude/claude_desktop_config.json"
    echo "  Cursor:         ~/.cursor/mcp.json"
    echo "  Codex:          ~/.codex/config.toml"
    echo "  Droid/Factory:  ~/.factory/mcp.json"
    exit 1
}

case "${1:-}" in
    backup)
        backup
        ;;
    install)
        install
        ;;
    *)
        usage
        ;;
esac
