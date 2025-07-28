#!/bin/bash

# Font Setup Script for Dotfiles
# This script installs necessary Nerd Fonts for powerline support

set -e

echo "🔤 Setting up Nerd Fonts for powerline support..."

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "❌ Homebrew is required but not installed. Please install Homebrew first:"
    echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
    exit 1
fi

echo "📦 Installing JetBrains Mono Nerd Font..."
brew install --cask font-jetbrains-mono-nerd-font

echo "📦 Installing additional recommended Nerd Fonts..."
brew install --cask font-meslo-lg-nerd-font
brew install --cask font-fira-code-nerd-font

echo "🔍 Verifying font installation..."

# Check if fontconfig is available, install if needed
if ! command -v fc-list &> /dev/null; then
    echo "📦 Installing fontconfig for font verification..."
    brew install fontconfig
fi

# Verify fonts are installed
if command -v fc-list &> /dev/null && fc-list | grep -q "Nerd Font"; then
    echo "✅ Nerd Fonts successfully installed!"
    echo ""
    echo "📋 Available Nerd Font families:"
    fc-list | grep -i "nerd font" | cut -d: -f2 | cut -d, -f1 | sort | uniq | head -10
elif ls ~/Library/Fonts/*Nerd* &> /dev/null || ls /System/Library/Fonts/*Nerd* &> /dev/null; then
    echo "✅ Nerd Fonts found in system fonts directory!"
    echo "📋 Installed Nerd Fonts:"
    ls ~/Library/Fonts/*Nerd* 2>/dev/null | head -5 | xargs -I {} basename {} .ttf
else
    echo "❌ Font installation may have failed. Please check manually."
    echo "💡 Try checking: ls ~/Library/Fonts/*Nerd*"
    exit 1
fi

echo ""
echo "🎨 Font installation complete!"
echo "💡 Next steps:"
echo "   1. Restart your terminal application"
echo "   2. Configure your terminal to use a Nerd Font"
echo "   3. For Alacritty: Use 'JetBrainsMonoNL Nerd Font' or 'JetBrainsMono Nerd Font'"
echo "   4. For iTerm2: Search for 'Nerd Font' in font preferences"
