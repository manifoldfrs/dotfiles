# Coinbase-specific environment. Keep credentials and machine-local values out
# of this tracked file.
set --global --export GO111MODULE on
set --global --export GOPROXY 'https://gomods.cbhq.net/'
set --global --export GONOSUMDB 'github.cbhq.net,coinbase.ghe.com'
set --global --export GOPATH "$HOME/go"

fish_add_path /opt/homebrew/bin
fish_add_path "$HOME/.local/bin"
fish_add_path "$HOME/.rbenv/shims"
fish_add_path "$GOPATH/bin"
