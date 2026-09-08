# User and tool paths. fish_add_path is idempotent and avoids duplicate entries.
fish_add_path "$HOME/.local/bin"
fish_add_path "$HOME/.opencode/bin"
fish_add_path "$HOME/.config/opencode/scripts"
fish_add_path "$HOME/.cargo/bin"
fish_add_path "$HOME/.deno/bin"
fish_add_path "$HOME/.bun/bin"
fish_add_path "$HOME/.pyenv/bin"
fish_add_path "$HOME/.pyenv/shims"
fish_add_path "$HOME/.local/opt/go/bin"
fish_add_path "$HOME/go/bin"
fish_add_path "/Applications/Postgres.app/Contents/Versions/latest/bin"
fish_add_path "/Applications/Ghostty.app/Contents/MacOS"

# Keep Ruby and Bundler together, even when an older shell passed down rbenv shims.
if set -q HOMEBREW_PREFIX; and test -x "$HOMEBREW_PREFIX/opt/ruby/bin/ruby"
    fish_add_path --path --move "$HOMEBREW_PREFIX/opt/ruby/bin"
end
