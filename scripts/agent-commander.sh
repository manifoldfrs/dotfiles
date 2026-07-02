#!/bin/bash

# Shared launcher for the sibling agent-commander operating home.
# Usage: agent-commander <path|init|doctor|bootstrap|install|start>

set -e

DOTFILES_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
DEFAULT_AGENT_COMMANDER_DIR="/Users/frshbb/github/agent-commander"
AGENT_COMMANDER_DIR="${AGENT_COMMANDER_DIR:-$DEFAULT_AGENT_COMMANDER_DIR}"
AGENT_COMMANDER_REMOTE="https://github.com/manifoldfrs/agent-commander"
FIRSTMATE_REMOTE="https://github.com/kunchenguid/firstmate.git"
TREEHOUSE_REMOTE="https://github.com/kunchenguid/treehouse.git"
LAVISH_AXI_REMOTE="https://github.com/kunchenguid/lavish-axi.git"
FIRSTMATE_REV="e93620331ed4b5814638480a862ad0b16920a6f2"
TREEHOUSE_REV="68fa3d2556542add76bf80255787b8625a5041a6"
LAVISH_AXI_REV="445022e9ce81862521cfaf4d72dcb271d8b38e08"
IGNORE_PATTERNS=(
    ".env"
    "config/"
    "data/"
    "state/"
    "projects/"
    ".no-mistakes/"
    "treehouse/"
    "libs/*/node_modules/"
    "logs/"
    "*.log"
)

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1" >&2; exit 1; }

usage() {
    local status=${1:-1}

    echo "Usage: agent-commander <command> [args]"
    echo ""
    echo "Commands:"
    echo "  path                         Print the resolved agent-commander directory"
    echo "  init                         Create/check the sibling repo and local ignores"
    echo "  doctor                       Check required local tools"
    echo "  bootstrap                    Run firstmate bootstrap from agent-commander"
    echo "  install <tool>...            Install named tools into libs/"
    echo "  start <claude|codex|opencode|pi|grok>"
    echo ""
    echo "Environment:"
    echo "  AGENT_COMMANDER_DIR          Override the operating home"
    exit "$status"
}

absolute_path() {
    local path=$1
    local parent
    local base

    case "$path" in
        /*) ;;
        *) path="$PWD/$path" ;;
    esac

    if [ -d "$path" ]; then
        (cd "$path" && pwd -P)
        return
    fi

    parent="$(dirname "$path")"
    base="$(basename "$path")"
    if [ -d "$parent" ]; then
        printf '%s/%s\n' "$(cd "$parent" && pwd -P)" "$base"
        return
    fi

    printf '%s\n' "$path"
}

agent_commander_dir() {
    absolute_path "$AGENT_COMMANDER_DIR"
}

refuse_dotfiles_home() {
    local home_dir
    local dotfiles_dir

    home_dir="$(agent_commander_dir)"
    dotfiles_dir="$(absolute_path "$DOTFILES_DIR")"

    case "$home_dir/" in
        "$dotfiles_dir"|"$dotfiles_dir"/*)
            error "AGENT_COMMANDER_DIR must not be inside dotfiles: $home_dir"
            ;;
    esac
}

require_agent_commander_repo() {
    local home_dir

    refuse_dotfiles_home
    home_dir="$(agent_commander_dir)"

    if [ ! -d "$home_dir/.git" ]; then
        error "agent-commander repo not initialized: $home_dir"
    fi
}

ensure_ignore_file() {
    local file=$1
    local pattern

    mkdir -p "$(dirname "$file")"
    touch "$file"

    for pattern in "${IGNORE_PATTERNS[@]}"; do
        if ! grep -Fxq "$pattern" "$file"; then
            printf '%s\n' "$pattern" >> "$file"
        fi
    done
}

ensure_runtime_dirs() {
    local home_dir=$1

    mkdir -p \
        "$home_dir/libs" \
        "$home_dir/scripts" \
        "$home_dir/config" \
        "$home_dir/data" \
        "$home_dir/state" \
        "$home_dir/projects" \
        "$home_dir/logs"
}

cmd_path() {
    refuse_dotfiles_home
    agent_commander_dir
}

cmd_init() {
    local home_dir
    local remote

    refuse_dotfiles_home
    home_dir="$(agent_commander_dir)"

    mkdir -p "$home_dir"

    if [ ! -d "$home_dir/.git" ]; then
        info "Initializing git repo: $home_dir"
        git -C "$home_dir" init
    fi

    if remote="$(git -C "$home_dir" remote get-url origin 2>/dev/null)"; then
        if [ "$remote" != "$AGENT_COMMANDER_REMOTE" ]; then
            warn "origin remote differs: $remote"
            warn "Expected: $AGENT_COMMANDER_REMOTE"
        fi
    else
        git -C "$home_dir" remote add origin "$AGENT_COMMANDER_REMOTE"
        info "Added origin remote: $AGENT_COMMANDER_REMOTE"
    fi

    ensure_runtime_dirs "$home_dir"
    ensure_ignore_file "$home_dir/.gitignore"
    ensure_ignore_file "$home_dir/.git/info/exclude"
    info "agent-commander initialized: $home_dir"
}

tool_path() {
    local command_name=$1

    command -v "$command_name" 2>/dev/null || true
}

check_tool() {
    local name=$1
    local detail=$2
    local found=${3:-}

    if [ -n "$found" ]; then
        printf 'ok\t%s\t%s\n' "$name" "$found"
        return 0
    fi

    printf 'missing\t%s\t%s\n' "$name" "$detail"
    return 1
}

detect_firstmate() {
    local home_dir=$1
    local path

    path="$(tool_path fm-bootstrap.sh)"
    if [ -n "$path" ]; then
        check_tool firstmate "expected fm-bootstrap.sh or libs/firstmate" "$path"
    elif [ -f "$home_dir/libs/firstmate/bin/fm-bootstrap.sh" ]; then
        check_tool firstmate "expected fm-bootstrap.sh or libs/firstmate" "$home_dir/libs/firstmate"
    else
        check_tool firstmate "expected fm-bootstrap.sh or libs/firstmate"
    fi
}

detect_treehouse() {
    local home_dir=$1
    local path

    path="$(tool_path treehouse)"
    if [ -n "$path" ]; then
        check_tool treehouse "expected treehouse or libs/treehouse" "$path"
    elif [ -x "$home_dir/libs/treehouse/treehouse" ]; then
        check_tool treehouse "expected treehouse or libs/treehouse" "$home_dir/libs/treehouse/treehouse"
    elif [ -f "$home_dir/libs/treehouse/go.mod" ]; then
        check_tool treehouse "expected treehouse or libs/treehouse" "$home_dir/libs/treehouse"
    else
        check_tool treehouse "expected treehouse or libs/treehouse"
    fi
}

detect_lavish_axi() {
    local home_dir=$1
    local path

    path="$(tool_path lavish-axi)"
    if [ -n "$path" ]; then
        check_tool lavish-axi "expected lavish-axi or libs/lavish-axi" "$path"
    elif [ -f "$home_dir/libs/lavish-axi/dist/cli.mjs" ]; then
        check_tool lavish-axi "expected lavish-axi or libs/lavish-axi" "$home_dir/libs/lavish-axi/dist/cli.mjs"
    elif [ -f "$home_dir/libs/lavish-axi/package.json" ]; then
        check_tool lavish-axi "expected lavish-axi or libs/lavish-axi" "$home_dir/libs/lavish-axi"
    else
        check_tool lavish-axi "expected lavish-axi or libs/lavish-axi"
    fi
}

detect_simple_command() {
    local name=$1
    local path

    path="$(tool_path "$name")"
    check_tool "$name" "expected command on PATH: $name" "$path"
}

cmd_doctor() {
    local home_dir
    local missing=0

    require_agent_commander_repo
    home_dir="$(agent_commander_dir)"

    printf 'status\ttool\tdetail\n'
    detect_simple_command git || missing=1
    detect_simple_command tmux || missing=1
    detect_simple_command node || missing=1
    detect_simple_command jq || missing=1
    detect_simple_command curl || missing=1
    detect_simple_command gh || missing=1
    detect_firstmate "$home_dir" || missing=1
    detect_treehouse "$home_dir" || missing=1
    detect_simple_command no-mistakes || missing=1
    detect_simple_command gh-axi || missing=1
    detect_simple_command chrome-devtools-axi || missing=1
    detect_lavish_axi "$home_dir" || missing=1

    if [ "$missing" -ne 0 ]; then
        return 1
    fi
}

firstmate_bootstrap() {
    local home_dir=$1
    local path

    if [ -f "$home_dir/libs/firstmate/bin/fm-bootstrap.sh" ]; then
        printf '%s\n' "$home_dir/libs/firstmate/bin/fm-bootstrap.sh"
        return 0
    fi

    path="$(tool_path fm-bootstrap.sh)"
    if [ -n "$path" ]; then
        printf '%s\n' "$path"
        return 0
    fi

    return 1
}

cmd_bootstrap() {
    local home_dir
    local bootstrap

    require_agent_commander_repo
    home_dir="$(agent_commander_dir)"
    ensure_runtime_dirs "$home_dir"

    if ! bootstrap="$(firstmate_bootstrap "$home_dir")"; then
        error "firstmate bootstrap not found. Run: agent-commander install firstmate"
    fi

    cd "$home_dir"
    FM_HOME="$home_dir" bash "$bootstrap"
}

clone_or_update_tool() {
    local name=$1
    local remote=$2
    local revision=$3
    local target=$4

    mkdir -p "$(dirname "$target")"

    if [ -d "$target/.git" ]; then
        info "Updating $name in $target"
        git -C "$target" fetch --tags origin
    elif [ -e "$target" ]; then
        error "$target exists but is not a git checkout"
    else
        info "Cloning $name into $target"
        git clone "$remote" "$target"
    fi

    git -C "$target" checkout "$revision"
}

install_firstmate() {
    local home_dir=$1

    clone_or_update_tool firstmate "$FIRSTMATE_REMOTE" "$FIRSTMATE_REV" "$home_dir/libs/firstmate"
}

install_treehouse() {
    local home_dir=$1

    clone_or_update_tool treehouse "$TREEHOUSE_REMOTE" "$TREEHOUSE_REV" "$home_dir/libs/treehouse"

    if command -v go >/dev/null 2>&1; then
        (cd "$home_dir/libs/treehouse" && go build -o treehouse .)
    else
        warn "go not found; cloned treehouse source without building local binary"
    fi
}

install_lavish_axi() {
    local home_dir=$1

    clone_or_update_tool lavish-axi "$LAVISH_AXI_REMOTE" "$LAVISH_AXI_REV" "$home_dir/libs/lavish-axi"

    if command -v pnpm >/dev/null 2>&1; then
        (cd "$home_dir/libs/lavish-axi" && pnpm install && pnpm run build)
    elif command -v npm >/dev/null 2>&1; then
        (cd "$home_dir/libs/lavish-axi" && npm install && npm run build)
    else
        warn "pnpm/npm not found; cloned lavish-axi source without building"
    fi
}

cmd_install() {
    local home_dir
    local tool

    if [ "$#" -eq 0 ]; then
        error "install requires at least one tool name"
    fi

    require_agent_commander_repo
    home_dir="$(agent_commander_dir)"
    mkdir -p "$home_dir/libs"

    for tool in "$@"; do
        case "$tool" in
            firstmate)
                install_firstmate "$home_dir"
                ;;
            treehouse)
                install_treehouse "$home_dir"
                ;;
            lavish-axi)
                install_lavish_axi "$home_dir"
                ;;
            *)
                error "unknown install target: $tool"
                ;;
        esac
    done
}

cmd_start() {
    local harness=${1:-}
    local home_dir

    if [ -z "$harness" ]; then
        error "start requires a harness: claude, codex, opencode, pi, or grok"
    fi

    case "$harness" in
        claude|codex|opencode|pi|grok)
            ;;
        *)
            error "unsupported harness: $harness"
            ;;
    esac

    require_agent_commander_repo
    if ! command -v "$harness" >/dev/null 2>&1; then
        error "harness not found on PATH: $harness"
    fi

    home_dir="$(agent_commander_dir)"
    cd "$home_dir"
    exec "$harness"
}

main() {
    local command=${1:-}

    case "$command" in
        path)
            shift
            [ "$#" -eq 0 ] || usage
            cmd_path
            ;;
        init)
            shift
            [ "$#" -eq 0 ] || usage
            cmd_init
            ;;
        doctor)
            shift
            [ "$#" -eq 0 ] || usage
            cmd_doctor
            ;;
        bootstrap)
            shift
            [ "$#" -eq 0 ] || usage
            cmd_bootstrap
            ;;
        install)
            shift
            cmd_install "$@"
            ;;
        start)
            shift
            [ "$#" -eq 1 ] || usage
            cmd_start "$1"
            ;;
        help|--help|-h|"")
            usage 0
            ;;
        *)
            usage
            ;;
    esac
}

main "$@"
