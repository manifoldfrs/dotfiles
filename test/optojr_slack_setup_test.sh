#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOTFILES_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
WRAPPER="$DOTFILES_DIR/scripts/setup-optojr-slack-bot.sh"

TEST_DIR=$(mktemp -d)
MOCK_OPTOJR_ROOT="$TEST_DIR/optojr"
CAPTURE="$TEST_DIR/capture"
mkdir -p "$MOCK_OPTOJR_ROOT/scripts"
trap 'rm -rf "$TEST_DIR"' EXIT

cat >"$MOCK_OPTOJR_ROOT/scripts/setup-slack-relay-client.sh" <<'MOCK'
#!/bin/bash
set -euo pipefail
printf 'relay-setup-called' >"$OPTOJR_WRAPPER_TEST_CAPTURE"
MOCK
chmod +x "$MOCK_OPTOJR_ROOT/scripts/setup-slack-relay-client.sh"

OPTOJR_ROOT="$MOCK_OPTOJR_ROOT" \
  OPTOJR_WRAPPER_TEST_CAPTURE="$CAPTURE" \
  "$WRAPPER" >"$TEST_DIR/output" 2>"$TEST_DIR/error"

[[ "$(cat "$CAPTURE")" == "relay-setup-called" ]]
grep -Fq 'Slack OAuth is owned only by the hosted OptoJr service.' "$TEST_DIR/output"
! grep -Fq 'oauth.v2.access' "$WRAPPER"
! grep -Fq 'pi-optojr-slack-credentials' "$WRAPPER"

set +e
OPTOJR_ROOT="$TEST_DIR/missing" "$WRAPPER" >"$TEST_DIR/missing-output" 2>"$TEST_DIR/missing-error"
status=$?
set -e
[[ "$status" -ne 0 ]]
grep -Fq 'OptoJr relay setup is unavailable' "$TEST_DIR/missing-error"

printf 'OptoJr dotfiles wrapper delegates only to hosted relay setup\n'
