function fish_prompt
    set -l last_status $status
    set -l directory_bg 3b4261
    set -l branch_bg bb9af7
    set -l dark 1a1b26
    set -l foreground c0caf5
    set -l separator ''

    if test "$last_status" -ne 0
        set_color "$dark" -b f7768e
        printf ' %s ' "$last_status"
        set_color f7768e -b "$directory_bg"
        printf '%s' "$separator"
    end

    set_color "$foreground" -b "$directory_bg"
    printf ' %s ' (prompt_pwd -d 1 -D 1)

    set -l branch (command git symbolic-ref --quiet --short HEAD 2>/dev/null)
    if test -z "$branch"
        set branch (command git rev-parse --short HEAD 2>/dev/null)
    end
    if test -n "$branch"
        set_color "$directory_bg" -b "$branch_bg"
        printf '%s' "$separator"
        set_color "$dark" -b "$branch_bg"
        printf ' %s ' "$branch"
        set_color normal
        set_color "$branch_bg"
    else
        set_color normal
        set_color "$directory_bg"
    end

    printf '%s' "$separator"
    set_color normal
    printf ' '
end
