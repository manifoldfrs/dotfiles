#!/bin/bash

# Cursor Extensions Installation Script
# Installs extensions from extensions.txt

set -e

DOTFILES_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
EXTENSIONS_FILE="$DOTFILES_DIR/cursor/extensions.txt"

echo "📦 Installing Cursor extensions..."

# Check if extensions.txt exists
if [ ! -f "$EXTENSIONS_FILE" ]; then
    echo "❌ Extensions file not found: $EXTENSIONS_FILE"
    echo "💡 Run ./sync_cursor_settings.sh first to create it"
    exit 1
fi

# Check if file is empty
if [ ! -s "$EXTENSIONS_FILE" ]; then
    echo "⚠️  Extensions file is empty"
    echo "💡 Add extension IDs (one per line) to: $EXTENSIONS_FILE"
    echo "Example extensions:"
    echo "  ms-vscode.vscode-json"
    echo "  esbenp.prettier-vscode"
    echo "  ms-python.python"
    exit 1
fi

# Install extensions
echo "📋 Installing extensions from: $EXTENSIONS_FILE"

# Try Cursor CLI first
if command -v cursor &> /dev/null; then
    echo "Using Cursor CLI..."
    while IFS= read -r extension; do
        # Skip empty lines and comments
        [[ -z "$extension" || "$extension" =~ ^# ]] && continue
        echo "Installing: $extension"
        cursor --install-extension "$extension" --force
    done < "$EXTENSIONS_FILE"
elif command -v code &> /dev/null; then
    echo "Using VS Code CLI (fallback)..."
    while IFS= read -r extension; do
        # Skip empty lines and comments
        [[ -z "$extension" || "$extension" =~ ^# ]] && continue
        echo "Installing: $extension"
        code --install-extension "$extension" --force
    done < "$EXTENSIONS_FILE"
else
    echo "❌ No CLI available for extension installation"
    echo "💡 Manual installation required:"
    echo "   1. Open Cursor"
    echo "   2. Go to Extensions (Cmd+Shift+X)"
    echo "   3. Search and install each extension from:"
    cat "$EXTENSIONS_FILE"
    exit 1
fi

echo ""
echo "✅ Extension installation complete!"
echo "💡 Restart Cursor to ensure all extensions are loaded"