# Machine-specific Fish overrides and secrets are intentionally untracked.
# Load them before the remaining conf.d fragments.
if test -f "$HOME/.config/fish/local.fish"
    source "$HOME/.config/fish/local.fish"
end
