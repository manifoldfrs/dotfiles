status is-interactive; or return
command -q fzf; or return

# Homebrew fzf can emit its Fish integration directly. Preserve Ctrl-F for
# history search from the previous shell configuration.
fzf --fish | source
if functions -q fzf-history-widget
    bind ctrl-f fzf-history-widget
    bind --mode insert ctrl-f fzf-history-widget
end
