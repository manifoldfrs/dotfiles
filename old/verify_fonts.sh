#!/bin/bash

# Simple Font Verification Script
# Checks if Nerd Fonts are installed without requiring fontconfig

echo "🔍 Checking for Nerd Fonts installation..."

# Check user fonts directory
USER_FONTS=~/Library/Fonts
NERD_FONTS_FOUND=false

if ls "$USER_FONTS"/*Nerd* &> /dev/null; then
    echo "✅ Found Nerd Fonts in user directory:"
    ls "$USER_FONTS"/*Nerd* 2>/dev/null | head -5 | while read font; do
        echo "   📄 $(basename "$font")"
    done
    NERD_FONTS_FOUND=true
fi

# Check system fonts directory
SYSTEM_FONTS=/System/Library/Fonts
if ls "$SYSTEM_FONTS"/*Nerd* &> /dev/null; then
    echo "✅ Found Nerd Fonts in system directory:"
    ls "$SYSTEM_FONTS"/*Nerd* 2>/dev/null | head -3 | while read font; do
        echo "   📄 $(basename "$font")"
    done
    NERD_FONTS_FOUND=true
fi

# Test powerline symbols
echo ""
echo "🎨 Testing powerline symbols:"
echo "   Arrows: \ue0b0 \ue0b1 \ue0b2 \ue0b3"
echo "   Triangles: \ue0b4 \ue0b5 \ue0b6 \ue0b7"
echo "   Branch: \ue0a0 Lock: \ue0a2"

if [ "$NERD_FONTS_FOUND" = true ]; then
    echo ""
    echo "✅ Nerd Fonts are installed!"
    echo "💡 If symbols appear as boxes/question marks:"
    echo "   - Restart Cursor or Warp terminal"
    echo "   - Cursor: Font is pre-configured via settings.json"
    echo "   - Warp: Check Settings > Appearance > Text > Font"
else
    echo ""
    echo "❌ No Nerd Fonts found!"
    echo "💡 Run: ./setup_fonts.sh to install fonts"
fi
