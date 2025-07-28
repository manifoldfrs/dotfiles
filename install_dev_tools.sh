#!/bin/bash

# Development Tools Installation Script
# Installs all the development tools and packages used on this machine

set -e

echo "🛠️  Installing development tools and packages..."

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "❌ Homebrew is required but not installed. Please install Homebrew first:"
    echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
    exit 1
fi

echo "📦 Installing Homebrew packages..."

# Essential CLI tools
echo "Installing essential CLI tools..."
brew install \
    awscli \
    bat \
    diff-so-fancy \
    esc \
    exa \
    fd \
    fzf \
    jq \
    tree \
    tldr \
    repomix

# Programming languages and version managers
echo "Installing programming languages and version managers..."
brew install \
    node \
    yarn \
    python@3.12 \
    python@3.13 \
    pyenv \
    rbenv \
    ruby-build \
    ruby-install \
    chruby \
    postgresql@14 \
    redis

# Development tools
echo "Installing development tools..."
brew install \
    cmake \
    gcc \
    openjdk@11 \
    pulumi \
    exercism

# Databases and data tools
echo "Installing databases and data tools..."
brew install \
    sqlite \
    tesseract

# Casks (applications)
echo "Installing applications via Homebrew Cask..."
brew install --cask \
    font-jetbrains-mono-nerd-font \
    ngrok

# Setup fzf key bindings and fuzzy completion
echo "🔧 Setting up fzf..."
if [ -f /opt/homebrew/opt/fzf/install ]; then
    /opt/homebrew/opt/fzf/install --key-bindings --completion --no-update-rc
fi

# Setup pyenv
echo "🐍 Setting up pyenv..."
if command -v pyenv &> /dev/null; then
    # Install latest Python versions
    echo "Installing Python 3.12 and 3.13 via pyenv..."
    pyenv install 3.12.0 || echo "Python 3.12.0 already installed or failed"
    pyenv install 3.13.0 || echo "Python 3.13.0 already installed or failed"
    pyenv global 3.12.0
fi

# Setup rbenv
echo "💎 Setting up rbenv..."
if command -v rbenv &> /dev/null; then
    # Install latest Ruby
    echo "Installing latest Ruby via rbenv..."
    rbenv install 3.1.0 || echo "Ruby 3.1.0 already installed or failed"
    rbenv global 3.1.0
fi

# Setup nvm (Node Version Manager)
echo "🟩 Setting up nvm..."
if [ ! -d "$HOME/.nvm" ]; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    
    # Install latest LTS Node
    echo "Installing Node.js LTS via nvm..."
    nvm install --lts
    nvm use --lts
    nvm alias default lts/*
fi

echo ""
echo "✅ Development tools installation complete!"
echo ""
echo "💡 Additional setup:"
echo "   • AWS CLI: Configure with 'aws configure'"
echo "   • SSH keys: Generate with 'ssh-keygen -t ed25519 -C \"your_email@example.com\"'"
echo "   • GPG keys: Set up for git commit signing"
echo "   • IDE extensions: Run ./install_cursor_extensions.sh"
echo ""
echo "🔄 Please restart your terminal or source ~/.zshrc for all changes to take effect"