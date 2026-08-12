# Machine-specific Fish overrides and secrets are intentionally untracked.
# Load them before the remaining conf.d fragments so path decisions can use
# variables such as AGENT_COMMANDER_DIR.
if test -f "$HOME/.config/fish/local.fish"
    source "$HOME/.config/fish/local.fish"
end
