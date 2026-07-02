#!/usr/bin/env bash
# Codex hook wrapper for the shared dangerous-bash guardrail.

exec "$HOME/.local/share/agent-guardrails/block-dangerous-bash.sh"

