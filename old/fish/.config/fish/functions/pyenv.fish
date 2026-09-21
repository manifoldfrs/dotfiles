function pyenv --description 'Initialize pyenv only when first used'
    functions --erase pyenv
    if not command -q pyenv
        echo 'pyenv is not installed' >&2
        return 127
    end
    command pyenv init - fish --no-rehash | source
    pyenv $argv
end
