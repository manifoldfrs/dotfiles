function cbcode --description 'Run cbcode with its isolated Codex home'
    set --local cb_home "$HOME/.cbcode-home"
    set --local --export HOME "$cb_home"
    command cbcode $argv
end
