#!/bin/bash
set -euo pipefail

OPTOJR_ROOT="${OPTOJR_ROOT:-$HOME/code/optoai/optojr}"
RELAY_SETUP="$OPTOJR_ROOT/scripts/setup-slack-relay-client.sh"

if [[ ! -x "$RELAY_SETUP" ]]; then
  printf 'OptoJr relay setup is unavailable at %s\n' "$RELAY_SETUP" >&2
  exit 1
fi

printf 'Slack OAuth is owned only by the hosted OptoJr service.\n'
printf 'Continuing with hosted relay credential setup.\n\n'
exec "$RELAY_SETUP"
