#!/bin/bash
set -e

echo "=== Testing Dotfiles Scripts ==="
echo ""

cd ~/dotfiles

# Test 1: Verify no syntax errors
echo "[TEST 1] Checking shell script syntax..."
bash -n scripts/bootstrap.sh
bash -n scripts/backup.sh
bash -n scripts/stow.sh
bash -n mcp_setup.sh
echo "[PASS] No syntax errors"
echo ""

# Test 2: Test git config doesn't force SSH (check for UNCOMMENTED lines only)
echo "[TEST 2] Checking .gitconfig for SSH rewrite..."
# Match lines that start with whitespace then 'insteadOf' (not commented)
if grep -E '^\s*insteadOf\s*=' stow/git/.gitconfig; then
    echo "[FAIL] .gitconfig has uncommented SSH URL rewrite!"
    exit 1
fi
# Match lines that start with whitespace then 'sshCommand' (not commented)
if grep -E '^\s*sshCommand\s*=' stow/git/.gitconfig; then
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

# Test 4: Test zsh-syntax-highlighting plugin
echo "[TEST 4] Installing zsh-syntax-highlighting..."
git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ~/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting
if [ -d "$HOME/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting" ]; then
    echo "[PASS] zsh-syntax-highlighting installed"
else
    echo "[FAIL] zsh-syntax-highlighting installation failed"
    exit 1
fi
echo ""

# Test 5: Test Stow package layout
echo "[TEST 5] Testing GNU Stow package layout..."
STOW_TEST_HOME="$(mktemp -d)"
stow --no-folding -R -t "$STOW_TEST_HOME" -d ~/dotfiles/stow zsh git ghostty tmux nvim bin opencode claude
if [ -L "$STOW_TEST_HOME/.zshrc" ] \
    && [ -L "$STOW_TEST_HOME/.gitconfig" ] \
    && [ -L "$STOW_TEST_HOME/.config/nvim/init.lua" ] \
    && [ -L "$STOW_TEST_HOME/.config/opencode/opencode.json" ] \
    && [ -L "$STOW_TEST_HOME/.config/opencode/tui.json" ] \
    && [ -L "$STOW_TEST_HOME/.claude/settings.local.json" ] \
    && [ ! -e "$STOW_TEST_HOME/AGENTS.md" ]; then
    echo "[PASS] Stow symlinks created successfully"
else
    echo "[FAIL] Stow symlink creation failed"
    exit 1
fi
echo ""

# Test 6: Verify .zshrc has correct oh-my-zsh config
echo "[TEST 6] Checking .zshrc configuration..."
if grep -q 'ZSH_THEME="robbyrussell"' "$STOW_TEST_HOME/.zshrc" && grep -q 'plugins=(git zsh-syntax-highlighting)' "$STOW_TEST_HOME/.zshrc"; then
    echo "[PASS] .zshrc has correct theme and plugins"
else
    echo "[FAIL] .zshrc missing theme or plugins config"
    exit 1
fi
echo ""

# Test 7: Neovim plugin safety checks (best-effort)
echo "[TEST 7] Running Neovim plugin safety checks..."
if command -v nvim >/dev/null 2>&1; then
    if bash test/nvim_plugin_safety.sh --base-ref HEAD --skip-tmux > /tmp/nvim-plugin-safety.log 2>&1; then
        echo "[PASS] Neovim plugin safety checks passed"
    else
        echo "[FAIL] Neovim plugin safety checks failed"
        echo "       See /tmp/nvim-plugin-safety.log for details"
        exit 1
    fi
else
    echo "[SKIP] nvim not installed; skipped plugin safety checks"
fi
echo ""

echo "==========================================="
echo "=== ALL TESTS PASSED ==="
echo "==========================================="
