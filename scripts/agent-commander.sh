#!/bin/bash

# Shared launcher for the sibling agent-commander operating home.
# Usage: agent-commander <path|init|doctor|bootstrap|install|integrate|shims|start>

set -e

DOTFILES_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
DEFAULT_AGENT_COMMANDER_DIR="$HOME/github/agent-commander"
if [ -z "${AGENT_COMMANDER_DIR:-}" ]; then
    if [ -d "$HOME/agent-commander/.git" ]; then
        AGENT_COMMANDER_DIR="$HOME/agent-commander"
    else
        AGENT_COMMANDER_DIR="$DEFAULT_AGENT_COMMANDER_DIR"
    fi
fi
AGENT_COMMANDER_REMOTE="https://github.com/manifoldfrs/agent-commander"
FIRSTMATE_REMOTE="https://github.com/kunchenguid/firstmate.git"
TREEHOUSE_REMOTE="https://github.com/kunchenguid/treehouse.git"
NO_MISTAKES_REMOTE="https://github.com/kunchenguid/no-mistakes.git"
GH_AXI_REMOTE="https://github.com/kunchenguid/gh-axi.git"
CHROME_DEVTOOLS_AXI_REMOTE="https://github.com/kunchenguid/chrome-devtools-axi.git"
LAVISH_AXI_REMOTE="https://github.com/kunchenguid/lavish-axi.git"
FIRSTMATE_REV="e93620331ed4b5814638480a862ad0b16920a6f2"
TREEHOUSE_REV="68fa3d2556542add76bf80255787b8625a5041a6"
NO_MISTAKES_REV="78c7e606ce598491d50e72bf532045f4684ca8b7"
GH_AXI_REV="4dea8ab8858ca5585e15770d1caf5d8e35128e4f"
CHROME_DEVTOOLS_AXI_REV="27e291a28164410a6b9b80796b3c4c490bca0fa3"
LAVISH_AXI_REV="445022e9ce81862521cfaf4d72dcb271d8b38e08"
IGNORE_PATTERNS=(
    ".env"
    "config/"
    "data/"
    "state/"
    "projects/"
    "bin/"
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
    echo "  install <tool|all>...        Install named tools into libs/"
    echo "  integrate                    Link skills and install AXI session hooks"
    echo "  shims                        Regenerate command shims in agent-commander/bin"
    echo "  start <claude|codex|opencode|pi|grok|cbcode-claude|cbcode-codex>"
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
        "$home_dir/bin" \
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

detect_no_mistakes() {
    local home_dir=$1
    local path

    path="$(tool_path no-mistakes)"
    if [ -n "$path" ]; then
        check_tool no-mistakes "expected no-mistakes or libs/no-mistakes" "$path"
    elif [ -x "$home_dir/libs/no-mistakes/bin/no-mistakes" ]; then
        check_tool no-mistakes "expected no-mistakes or libs/no-mistakes" "$home_dir/libs/no-mistakes/bin/no-mistakes"
    elif [ -f "$home_dir/libs/no-mistakes/go.mod" ]; then
        check_tool no-mistakes "expected no-mistakes or libs/no-mistakes" "$home_dir/libs/no-mistakes"
    else
        check_tool no-mistakes "expected no-mistakes or libs/no-mistakes"
    fi
}

detect_gh_axi() {
    local home_dir=$1
    local path

    path="$(tool_path gh-axi)"
    if [ -n "$path" ]; then
        check_tool gh-axi "expected gh-axi or libs/gh-axi" "$path"
    elif [ -f "$home_dir/libs/gh-axi/dist/bin/gh-axi.js" ]; then
        check_tool gh-axi "expected gh-axi or libs/gh-axi" "$home_dir/libs/gh-axi/dist/bin/gh-axi.js"
    elif [ -f "$home_dir/libs/gh-axi/package.json" ]; then
        check_tool gh-axi "expected gh-axi or libs/gh-axi" "$home_dir/libs/gh-axi"
    else
        check_tool gh-axi "expected gh-axi or libs/gh-axi"
    fi
}

detect_chrome_devtools_axi() {
    local home_dir=$1
    local path

    path="$(tool_path chrome-devtools-axi)"
    if [ -n "$path" ]; then
        check_tool chrome-devtools-axi "expected chrome-devtools-axi or libs/chrome-devtools-axi" "$path"
    elif [ -f "$home_dir/libs/chrome-devtools-axi/dist/bin/chrome-devtools-axi.js" ]; then
        check_tool chrome-devtools-axi "expected chrome-devtools-axi or libs/chrome-devtools-axi" "$home_dir/libs/chrome-devtools-axi/dist/bin/chrome-devtools-axi.js"
    elif [ -f "$home_dir/libs/chrome-devtools-axi/package.json" ]; then
        check_tool chrome-devtools-axi "expected chrome-devtools-axi or libs/chrome-devtools-axi" "$home_dir/libs/chrome-devtools-axi"
    else
        check_tool chrome-devtools-axi "expected chrome-devtools-axi or libs/chrome-devtools-axi"
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
    detect_no_mistakes "$home_dir" || missing=1
    detect_gh_axi "$home_dir" || missing=1
    detect_chrome_devtools_axi "$home_dir" || missing=1
    detect_lavish_axi "$home_dir" || missing=1

    if [ "$missing" -ne 0 ]; then
        return 1
    fi
}

firstmate_bootstrap() {
    local home_dir=$1
    local path

    export PATH="$home_dir/bin:$PATH"

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

    export AGENT_COMMANDER_DIR="$home_dir"
    export PATH="$home_dir/bin:$PATH"

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

has_submodule_path() {
    local home_dir=$1
    local path=$2
    local configured_path

    if [ ! -f "$home_dir/.gitmodules" ]; then
        return 1
    fi

    configured_path="$(git -C "$home_dir" config --file .gitmodules --get "submodule.$path.path" 2>/dev/null || true)"
    [ "$configured_path" = "$path" ]
}

install_tool_source() {
    local home_dir=$1
    local name=$2
    local remote=$3
    local revision=$4
    local path=$5
    local target="$home_dir/$path"

    if has_submodule_path "$home_dir" "$path"; then
        info "Initializing $name submodule at $path"
        git -C "$home_dir" submodule update --init -- "$path"
        return
    fi

    clone_or_update_tool "$name" "$remote" "$revision" "$target"
}

install_firstmate() {
    local home_dir=$1

    install_tool_source "$home_dir" firstmate "$FIRSTMATE_REMOTE" "$FIRSTMATE_REV" "libs/firstmate"
}

install_treehouse() {
    local home_dir=$1

    install_tool_source "$home_dir" treehouse "$TREEHOUSE_REMOTE" "$TREEHOUSE_REV" "libs/treehouse"

    if command -v go >/dev/null 2>&1; then
        (cd "$home_dir/libs/treehouse" && go build -o treehouse .)
    else
        warn "go not found; cloned treehouse source without building local binary"
    fi
}

install_no_mistakes() {
    local home_dir=$1

    install_tool_source "$home_dir" no-mistakes "$NO_MISTAKES_REMOTE" "$NO_MISTAKES_REV" "libs/no-mistakes"

    if command -v go >/dev/null 2>&1; then
        (cd "$home_dir/libs/no-mistakes" && make build)
    else
        warn "go not found; cloned no-mistakes source without building local binary"
    fi
}

node_package_manager() {
    local package_json=$1

    node -e 'const fs = require("fs"); const pkg = JSON.parse(fs.readFileSync(process.argv[1], "utf8")); if (pkg.packageManager) console.log(pkg.packageManager);' "$package_json" 2>/dev/null || true
}

install_node_axi() {
    local home_dir=$1
    local name=$2
    local remote=$3
    local revision=$4
    local path=$5
    local package_manager
    local pnpm_version

    install_tool_source "$home_dir" "$name" "$remote" "$revision" "$path"

    package_manager="$(node_package_manager "$home_dir/$path/package.json")"
    case "$package_manager" in
        pnpm@*)
            pnpm_version="${package_manager#pnpm@}"
            if command -v npx >/dev/null 2>&1; then
                (cd "$home_dir/$path" && CI=true npx -y "pnpm@$pnpm_version" install --frozen-lockfile && npx -y "pnpm@$pnpm_version" run build)
                return
            fi
            ;;
    esac

    if command -v pnpm >/dev/null 2>&1; then
        (cd "$home_dir/$path" && CI=true pnpm install --frozen-lockfile && pnpm run build)
    elif command -v npm >/dev/null 2>&1; then
        (cd "$home_dir/$path" && npm install --package-lock=false && npm run build)
    else
        warn "pnpm/npm not found; cloned $name source without building"
    fi
}

install_gh_axi() {
    local home_dir=$1

    install_node_axi "$home_dir" gh-axi "$GH_AXI_REMOTE" "$GH_AXI_REV" "libs/gh-axi"
}

install_chrome_devtools_axi() {
    local home_dir=$1

    install_node_axi "$home_dir" chrome-devtools-axi "$CHROME_DEVTOOLS_AXI_REMOTE" "$CHROME_DEVTOOLS_AXI_REV" "libs/chrome-devtools-axi"
}

install_lavish_axi() {
    local home_dir=$1

    install_node_axi "$home_dir" lavish-axi "$LAVISH_AXI_REMOTE" "$LAVISH_AXI_REV" "libs/lavish-axi"
}

install_all_tools() {
    local home_dir=$1

    install_firstmate "$home_dir"
    install_treehouse "$home_dir"
    install_no_mistakes "$home_dir"
    install_gh_axi "$home_dir"
    install_chrome_devtools_axi "$home_dir"
    install_lavish_axi "$home_dir"
}

write_binary_shim() {
    local bin_dir=$1
    local name=$2
    local relative_target=$3
    local install_target=$4
    local shim="$bin_dir/$name"

    cat > "$shim" <<SHIM
#!/bin/bash
set -e
AGENT_COMMANDER_SHIM_HOME="\${AGENT_COMMANDER_DIR:-\$(cd "\$(dirname "\${BASH_SOURCE[0]}")/.." && pwd)}"
target="\$AGENT_COMMANDER_SHIM_HOME/$relative_target"
if [ ! -x "\$target" ]; then
    echo "$name is not built at \$target. Run: agent-commander install $install_target" >&2
    exit 127
fi
exec "\$target" "\$@"
SHIM
    chmod +x "$shim"
}

write_node_shim() {
    local bin_dir=$1
    local name=$2
    local relative_target=$3
    local install_target=$4
    local shim="$bin_dir/$name"

    cat > "$shim" <<SHIM
#!/bin/bash
set -e
AGENT_COMMANDER_SHIM_HOME="\${AGENT_COMMANDER_DIR:-\$(cd "\$(dirname "\${BASH_SOURCE[0]}")/.." && pwd)}"
target="\$AGENT_COMMANDER_SHIM_HOME/$relative_target"
if ! command -v node >/dev/null 2>&1; then
    echo "node is required to run $name" >&2
    exit 127
fi
if [ ! -f "\$target" ]; then
    echo "$name is not built at \$target. Run: agent-commander install $install_target" >&2
    exit 127
fi
exec node "\$target" "\$@"
SHIM
    chmod +x "$shim"
}

ensure_tool_shims() {
    local home_dir=$1
    local bin_dir="$home_dir/bin"
    local script
    local name

    mkdir -p "$bin_dir"

    for script in "$home_dir"/libs/firstmate/bin/fm-*.sh; do
        [ -f "$script" ] || continue
        name="$(basename "$script")"
        write_binary_shim "$bin_dir" "$name" "libs/firstmate/bin/$name" firstmate
    done

    write_binary_shim "$bin_dir" treehouse "libs/treehouse/treehouse" treehouse
    write_binary_shim "$bin_dir" no-mistakes "libs/no-mistakes/bin/no-mistakes" no-mistakes
    write_node_shim "$bin_dir" gh-axi "libs/gh-axi/dist/bin/gh-axi.js" gh-axi
    write_node_shim "$bin_dir" chrome-devtools-axi "libs/chrome-devtools-axi/dist/bin/chrome-devtools-axi.js" chrome-devtools-axi
    write_node_shim "$bin_dir" lavish-axi "libs/lavish-axi/dist/cli.mjs" lavish-axi
}

cmd_shims() {
    local home_dir

    require_agent_commander_repo
    home_dir="$(agent_commander_dir)"
    ensure_runtime_dirs "$home_dir"
    ensure_tool_shims "$home_dir"
    info "Updated command shims: $home_dir/bin"
}

link_agent_skill() {
    local home_dir=$1
    local name=$2
    local source=$3
    local target="$HOME/.agents/skills/$name"

    if [ ! -d "$source" ]; then
        warn "Skill source missing: $source"
        return
    fi

    mkdir -p "$HOME/.agents/skills"

    if [ -L "$target" ] && [ "$(readlink "$target")" = "$source" ]; then
        return
    fi

    if [ -e "$target" ] || [ -L "$target" ]; then
        warn "Skipping existing skill target: $target"
        return
    fi

    ln -s "$source" "$target"
    info "Linked agent skill: $target -> $source"
}

run_axi_hook_setup() {
    local command_name=$1

    if ! command -v "$command_name" >/dev/null 2>&1; then
        warn "$command_name not found; skipping hook setup"
        return
    fi

    "$command_name" setup hooks || warn "$command_name hook setup failed"
}

cmd_integrate() {
    local home_dir

    require_agent_commander_repo
    home_dir="$(agent_commander_dir)"
    ensure_runtime_dirs "$home_dir"
    ensure_tool_shims "$home_dir"

    export AGENT_COMMANDER_DIR="$home_dir"
    export PATH="$home_dir/bin:$PATH"

    link_agent_skill "$home_dir" lavish "$home_dir/libs/lavish-axi/skills/lavish"
    link_agent_skill "$home_dir" lavish-design "$home_dir/libs/lavish-axi/.agents/skills/lavish-design"
    link_agent_skill "$home_dir" gh-axi "$home_dir/libs/gh-axi/skills/gh-axi"
    link_agent_skill "$home_dir" chrome-devtools-axi "$home_dir/libs/chrome-devtools-axi/skills/chrome-devtools-axi"
    link_agent_skill "$home_dir" no-mistakes "$home_dir/libs/no-mistakes/skills/no-mistakes"

    run_axi_hook_setup gh-axi
    run_axi_hook_setup chrome-devtools-axi
    run_axi_hook_setup lavish-axi
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
            no-mistakes)
                install_no_mistakes "$home_dir"
                ;;
            gh-axi)
                install_gh_axi "$home_dir"
                ;;
            chrome-devtools-axi)
                install_chrome_devtools_axi "$home_dir"
                ;;
            lavish-axi)
                install_lavish_axi "$home_dir"
                ;;
            all)
                install_all_tools "$home_dir"
                ;;
            *)
                error "unknown install target: $tool"
                ;;
        esac
    done

    ensure_tool_shims "$home_dir"
    cmd_integrate
}

cmd_start() {
    local harness=${1:-}
    local home_dir
    local -a exec_cmd

    if [ -z "$harness" ]; then
        error "start requires a harness: claude, codex, opencode, pi, grok, cbcode-claude, or cbcode-codex"
    fi

    case "$harness" in
        claude|codex|opencode|pi|grok)
            exec_cmd=("$harness")
            ;;
        cbcode-claude)
            exec_cmd=(cbcode --agent claude)
            ;;
        cbcode-codex)
            exec_cmd=(cbcode --agent codex)
            ;;
        *)
            error "unsupported harness: $harness"
            ;;
    esac

    require_agent_commander_repo
    if ! command -v "${exec_cmd[0]}" >/dev/null 2>&1; then
        error "harness not found on PATH: ${exec_cmd[0]}"
    fi

    home_dir="$(agent_commander_dir)"
    export AGENT_COMMANDER_DIR="$home_dir"
    export FM_HOME="$home_dir"
    export PATH="$home_dir/bin:$PATH"

    case "$harness" in
        cbcode-*)
            # cbcode's HOME-sandbox is only defined as an interactive zsh function
            # (stow/zsh-cb/.zshrc.local); a plain bash exec never sees it, so replicate it here.
            export HOME="$HOME/.cbcode-home"
            ;;
    esac

    exec "${exec_cmd[@]}"
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
        integrate)
            shift
            [ "$#" -eq 0 ] || usage
            cmd_integrate
            ;;
        shims)
            shift
            [ "$#" -eq 0 ] || usage
            cmd_shims
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
