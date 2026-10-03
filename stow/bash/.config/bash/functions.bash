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

# The session-relaunch mod's /update and /restart write a session id to CLAUDE_RELAUNCH_FILE before exiting.
claude() {
    local relaunch_file session_id status
    relaunch_file=$(mktemp "${TMPDIR:-/tmp}/claude-relaunch.XXXXXX") || return
    CLAUDE_RELAUNCH_FILE=$relaunch_file command claude "$@"
    status=$?
    while [[ -s $relaunch_file ]]; do
        session_id=$(<"$relaunch_file")
        : >"$relaunch_file"
        CLAUDE_RELAUNCH_FILE=$relaunch_file command claude --resume "$session_id"
        status=$?
    done
    rm -f "$relaunch_file"
    return "$status"
}

# Relaunch requests are handled after the TUI exits, outside the shared server being restarted.
opencode() {
    local arg relaunch_file action session_id status
    local -a launch_args=("$@")
    local -a resume_args=()
    for arg in "$@"; do
        case "$arg" in
            --server|--server=*|--standalone|mini|run|serve|acp)
                OPENCODE_RELAUNCH_FILE= command opencode "$@"
                return $?
                ;;
        esac
    done
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --session|-s|--prompt)
                shift
                if [[ $# -gt 0 ]]; then shift; fi
                ;;
            --session=*|--continue|-c|--prompt=*) shift ;;
            *) resume_args+=("$1"); shift ;;
        esac
    done
    relaunch_file=$(mktemp "${TMPDIR:-/tmp}/opencode-relaunch.XXXXXX") || return
    status=0
    OPENCODE_RELAUNCH_FILE=$relaunch_file command opencode "${launch_args[@]}" || status=$?
    while [[ -s $relaunch_file ]]; do
        if ! {
            IFS= read -r action
            IFS= read -r session_id
        } <"$relaunch_file"; then
            printf 'OpenCode relaunch: incomplete request.\n' >&2
            status=1
            break
        fi
        : >"$relaunch_file"
        if [[ $action != restart && $action != update ]] || [[ ! $session_id =~ ^ses[A-Za-z0-9_-]+$ ]]; then
            printf 'OpenCode relaunch: invalid request.\n' >&2
            status=1
            break
        fi
        if [[ $action == update ]] && ! command opencode upgrade; then
            printf 'OpenCode upgrade failed; resuming without restarting the shared server.\n' >&2
        elif ! command opencode service restart; then
            printf 'OpenCode shared server restart failed. Resume with: opencode --session %s\n' "$session_id" >&2
            status=1
            break
        fi
        status=0
        OPENCODE_RELAUNCH_FILE=$relaunch_file command opencode "${resume_args[@]}" --session "$session_id" || status=$?
    done
    rm -f "$relaunch_file"
    return "$status"
}

claude-log() {
    ANTHROPIC_BASE_URL=http://127.0.0.1:8787 command claude "$@"
}

pi-log() {
    PI_REQUEST_LOG=1 command pi "$@"
}
