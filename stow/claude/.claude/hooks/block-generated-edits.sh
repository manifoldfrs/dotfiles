#!/usr/bin/env bash
# Claude Code hook wrapper for the shared generated-file guardrail.

exec "$HOME/.local/share/agent-guardrails/block-generated-edits.sh"
