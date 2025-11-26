#!/bin/bash

# Cursor Font Configuration Script
# Updates Cursor's integrated terminal to use Nerd Fonts for powerline support

set -e

CURSOR_SETTINGS="$HOME/Library/Application Support/Cursor/User/settings.json"

echo "🔧 Configuring Cursor terminal for powerline support..."

# Check if Cursor settings file exists
if [ ! -f "$CURSOR_SETTINGS" ]; then
    echo "❌ Cursor settings file not found at: $CURSOR_SETTINGS"
    echo "💡 Make sure Cursor is installed and has been run at least once"
    exit 1
fi

# Backup current settings
cp "$CURSOR_SETTINGS" "$CURSOR_SETTINGS.backup"
echo "📋 Backed up current settings to: $CURSOR_SETTINGS.backup"

# Update terminal font to Nerd Font
if grep -q "terminal.integrated.fontFamily" "$CURSOR_SETTINGS"; then
    # Replace existing terminal font setting
    sed -i.tmp 's/"terminal\.integrated\.fontFamily": "[^"]*"/"terminal.integrated.fontFamily": "'"'"'JetBrainsMonoNL Nerd Font'"'"'"/' "$CURSOR_SETTINGS"
    rm "$CURSOR_SETTINGS.tmp"
    echo "✅ Updated terminal font to JetBrainsMonoNL Nerd Font"
else
    # Add terminal font setting if it doesn't exist
    # Insert before the last closing brace
    sed -i.tmp '$s/}/  "terminal.integrated.fontFamily": "'"'"'JetBrainsMonoNL Nerd Font'"'"'",\
}/' "$CURSOR_SETTINGS"
    rm "$CURSOR_SETTINGS.tmp"
    echo "✅ Added terminal font setting: JetBrainsMonoNL Nerd Font"
fi

# Update editor font to Nerd Font (optional but recommended)
if grep -q "editor.fontFamily" "$CURSOR_SETTINGS"; then
    sed -i.tmp 's/"editor\.fontFamily": "[^"]*"/"editor.fontFamily": "'"'"'JetBrainsMonoNL Nerd Font'"'"'"/' "$CURSOR_SETTINGS"
    rm "$CURSOR_SETTINGS.tmp"
    echo "✅ Updated editor font to JetBrainsMonoNL Nerd Font"
fi

echo ""
echo "🎨 Cursor font configuration complete!"
echo "💡 Next steps:"
echo "   1. Restart Cursor"
echo "   2. Open integrated terminal (Ctrl+` or Cmd+`)"
echo "   3. Check that powerline symbols display correctly"
echo "   4. Test with: echo '  '"
