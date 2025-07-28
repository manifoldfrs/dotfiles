#!/bin/bash

# Cursor Settings Sync Script
# Syncs extensions, settings, and keybindings from current Cursor installation

set -e

DOTFILES_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CURSOR_USER_DIR="$HOME/Library/Application Support/Cursor/User"

echo "🔧 Syncing Cursor settings to dotfiles..."

# Create cursor directory if it doesn't exist
mkdir -p "$DOTFILES_DIR/cursor"

# Check if Cursor is installed
if [ ! -d "$CURSOR_USER_DIR" ]; then
    echo "❌ Cursor not found at: $CURSOR_USER_DIR"
    exit 1
fi

# Sync settings.json (already exists)
if [ -f "$CURSOR_USER_DIR/settings.json" ]; then
    echo "📋 Syncing settings.json..."
    cp "$CURSOR_USER_DIR/settings.json" "$DOTFILES_DIR/cursor/settings.json"
else
    echo "⚠️  settings.json not found in Cursor User directory"
fi

# Sync keybindings.json (already exists)
if [ -f "$CURSOR_USER_DIR/keybindings.json" ]; then
    echo "⌨️  Syncing keybindings.json..."
    cp "$CURSOR_USER_DIR/keybindings.json" "$DOTFILES_DIR/cursor/keybindings.json"
else
    echo "⚠️  keybindings.json not found in Cursor User directory"
fi

# Try to get extensions list via CLI if available
echo "📦 Gathering extensions list..."
if command -v cursor &> /dev/null; then
    cursor --list-extensions > "$DOTFILES_DIR/cursor/extensions.txt"
    echo "✅ Extensions list created via Cursor CLI"
elif command -v code &> /dev/null; then
    # Fallback to VS Code CLI if available (compatible)
    code --list-extensions > "$DOTFILES_DIR/cursor/extensions.txt"
    echo "✅ Extensions list created via VS Code CLI (fallback)"
else
    echo "⚠️  No CLI available for extensions list. Manual sync required."
    echo "💡 To manually sync extensions:"
    echo "   1. Open Cursor"
    echo "   2. Go to Extensions view (Cmd+Shift+X)"
    echo "   3. Click gear icon → 'Copy Extension List'"
    echo "   4. Save to cursor/extensions.txt"
fi

# Sync snippets if they exist
if [ -d "$CURSOR_USER_DIR/snippets" ]; then
    echo "📝 Syncing snippets..."
    cp -r "$CURSOR_USER_DIR/snippets" "$DOTFILES_DIR/cursor/"
else
    echo "⚠️  No snippets directory found"
fi

echo ""
echo "✅ Cursor settings sync complete!"
echo "💡 Next steps:"
echo "   1. Commit the updated dotfiles"
echo "   2. On new machine: run ./install.sh"
echo "   3. Install extensions: ./install_cursor_extensions.sh"