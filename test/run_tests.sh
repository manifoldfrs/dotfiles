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

# Test 6: Test Coinbase Stow profile backs up first-run conflicts
echo "[TEST 6] Testing Coinbase Stow conflict backup..."
CB_TEST_HOME="$(mktemp -d)"
CB_TEST_BIN="$(mktemp -d)"
ln -s "$(command -v stow)" "$CB_TEST_BIN/stow"
ln -s "$(command -v git)" "$CB_TEST_BIN/git"
touch "$CB_TEST_HOME/.gitignore_global" "$CB_TEST_HOME/.zshrc.local" "$CB_TEST_HOME/.gitconfig.local"
if HOME="$CB_TEST_HOME" PATH="$CB_TEST_BIN:/usr/bin:/bin:/usr/sbin:/sbin" ./scripts/stow.sh --cb apply > /tmp/stow-cb.log 2>&1 \
    && [ -L "$CB_TEST_HOME/.gitignore_global" ] \
    && [ -L "$CB_TEST_HOME/.zshrc.local" ] \
    && [ -L "$CB_TEST_HOME/.gitconfig.local" ] \
    && [ -e "$CB_TEST_HOME"/.gitignore_global.backup.* ] \
    && [ -e "$CB_TEST_HOME"/.zshrc.local.backup.* ] \
    && [ -e "$CB_TEST_HOME"/.gitconfig.local.backup.* ]; then
    echo "[PASS] Coinbase Stow profile backs up conflicting local files"
else
    echo "[FAIL] Coinbase Stow conflict backup failed"
    echo "       See /tmp/stow-cb.log for details"
    exit 1
fi
echo ""

# Test 7: Test Coinbase backup only writes local override packages
echo "[TEST 7] Testing Coinbase backup profile..."
BACKUP_TEST_HOME="$(mktemp -d)"
BACKUP_TEST_TMP="$(mktemp -d)"
cp stow/zsh-cb/.zshrc.local "$BACKUP_TEST_TMP/.zshrc.local"
cp stow/git-cb/.gitconfig.local "$BACKUP_TEST_TMP/.gitconfig.local"
restore_coinbase_backup_test() {
    cp "$BACKUP_TEST_TMP/.zshrc.local" stow/zsh-cb/.zshrc.local
    cp "$BACKUP_TEST_TMP/.gitconfig.local" stow/git-cb/.gitconfig.local
}
trap restore_coinbase_backup_test EXIT
printf '%s\n' '# test Coinbase zsh override' > "$BACKUP_TEST_HOME/.zshrc.local"
printf '%s\n' '[user]' '  email = test@example.com' > "$BACKUP_TEST_HOME/.gitconfig.local"
if HOME="$BACKUP_TEST_HOME" ./scripts/backup.sh --cb > /tmp/backup-cb.log 2>&1 \
    && cmp -s "$BACKUP_TEST_HOME/.zshrc.local" stow/zsh-cb/.zshrc.local \
    && cmp -s "$BACKUP_TEST_HOME/.gitconfig.local" stow/git-cb/.gitconfig.local; then
    echo "[PASS] Coinbase backup profile writes local override packages"
else
    echo "[FAIL] Coinbase backup profile failed"
    echo "       See /tmp/backup-cb.log for details"
    exit 1
fi
restore_coinbase_backup_test
BACKUP_LINK_HOME="$(mktemp -d)"
ln -s "$(pwd)/stow/zsh-cb/.zshrc.local" "$BACKUP_LINK_HOME/.zshrc.local"
ln -s "$(pwd)/stow/git-cb/.gitconfig.local" "$BACKUP_LINK_HOME/.gitconfig.local"
if HOME="$BACKUP_LINK_HOME" ./scripts/backup.sh --cb > /tmp/backup-cb-linked.log 2>&1; then
    echo "[PASS] Coinbase backup profile handles Stow-managed override symlinks"
else
    echo "[FAIL] Coinbase backup profile failed on Stow-managed symlinks"
    echo "       See /tmp/backup-cb-linked.log for details"
    exit 1
fi
trap - EXIT
echo ""

# Test 8: Verify .zshrc has correct oh-my-zsh config
echo "[TEST 8] Checking .zshrc configuration..."
if grep -q 'ZSH_THEME="robbyrussell"' "$STOW_TEST_HOME/.zshrc" && grep -q 'plugins=(git zsh-syntax-highlighting)' "$STOW_TEST_HOME/.zshrc"; then
    echo "[PASS] .zshrc has correct theme and plugins"
else
    echo "[FAIL] .zshrc missing theme or plugins config"
    exit 1
fi
echo ""

# Test 9: Neovim plugin safety checks (best-effort)
echo "[TEST 9] Running Neovim plugin safety checks..."
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
