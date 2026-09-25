#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOTFILES_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$DOTFILES_DIR"

echo "=== Testing Dotfiles Scripts ==="

pass() { echo "[PASS] $1"; echo; }
fail() { echo "[FAIL] $1"; exit 1; }

# Test 1: syntax
echo "[TEST 1] Checking Bash syntax..."
for script in scripts/bootstrap.sh scripts/backup.sh scripts/stow.sh \
    scripts/setup-optojr-slack-bot.sh \
    stow/bash/.bash_profile stow/bash/.bashrc \
    stow/bash/.config/bash/aliases.bash \
    stow/bash/.config/bash/environment.bash \
    stow/bash/.config/bash/functions.bash \
    stow/bin/.local/share/agent-guardrails/block-dangerous-bash.sh \
    stow/bin/.local/share/agent-guardrails/block-generated-edits.sh \
    stow/claude/.claude/hooks/block-dangerous-bash.sh \
    stow/claude/.claude/hooks/block-generated-edits.sh \
    stow/codex/.codex/hooks/block-dangerous-bash.sh \
    stow/codex/.codex/hooks/block-generated-edits.sh mcp_setup.sh; do
    bash -n "$script"
done
pass "Shell syntax is valid"

bash test/bash_path_test.sh "$DOTFILES_DIR"
bash test/stow_preflight_test.sh "$DOTFILES_DIR"

# Test 2: portable Git config
echo "[TEST 2] Checking .gitconfig for forced SSH rewrites..."
! grep -E '^\s*insteadOf\s*=' stow/git/.gitconfig || fail ".gitconfig has an active insteadOf rewrite"
! grep -E '^\s*sshCommand\s*=' stow/git/.gitconfig || fail ".gitconfig has an active sshCommand"
pass "No active SSH rewrite in .gitconfig"

# Test 3: default Stow profile
echo "[TEST 3] Testing default Bash Stow profile..."
STOW_TEST_HOME="$(mktemp -d)"
STOW_TEST_BIN="$(mktemp -d)"
mkdir -p "$STOW_TEST_HOME/.agents/skills/show-me" "$STOW_TEST_HOME/.claude/skills/show-me" "$STOW_TEST_HOME/.local/bin"
touch "$STOW_TEST_HOME/.agents/skills/show-me/SKILL.md"
printf '%s\n' '# existing Bash config' >"$STOW_TEST_HOME/.bashrc"
ln -s "$(command -v stow)" "$STOW_TEST_BIN/stow"
if HOME="$STOW_TEST_HOME" PATH="$STOW_TEST_BIN:/usr/bin:/bin:/usr/sbin:/sbin" ./scripts/stow.sh apply >/tmp/stow-default.log 2>&1 \
    && HOME="$STOW_TEST_HOME" PATH="$STOW_TEST_BIN:/usr/bin:/bin:/usr/sbin:/sbin" ./scripts/stow.sh apply >>/tmp/stow-default.log 2>&1 \
    && [ -L "$STOW_TEST_HOME/.bash_profile" ] \
    && [ -L "$STOW_TEST_HOME/.bashrc" ] \
    && [ -L "$STOW_TEST_HOME/.inputrc" ] \
    && find "$STOW_TEST_HOME" -maxdepth 1 -name '.bashrc.backup.*' | grep -q . \
    && [ -L "$STOW_TEST_HOME/.config/bash/environment.bash" ] \
    && [ -L "$STOW_TEST_HOME/.config/starship.toml" ] \
    && [ -L "$STOW_TEST_HOME/.gitconfig" ] \
    && [ -L "$STOW_TEST_HOME/.config/nvim/init.lua" ] \
    && [ -L "$STOW_TEST_HOME/.config/herdr/config.toml" ] \
    && [ -L "$STOW_TEST_HOME/.config/opencode/commands/lg.md" ] \
    && [ -L "$STOW_TEST_HOME/.config/opencode/plugins/typesafe-ai/package.json" ] \
    && [ -L "$STOW_TEST_HOME/.config/opencode/plugins/optojr-slack/package.json" ] \
    && [ -L "$STOW_TEST_HOME/.config/opencode/plugins/tui-conveniences/package.json" ] \
    && [ ! -e "$STOW_TEST_HOME/.config/opencode/plugins/typesafe-ai/node_modules" ] \
    && [ ! -e "$STOW_TEST_HOME/.config/opencode/plugins/optojr-slack/node_modules" ] \
    && [ ! -e "$STOW_TEST_HOME/.config/opencode/plugins/tui-conveniences/node_modules" ] \
    && [ -L "$STOW_TEST_HOME/.pi/agent/themes/tokyonight-frsh.json" ] \
    && [ -L "$STOW_TEST_HOME/.agents/skills/herdr" ] \
    && [ -L "$STOW_TEST_HOME/.claude/skills/herdr" ] \
    && [ ! -e "$STOW_TEST_HOME/AGENTS.md" ]; then
    pass "Default Bash Stow profile is idempotent"
else
    cat /tmp/stow-default.log
    fail "Default Bash Stow profile failed"
fi

# Test 4: selected theme and prompt invariants
echo "[TEST 4] Checking theme and prompt configuration..."
grep -q '^theme = TokyoNight Night$' stow/ghostty/.config/ghostty/config
grep -q '^command = /opt/homebrew/bin/bash --login$' stow/ghostty/.config/ghostty/config
grep -q '^shell-integration = bash$' stow/ghostty/.config/ghostty/config
grep -q '^font-family = MonoLisaCode$' stow/ghostty/.config/ghostty/config
grep -q '^font-size = 14$' stow/ghostty/.config/ghostty/config
grep -q 'name = "tokyo-night"' stow/herdr/.config/herdr/config.toml
grep -q '^default_shell = "/opt/homebrew/bin/bash"$' stow/herdr/.config/herdr/config.toml
grep -q 'vim.cmd.colorscheme("tokyonight")' stow/nvim/.config/nvim/lua/plugins/colorscheme.lua
grep -q '"theme": "tokyonight-frsh"' stow/pi/.pi/agent/settings.json
grep -q '"session.copy": "alt+y"' stow/opencode/.config/opencode/cli.json
grep -q 'name: "typesafe_evaluate"' stow/opencode/.config/opencode/plugins/typesafe-ai/src/index.ts
grep -q 'name: "optojr_slack_send"' stow/opencode/.config/opencode/plugins/optojr-slack/src/index.ts
[ ! -e stow/opencode/.config/opencode/plugins/cb-guards.ts ]
grep -q '^source_cached_init fzf-bash fzf --bash$' stow/bash/.bashrc
grep -Fq 'bind -m emacs-standard -x '\''"\C-f": __fzf_history__'\''' stow/bash/.bashrc
grep -q '^source_cached_init mise-activate mise activate bash$' stow/bash/.bashrc
grep -q '^source_cached_init zoxide-init zoxide init bash$' stow/bash/.bashrc
grep -q '^source_cached_init starship-full-init starship init bash --print-full-init$' stow/bash/.bashrc
grep -q 'detect_extensions = \[\]' stow/bash/.config/starship.toml
for glyph in '󰘧' '' '' '' '' ''; do
    grep -Fq "$glyph" stow/bash/.config/starship.toml \
        || fail "Starship is missing intended glyph: $glyph"
done
pass "Tokyo Night, MonoLisa, Nerd Font glyphs, FZF integration, and bounded Starship detection are configured"

# Test 5: Neovim plugin safety (best effort)
echo "[TEST 5] Running Neovim plugin safety checks..."
if command -v nvim >/dev/null 2>&1; then
    bash test/nvim_plugin_safety.sh --base-ref HEAD >/tmp/nvim-plugin-safety.log 2>&1 \
        || { cat /tmp/nvim-plugin-safety.log; fail "Neovim plugin safety checks failed"; }
    pass "Neovim plugin safety checks passed"
else
    pass "Neovim not installed; plugin safety skipped"
fi

# Test 6: OptoJr Slack setup
echo "[TEST 6] Testing OptoJr hosted relay setup..."
bash test/optojr_slack_setup_test.sh
pass "OptoJr Slack setup delegates only to the hosted relay"

echo "=== ALL TESTS PASSED ==="
