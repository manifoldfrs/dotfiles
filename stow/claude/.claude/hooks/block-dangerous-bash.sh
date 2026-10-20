#!/usr/bin/env bash
# Claude Code hook wrapper for the shared dangerous-bash guardrail.

exec "$HOME/.local/share/agent-guardrails/block-dangerous-bash.sh"
