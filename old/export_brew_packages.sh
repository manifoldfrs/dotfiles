#!/bin/bash

# Export Homebrew Packages Script
# Creates a comprehensive list of all installed packages

set -e

DOTFILES_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "📦 Exporting Homebrew packages..."

# Create Brewfile
brew bundle dump --file="$DOTFILES_DIR/Brewfile" --force

# Create detailed lists
echo "Creating detailed package lists..."

# Export formulas
brew list --formula > "$DOTFILES_DIR/brew_formulas.txt"
echo "📋 Exported $(wc -l < "$DOTFILES_DIR/brew_formulas.txt") formulas to brew_formulas.txt"

# Export casks
brew list --cask > "$DOTFILES_DIR/brew_casks.txt"
echo "📋 Exported $(wc -l < "$DOTFILES_DIR/brew_casks.txt") casks to brew_casks.txt"

# Export taps
brew tap > "$DOTFILES_DIR/brew_taps.txt"
echo "📋 Exported $(wc -l < "$DOTFILES_DIR/brew_taps.txt") taps to brew_taps.txt"

# Export services
brew services list > "$DOTFILES_DIR/brew_services.txt"
echo "📋 Exported brew services to brew_services.txt"

echo ""
echo "✅ Package export complete!"
echo "💡 Files created:"
echo "   • Brewfile (use with 'brew bundle install')"
echo "   • brew_formulas.txt"
echo "   • brew_casks.txt" 
echo "   • brew_taps.txt"
echo "   • brew_services.txt"