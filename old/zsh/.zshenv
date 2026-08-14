# Load Rust/Cargo environment (only if installed)
[[ -f "$HOME/.cargo/env" ]] && . "$HOME/.cargo/env"

# Load machine-local secrets and overrides.
[[ -f "$HOME/.zshenv.local" ]] && . "$HOME/.zshenv.local"
