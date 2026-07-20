#!/bin/bash
set -e

echo "=== Testing Dotfiles Scripts ==="
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOTFILES_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$DOTFILES_DIR"

# Test 1: Verify no syntax errors
echo "[TEST 1] Checking shell script syntax..."
bash -n scripts/bootstrap.sh
bash -n scripts/backup.sh
bash -n scripts/stow.sh
bash -n scripts/agent-commander.sh
bash -n stow/bin/.local/bin/agent-commander
bash -n stow/bin/.local/share/agent-guardrails/block-dangerous-bash.sh
bash -n stow/bin/.local/share/agent-guardrails/block-generated-edits.sh
bash -n stow/claude/.claude/hooks/block-dangerous-bash.sh
bash -n stow/claude/.claude/hooks/block-generated-edits.sh
bash -n stow/codex/.codex/hooks/block-dangerous-bash.sh
bash -n stow/codex/.codex/hooks/block-generated-edits.sh
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
OMZ_TEST_HOME="$(mktemp -d)"
if HOME="$OMZ_TEST_HOME" ZSH="$OMZ_TEST_HOME/.oh-my-zsh" sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended --keep-zshrc \
    && [ -d "$OMZ_TEST_HOME/.oh-my-zsh" ]; then
    echo "[PASS] Oh My Zsh installed"
else
    echo "[FAIL] Oh My Zsh installation failed"
    exit 1
fi
echo ""

# Test 4: Test zsh-syntax-highlighting plugin
echo "[TEST 4] Installing zsh-syntax-highlighting..."
git clone https://github.com/zsh-users/zsh-syntax-highlighting.git "$OMZ_TEST_HOME/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting"
if [ -d "$OMZ_TEST_HOME/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting" ]; then
    echo "[PASS] zsh-syntax-highlighting installed"
else
    echo "[FAIL] zsh-syntax-highlighting installation failed"
    exit 1
fi
echo ""

# Test 5: Test Stow package layout
echo "[TEST 5] Testing GNU Stow package layout..."
STOW_TEST_HOME="$(mktemp -d)"
STOW_TEST_BIN="$(mktemp -d)"
mkdir -p "$STOW_TEST_HOME/.agents/skills/tldr" "$STOW_TEST_HOME/.cbcode-home/.codex" "$STOW_TEST_HOME/.local/bin"
touch "$STOW_TEST_HOME/.agents/skills/tldr/SKILL.md"
ln -s "$DOTFILES_DIR/stow/tmux/.tmux.conf" "$STOW_TEST_HOME/.tmux.conf"
ln -s "$DOTFILES_DIR/stow/bin/.local/bin/tmux-sessionizer" "$STOW_TEST_HOME/.local/bin/tmux-sessionizer"
ln -s "$(command -v stow)" "$STOW_TEST_BIN/stow"
if HOME="$STOW_TEST_HOME" PATH="$STOW_TEST_BIN:/usr/bin:/bin:/usr/sbin:/sbin" ./scripts/stow.sh apply > /tmp/stow-default.log 2>&1 \
    && HOME="$STOW_TEST_HOME" PATH="$STOW_TEST_BIN:/usr/bin:/bin:/usr/sbin:/sbin" ./scripts/stow.sh apply >> /tmp/stow-default.log 2>&1 \
    && [ -L "$STOW_TEST_HOME/.zshrc" ] \
    && [ -L "$STOW_TEST_HOME/.gitconfig" ] \
    && [ -L "$STOW_TEST_HOME/.config/nvim/init.lua" ] \
    && [ -L "$STOW_TEST_HOME/.config/herdr/config.toml" ] \
    && [ -L "$STOW_TEST_HOME/.local/bin/agent-commander" ] \
    && [ -L "$STOW_TEST_HOME/.config/opencode/opencode.jsonc" ] \
    && [ -L "$STOW_TEST_HOME/.config/opencode/tui.json" ] \
    && [ -L "$STOW_TEST_HOME/.config/amp/settings.json" ] \
    && [ -L "$STOW_TEST_HOME/.config/amp/AGENTS.md" ] \
    && [ -L "$STOW_TEST_HOME/.claude/settings.local.json" ] \
    && [ -L "$STOW_TEST_HOME/.codex/config.toml" ] \
    && [ -L "$STOW_TEST_HOME/.codex/hooks.json" ] \
    && [ -L "$STOW_TEST_HOME/.codex/hooks/block-dangerous-bash.sh" ] \
    && [ -L "$STOW_TEST_HOME/.codex/hooks/block-generated-edits.sh" ] \
    && [ -L "$STOW_TEST_HOME/.codex/themes/tokyonight-frsh.tmTheme" ] \
    && [ -L "$STOW_TEST_HOME/.cbcode-home/.codex/themes/tokyonight-frsh.tmTheme" ] \
    && [ -L "$STOW_TEST_HOME/.agents/skills/tldr" ] \
    && [ -f "$STOW_TEST_HOME/.agents/skills/tldr/SKILL.md" ] \
    && [ -L "$STOW_TEST_HOME/.agents/skills/herdr" ] \
    && [ -f "$STOW_TEST_HOME/.agents/skills/herdr/SKILL.md" ] \
    && ! find "$STOW_TEST_HOME/.agents/skills" -maxdepth 1 -name 'tldr.backup.*' | grep -q . \
    && find "$STOW_TEST_HOME/.agents/skill-backups" -path '*/tldr.backup.*/SKILL.md' | grep -q . \
    && [ -L "$STOW_TEST_HOME/.claude/skills/herdr/SKILL.md" ] \
    && [ -L "$STOW_TEST_HOME/.pi/agent/settings.json" ] \
    && [ ! -L "$STOW_TEST_HOME/.tmux.conf" ] \
    && [ ! -L "$STOW_TEST_HOME/.local/bin/tmux-sessionizer" ] \
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

# Test 8: Verify .zshrc has current shell config
echo "[TEST 8] Checking .zshrc configuration..."
if grep -q 'powerlevel10k.zsh-theme' "$STOW_TEST_HOME/.zshrc" \
    && grep -q 'zsh-syntax-highlighting.zsh' "$STOW_TEST_HOME/.zshrc" \
    && grep -q '.zshrc.local' "$STOW_TEST_HOME/.zshrc"; then
    echo "[PASS] .zshrc has current shell config"
else
    echo "[FAIL] .zshrc missing current shell config"
    exit 1
fi
echo ""

# Test 9: Neovim plugin safety checks (best-effort)
echo "[TEST 9] Running Neovim plugin safety checks..."
if command -v nvim >/dev/null 2>&1; then
    if bash test/nvim_plugin_safety.sh --base-ref HEAD > /tmp/nvim-plugin-safety.log 2>&1; then
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
