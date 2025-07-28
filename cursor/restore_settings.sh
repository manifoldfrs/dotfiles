#!/bin/bash

# Cursor Settings Restoration Script (Lightweight)
CURSOR_DIR="$HOME/Library/Application Support/Cursor"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Restoring Cursor settings from: $SCRIPT_DIR"
mkdir -p "$CURSOR_DIR/User"

# Restore main settings
for file in settings.json keybindings.json tasks.json launch.json; do
    if [ -f "$SCRIPT_DIR/$file" ]; then
        cp "$SCRIPT_DIR/$file" "$CURSOR_DIR/User/"
        echo "✓ Restored $file"
    fi
done

# Restore snippets
if [ -d "$SCRIPT_DIR/snippets" ]; then
    cp -r "$SCRIPT_DIR/snippets" "$CURSOR_DIR/User/"
    echo "✓ Restored snippets/"
fi

# Install extensions
if [ -f "$SCRIPT_DIR/extensions.txt" ]; then
    echo "Installing extensions..."
    while IFS= read -r extension; do
        if [ -n "$extension" ]; then
            echo "Installing: $extension"
            cursor --install-extension "$extension" --force 2>/dev/null || echo "⚠ Failed: $extension"
        fi
    done < "$SCRIPT_DIR/extensions.txt"
fi

echo "🎉 Settings restored! Restart Cursor to apply changes."
