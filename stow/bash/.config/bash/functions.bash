#!/bin/bash

vim() {
    if [[ $# -eq 0 ]]; then
        command nvim .
    else
        command nvim "$@"
    fi
}

vi() {
    vim "$@"
}

fvim() {
    local query=${*:-}
    local selected

    if [[ -n $query ]]; then
        selected=$(fd -H -t f | fzf --header "Open File in Vim" --preview "cat {}" -q "$query")
    else
        selected=$(fd -H -t f | fzf --header "Open File in Vim" --preview "cat {}")
    fi

    [[ -n $selected ]] && command nvim "$selected"
}

scratch() {
    local tmpfile
    tmpfile=$(mktemp)
    "${EDITOR:-nvim}" "$tmpfile"
}

tempd() {
    local tmpdir
    tmpdir=$(mktemp -d)
    cd "$tmpdir" || return
}

bgr() {
    if [[ $# -eq 0 ]]; then
        echo "Usage: bgr <command> [args...]" >&2
        return 1
    fi

    "$@" &>/dev/null &
    disown
}

notify() {
    local message=${1:-}
    local title=${2:-Notification}

    if [[ -z $message ]]; then
        echo "Usage: notify <message> [title]" >&2
        return 1
    fi

    if command -v osascript &> /dev/null; then
        osascript -e "display notification \"$message\" with title \"$title\""
    elif command -v notify-send &> /dev/null; then
        notify-send "$title" "$message"
    else
        printf '[%s] %s\n' "$title" "$message"
    fi
}

trash() {
    local file
    local name
    local destination
    local trash_dir

    if [[ $# -eq 0 ]]; then
        echo "Usage: trash <file>..." >&2
        return 1
    fi

    if [[ $(uname) == Darwin ]]; then
        trash_dir="$HOME/.Trash"
    else
        trash_dir="${XDG_DATA_HOME:-$HOME/.local/share}/Trash/files"
    fi
    mkdir -p "$trash_dir"

    for file in "$@"; do
        if [[ ! -e $file ]]; then
            echo "Error: '$file' does not exist" >&2
            continue
        fi
        name=$(basename "$file")
        destination="$trash_dir/$name"
        [[ -e $destination ]] && destination="$destination.$(date +%s)"
        mv -v "$file" "$destination"
    done
}

uuid() {
    if command -v uuidgen &> /dev/null; then
        uuidgen | tr '[:upper:]' '[:lower:]'
    elif command -v python3 &> /dev/null; then
        python3 -c 'import uuid; print(uuid.uuid4())'
    elif command -v node &> /dev/null; then
        node -e "console.log(require('crypto').randomUUID())"
    else
        echo "Error: no UUID generator available" >&2
        return 1
    fi
}

ulid() {
    if ! command -v python3 &> /dev/null; then
        echo "Error: python3 is required for ULID generation" >&2
        return 1
    fi

    python3 - <<'PY'
import random
import time

alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
timestamp = int(time.time() * 1000)
prefix = "".join(alphabet[(timestamp >> (45 - 5 * i)) & 31] for i in range(10))
suffix = "".join(random.choice(alphabet) for _ in range(16))
print(prefix + suffix)
PY
}

git_current_branch() {
    local branch
    branch=$(git symbolic-ref HEAD 2>/dev/null || git rev-parse --short HEAD 2>/dev/null) || return
    printf '%s\n' "${branch#refs/heads/}"
}

git_default_branch() {
    local branch
    git rev-parse --git-dir &>/dev/null || return
    branch=$(git config --get init.defaultBranch || true)
    if [[ -n $branch ]] && git show-ref -q --verify "refs/heads/$branch"; then
        printf '%s\n' "$branch"
    elif git show-ref -q --verify refs/heads/main; then
        printf '%s\n' main
    else
        printf '%s\n' master
    fi
}

grt() {
    local root
    root=$(git rev-parse --show-toplevel) || return
    cd "$root" || return
}

claude-log() {
    ANTHROPIC_BASE_URL=http://127.0.0.1:8787 command claude "$@"
}

pi-log() {
    PI_REQUEST_LOG=1 command pi "$@"
}
