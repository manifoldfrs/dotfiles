#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOTFILES_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$DOTFILES_DIR"

echo "=== Testing Dotfiles Scripts ==="

pass() { echo "[PASS] $1"; echo; }
fail() { echo "[FAIL] $1"; exit 1; }

# Test 1: syntax
echo "[TEST 1] Checking Bash and Fish syntax..."
for script in scripts/bootstrap.sh scripts/backup.sh scripts/stow.sh scripts/agent-commander.sh \
    stow/bin/.local/bin/agent-commander \
    stow/bin/.local/share/agent-guardrails/block-dangerous-bash.sh \
    stow/bin/.local/share/agent-guardrails/block-generated-edits.sh \
    stow/claude/.claude/hooks/block-dangerous-bash.sh \
    stow/claude/.claude/hooks/block-generated-edits.sh \
    stow/codex/.codex/hooks/block-dangerous-bash.sh \
    stow/codex/.codex/hooks/block-generated-edits.sh mcp_setup.sh; do
    bash -n "$script"
done
if command -v fish >/dev/null 2>&1; then
    while IFS= read -r -d '' fish_file; do
        fish -n "$fish_file"
    done < <(find stow/fish stow/fish-cb -name '*.fish' -print0)
else
    echo "[SKIP] fish not installed; Fish syntax validation skipped"
fi
pass "Shell syntax is valid"

# Test 2: portable Git config
echo "[TEST 2] Checking .gitconfig for forced SSH rewrites..."
! grep -E '^\s*insteadOf\s*=' stow/git/.gitconfig || fail ".gitconfig has an active insteadOf rewrite"
! grep -E '^\s*sshCommand\s*=' stow/git/.gitconfig || fail ".gitconfig has an active sshCommand"
pass "No active SSH rewrite in .gitconfig"

# Test 3: default Stow profile
echo "[TEST 3] Testing default Fish Stow profile..."
STOW_TEST_HOME="$(mktemp -d)"
STOW_TEST_BIN="$(mktemp -d)"
mkdir -p "$STOW_TEST_HOME/.agents/skills/tldr" "$STOW_TEST_HOME/.cbcode-home/.codex" "$STOW_TEST_HOME/.local/bin" "$STOW_TEST_HOME/.config/fish/conf.d"
touch "$STOW_TEST_HOME/.agents/skills/tldr/SKILL.md"
printf '%s\n' '# existing Fish aliases' >"$STOW_TEST_HOME/.config/fish/conf.d/aliases.fish"
ln -s "$(command -v stow)" "$STOW_TEST_BIN/stow"
if HOME="$STOW_TEST_HOME" PATH="$STOW_TEST_BIN:/usr/bin:/bin:/usr/sbin:/sbin" ./scripts/stow.sh apply >/tmp/stow-default.log 2>&1 \
    && HOME="$STOW_TEST_HOME" PATH="$STOW_TEST_BIN:/usr/bin:/bin:/usr/sbin:/sbin" ./scripts/stow.sh apply >>/tmp/stow-default.log 2>&1 \
    && [ -L "$STOW_TEST_HOME/.config/fish/config.fish" ] \
    && [ -L "$STOW_TEST_HOME/.config/fish/conf.d/catppuccin_macchiato_theme.fish" ] \
    && [ -L "$STOW_TEST_HOME/.config/fish/conf.d/aliases.fish" ] \
    && find "$STOW_TEST_HOME/.config/fish/conf.d" -name 'aliases.fish.backup.*' | grep -q . \
    && [ -L "$STOW_TEST_HOME/.config/starship.toml" ] \
    && [ -L "$STOW_TEST_HOME/.gitconfig" ] \
    && [ -L "$STOW_TEST_HOME/.config/nvim/init.lua" ] \
    && [ -L "$STOW_TEST_HOME/.config/herdr/config.toml" ] \
    && [ -L "$STOW_TEST_HOME/.pi/agent/themes/catppuccin-macchiato.json" ] \
    && [ -L "$STOW_TEST_HOME/.local/bin/agent-commander" ] \
    && [ -L "$STOW_TEST_HOME/.agents/skills/herdr" ] \
    && [ ! -e "$STOW_TEST_HOME/AGENTS.md" ]; then
    pass "Default Fish Stow profile is idempotent"
else
    cat /tmp/stow-default.log
    fail "Default Fish Stow profile failed"
fi

# Test 4: Coinbase profile conflict handling
echo "[TEST 4] Testing Coinbase Fish Stow profile..."
CB_TEST_HOME="$(mktemp -d)"
CB_TEST_BIN="$(mktemp -d)"
mkdir -p "$CB_TEST_HOME/.config/fish/conf.d" "$CB_TEST_HOME/.config/fish/functions"
ln -s "$(command -v stow)" "$CB_TEST_BIN/stow"
ln -s "$(command -v git)" "$CB_TEST_BIN/git"
touch "$CB_TEST_HOME/.config/fish/conf.d/coinbase.fish" "$CB_TEST_HOME/.gitconfig.local"
if HOME="$CB_TEST_HOME" PATH="$CB_TEST_BIN:/usr/bin:/bin:/usr/sbin:/sbin" ./scripts/stow.sh --cb apply >/tmp/stow-cb.log 2>&1 \
    && [ -L "$CB_TEST_HOME/.config/fish/conf.d/coinbase.fish" ] \
    && [ -L "$CB_TEST_HOME/.config/fish/functions/cbcode.fish" ] \
    && [ -L "$CB_TEST_HOME/.config/fish/functions/find_pr.fish" ] \
    && [ -L "$CB_TEST_HOME/.gitconfig.local" ] \
    && find "$CB_TEST_HOME/.config/fish/conf.d" -name 'coinbase.fish.backup.*' | grep -q . \
    && find "$CB_TEST_HOME" -name '.gitconfig.local.backup.*' | grep -q .; then
    pass "Coinbase Fish profile backs up conflicts"
else
    cat /tmp/stow-cb.log
    fail "Coinbase Fish Stow profile failed"
fi

# Test 5: Coinbase backup stays within Fish-CB and Git-CB
echo "[TEST 5] Testing Coinbase backup profile..."
BACKUP_HOME="$(mktemp -d)"
mkdir -p "$BACKUP_HOME/.config/fish/conf.d"
BACKUP_ORIGINAL_DIR="$(mktemp -d)"
cp stow/fish-cb/.config/fish/conf.d/coinbase.fish "$BACKUP_ORIGINAL_DIR/coinbase.fish"
cp stow/git-cb/.gitconfig.local "$BACKUP_ORIGINAL_DIR/gitconfig.local"
restore_coinbase_backup_fixtures() {
    cp "$BACKUP_ORIGINAL_DIR/coinbase.fish" stow/fish-cb/.config/fish/conf.d/coinbase.fish
    cp "$BACKUP_ORIGINAL_DIR/gitconfig.local" stow/git-cb/.gitconfig.local
}
trap restore_coinbase_backup_fixtures EXIT
printf '%s\n' '# Coinbase Fish backup test' >"$BACKUP_HOME/.config/fish/conf.d/coinbase.fish"
printf '%s\n' '[user]' '  email = test@example.com' >"$BACKUP_HOME/.gitconfig.local"
HOME="$BACKUP_HOME" ./scripts/backup.sh --cb >/tmp/backup-cb.log 2>&1
cmp -s "$BACKUP_HOME/.config/fish/conf.d/coinbase.fish" stow/fish-cb/.config/fish/conf.d/coinbase.fish \
    || fail "Coinbase Fish backup did not update its owned fragment"
restore_coinbase_backup_fixtures
trap - EXIT
pass "Coinbase backup writes only owned packages"

# Test 6: selected theme and prompt invariants
echo "[TEST 6] Checking theme and prompt configuration..."
grep -q '^theme = Catppuccin Macchiato$' stow/ghostty/.config/ghostty/config
grep -q '^font-family = MonoLisaCode$' stow/ghostty/.config/ghostty/config
grep -q '^font-size = 14$' stow/ghostty/.config/ghostty/config
grep -q 'name = "catppuccin"' stow/herdr/.config/herdr/config.toml
grep -q 'catppuccin-macchiato' stow/nvim/.config/nvim/lua/plugins/colorscheme.lua
grep -q '"theme": "catppuccin-macchiato"' stow/pi/.pi/agent/settings.json
test "$(rg '^\s+__git\.create_abbr ' stow/fish/.config/fish/functions/__git.init.fish | wc -l | tr -d ' ')" = 171
grep -q 'detect_extensions = \[\]' stow/fish/.config/starship.toml
for glyph in '󰘧' '' '' '' '' ''; do
    grep -Fq "$glyph" stow/fish/.config/starship.toml \
        || fail "Starship is missing intended glyph: $glyph"
done
pass "Macchiato, MonoLisa, Nerd Font glyphs, 171 Git abbreviations, and bounded Starship detection are configured"

# Test 7: Neovim plugin safety (best effort)
echo "[TEST 7] Running Neovim plugin safety checks..."
if command -v nvim >/dev/null 2>&1; then
    bash test/nvim_plugin_safety.sh --base-ref HEAD >/tmp/nvim-plugin-safety.log 2>&1 \
        || { cat /tmp/nvim-plugin-safety.log; fail "Neovim plugin safety checks failed"; }
    pass "Neovim plugin safety checks passed"
else
    pass "Neovim not installed; plugin safety skipped"
fi

echo "=== ALL TESTS PASSED ==="
