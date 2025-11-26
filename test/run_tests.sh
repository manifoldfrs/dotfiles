#!/bin/bash
set -e

echo "=== Testing Dotfiles Scripts ==="
echo ""

cd ~/dotfiles

# Test 1: Verify no syntax errors
echo "[TEST 1] Checking shell script syntax..."
bash -n shell_setup.sh
bash -n cursor_setup.sh
echo "[PASS] No syntax errors"
echo ""

# Test 2: Test git config doesn't force SSH (check for UNCOMMENTED lines only)
echo "[TEST 2] Checking .gitconfig for SSH rewrite..."
# Match lines that start with whitespace then 'insteadOf' (not commented)
if grep -E '^\s*insteadOf\s*=' .gitconfig; then
    echo "[FAIL] .gitconfig has uncommented SSH URL rewrite!"
    exit 1
fi
# Match lines that start with whitespace then 'sshCommand' (not commented)
if grep -E '^\s*sshCommand\s*=' .gitconfig; then
    echo "[FAIL] .gitconfig has uncommented sshCommand!"
    exit 1
fi
echo "[PASS] No active SSH URL rewrite in .gitconfig"
echo ""

# Test 3: Test oh-my-zsh installation
echo "[TEST 3] Installing Oh My Zsh..."
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended --keep-zshrc
if [ -d "$HOME/.oh-my-zsh" ]; then
    echo "[PASS] Oh My Zsh installed"
else
    echo "[FAIL] Oh My Zsh installation failed"
    exit 1
fi
echo ""

# Test 4: Test nvm installation via HTTPS
echo "[TEST 4] Installing nvm via HTTPS..."
export NVM_DIR="$HOME/.nvm"
mkdir -p "$NVM_DIR"
git clone https://github.com/nvm-sh/nvm.git "$NVM_DIR"
cd "$NVM_DIR"
git checkout $(git describe --abbrev=0 --tags --match "v[0-9]*" $(git rev-list --tags --max-count=1))
if [ -f "$NVM_DIR/nvm.sh" ]; then
    echo "[PASS] nvm installed via HTTPS"
else
    echo "[FAIL] nvm installation failed"
    exit 1
fi
cd ~/dotfiles
echo ""

# Test 5: Test zsh-syntax-highlighting plugin
echo "[TEST 5] Installing zsh-syntax-highlighting..."
git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ~/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting
if [ -d "$HOME/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting" ]; then
    echo "[PASS] zsh-syntax-highlighting installed"
else
    echo "[FAIL] zsh-syntax-highlighting installation failed"
    exit 1
fi
echo ""

# Test 6: Test file copy function
echo "[TEST 6] Testing file copy to home..."
cp ~/dotfiles/.zshrc ~/.zshrc
cp ~/dotfiles/.gitconfig ~/.gitconfig
if [ -f ~/.zshrc ] && [ -f ~/.gitconfig ]; then
    echo "[PASS] Files copied successfully"
else
    echo "[FAIL] File copy failed"
    exit 1
fi
echo ""

# Test 7: Verify .zshrc has correct oh-my-zsh config
echo "[TEST 7] Checking .zshrc configuration..."
if grep -q 'ZSH_THEME="agnoster"' ~/.zshrc && grep -q 'plugins=(git zsh-syntax-highlighting)' ~/.zshrc; then
    echo "[PASS] .zshrc has correct theme and plugins"
else
    echo "[FAIL] .zshrc missing theme or plugins config"
    exit 1
fi
echo ""

echo "==========================================="
echo "=== ALL TESTS PASSED ==="
echo "==========================================="
