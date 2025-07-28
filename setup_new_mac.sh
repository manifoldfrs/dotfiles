#!/bin/bash

# Complete New Mac Setup Script
# This script sets up everything needed on a new MacBook

set -e

DOTFILES_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "🚀 Setting up your new MacBook..."
echo "This will install dotfiles, development tools, fonts, and applications."
echo ""

# Step 1: Install Homebrew if needed
echo "📋 Step 1: Checking Homebrew installation..."
if ! command -v brew &> /dev/null; then
    echo "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Add to PATH for current session
    eval "$(/opt/homebrew/bin/brew shellenv)"
else
    echo "✅ Homebrew already installed"
fi

# Step 2: Install dotfiles
echo ""
echo "📋 Step 2: Installing dotfiles..."
"$DOTFILES_DIR/install.sh"

# Step 3: Install fonts and Oh My Zsh
echo ""
echo "📋 Step 3: Installing fonts and Oh My Zsh..."
"$DOTFILES_DIR/setup_fonts.sh"

# Step 4: Install development tools
echo ""
echo "📋 Step 4: Installing development tools..."
read -p "Install development tools (Python, Node, Ruby, AWS CLI, etc.)? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    "$DOTFILES_DIR/install_dev_tools.sh"
fi

# Step 5: Setup Cursor extensions
echo ""
echo "📋 Step 5: Setting up Cursor IDE..."
read -p "Install Cursor extensions? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    "$DOTFILES_DIR/install_cursor_extensions.sh"
fi

# Step 6: Install from Brewfile if it exists
echo ""
echo "📋 Step 6: Installing packages from Brewfile..."
if [ -f "$DOTFILES_DIR/Brewfile" ]; then
    read -p "Install all packages from Brewfile? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd "$DOTFILES_DIR"
        brew bundle install
    fi
fi

echo ""
echo "🎉 New Mac setup complete!"
echo ""
echo "📝 Manual steps remaining:"
echo "   1. Setup SSH keys: ssh-keygen -t ed25519 -C 'your_email@example.com'"
echo "   2. Add SSH key to GitHub/GitLab"
echo "   3. Configure AWS CLI: aws configure"
echo "   4. Setup GPG keys for git signing"
echo "   5. Import browser bookmarks and settings"
echo "   6. Login to applications: Cursor, Warp, etc."
echo ""
echo "🔄 Restart your terminal/applications for all changes to take effect!"

# Optional: Open important applications
read -p "Open important setup pages? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    open "https://github.com/settings/keys" # GitHub SSH keys
    open "https://console.aws.amazon.com/" # AWS Console
fi