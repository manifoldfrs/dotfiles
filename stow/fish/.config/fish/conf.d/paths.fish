# User and tool paths. fish_add_path is idempotent and avoids duplicate entries.
fish_add_path "$HOME/.local/bin"
fish_add_path "$HOME/.opencode/bin"
fish_add_path "$HOME/.config/opencode/scripts"
fish_add_path "$HOME/.cargo/bin"
fish_add_path "$HOME/.deno/bin"
fish_add_path "$HOME/.bun/bin"
fish_add_path "$HOME/.pyenv/bin"
fish_add_path "$HOME/.pyenv/shims"
fish_add_path "$HOME/.rbenv/bin"
fish_add_path "$HOME/.rbenv/shims"
fish_add_path "$HOME/.local/opt/go/bin"
fish_add_path "$HOME/go/bin"
fish_add_path "/Applications/Postgres.app/Contents/Versions/latest/bin"
fish_add_path "/Applications/Ghostty.app/Contents/MacOS"

# Prefer pinned agent tool shims when the sibling repository is installed.
if set -q AGENT_COMMANDER_DIR; and test -d "$AGENT_COMMANDER_DIR/bin"
    fish_add_path "$AGENT_COMMANDER_DIR/bin"
else if test -d "$HOME/agent-commander/.git"
    fish_add_path "$HOME/agent-commander/bin"
else if test -d "$HOME/code/personal/agent-commander/bin"
    fish_add_path "$HOME/code/personal/agent-commander/bin"
end
