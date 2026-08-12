function rbenv --description 'Initialize rbenv only when first used'
    functions --erase rbenv
    if not command -q rbenv
        echo 'rbenv is not installed' >&2
        return 127
    end
    command rbenv init - fish --no-rehash | source
    rbenv $argv
end
