# Homebrew paths without spawning `brew shellenv` for every shell.
if test -d /opt/homebrew
    set --global --export HOMEBREW_PREFIX /opt/homebrew
    set --global --export HOMEBREW_CELLAR /opt/homebrew/Cellar
    set --global --export HOMEBREW_REPOSITORY /opt/homebrew
else if test -d /usr/local/Homebrew
    set --global --export HOMEBREW_PREFIX /usr/local
    set --global --export HOMEBREW_CELLAR /usr/local/Cellar
    set --global --export HOMEBREW_REPOSITORY /usr/local/Homebrew
else if test -d /home/linuxbrew/.linuxbrew
    set --global --export HOMEBREW_PREFIX /home/linuxbrew/.linuxbrew
    set --global --export HOMEBREW_CELLAR "$HOMEBREW_PREFIX/Cellar"
    set --global --export HOMEBREW_REPOSITORY /home/linuxbrew/.linuxbrew/Homebrew
end

if set -q HOMEBREW_PREFIX
    fish_add_path --global --move "$HOMEBREW_PREFIX/bin" "$HOMEBREW_PREFIX/sbin"
    set --global --export INFOPATH "$HOMEBREW_PREFIX/share/info" $INFOPATH
end

# Force the native arm64 Homebrew binary when running on Apple Silicon.
if test (uname -m) = arm64; and test -x /opt/homebrew/bin/brew
    function brew --wraps=/opt/homebrew/bin/brew
        arch -arm64 /opt/homebrew/bin/brew $argv
    end
end
