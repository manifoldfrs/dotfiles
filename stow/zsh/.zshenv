# Load Rust/Cargo environment (only if installed)
[[ -f "$HOME/.cargo/env" ]] && . "$HOME/.cargo/env"

# Load machine-local secrets and overrides.
[[ -f "$HOME/.zshenv.local" ]] && . "$HOME/.zshenv.local"

# Prefer pinned agent tool shims when the sibling repo is installed.
_agent_commander_dir="${AGENT_COMMANDER_DIR:-$HOME/github/agent-commander}"
[[ -d "$_agent_commander_dir/bin" ]] && export PATH="$_agent_commander_dir/bin:$PATH"
unset _agent_commander_dir
