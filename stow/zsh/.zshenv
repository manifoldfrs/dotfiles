# Load Rust/Cargo environment (only if installed)
[[ -f "$HOME/.cargo/env" ]] && . "$HOME/.cargo/env"

# Load machine-local secrets and overrides.
[[ -f "$HOME/.zshenv.local" ]] && . "$HOME/.zshenv.local"

# Prefer pinned agent tool shims when the sibling repo is installed.
if [[ -n "${AGENT_COMMANDER_DIR:-}" ]]; then
  _agent_commander_dir="$AGENT_COMMANDER_DIR"
elif [[ -d "$HOME/agent-commander/.git" ]]; then
  _agent_commander_dir="$HOME/agent-commander"
else
  _agent_commander_dir="$HOME/github/agent-commander"
fi
[[ -d "$_agent_commander_dir/bin" ]] && export PATH="$_agent_commander_dir/bin:$PATH"
unset _agent_commander_dir
