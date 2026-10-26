#!/bin/bash

# Bootstrap non-Stow machine setup, then apply managed dotfiles.
# Usage: ./scripts/bootstrap.sh

set -e

DOTFILES_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
STOW_TARGETS=(
    "$HOME/.bash_profile"
    "$HOME/.bashrc"
    "$HOME/.inputrc"
    "$HOME/.config/bash/aliases.bash"
    "$HOME/.config/bash/environment.bash"
    "$HOME/.config/bash/functions.bash"
    "$HOME/.config/starship.toml"
    "$HOME/.gitconfig"
    "$HOME/.gitignore_global"
    "$HOME/.config/ghostty/config"
    "$HOME/.claude/settings.local.json"
    "$HOME/.config/herdr/config.toml"
    "$HOME/.config/herdr/plugins.txt"
    "$HOME/.config/plannotator-tui/config.toml"
    "$HOME/.config/nvim"
)

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

load_homebrew_path() {
    if command -v brew &> /dev/null; then
        return
    fi

    if [ -x /opt/homebrew/bin/brew ]; then
        eval "$(/opt/homebrew/bin/brew shellenv)"
    elif [ -x /usr/local/bin/brew ]; then
        eval "$(/usr/local/bin/brew shellenv)"
    elif [ -x /home/linuxbrew/.linuxbrew/bin/brew ]; then
        eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    fi
}

install_homebrew() {
    load_homebrew_path

    if command -v brew &> /dev/null; then
        info "Homebrew already installed"
        return
    fi

    info "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    load_homebrew_path

    if ! command -v brew &> /dev/null; then
        error "Homebrew installation finished, but brew is not on PATH"
    fi
}

install_brewfile() {
    if [ ! -f "$DOTFILES_DIR/Brewfile" ]; then
        warn "No Brewfile found, skipping Homebrew packages"
        return
    fi

    if brew help trust >/dev/null 2>&1; then
        brew trust plannotator/tap oven-sh/bun || warn "Could not trust the Plannotator and Bun taps"
    fi

    info "Installing packages from Brewfile..."
    brew bundle install --file="$DOTFILES_DIR/Brewfile" || warn "Some Brewfile packages failed to install"
}

backup_stow_target() {
    local target=$1
    local link_dest

    if [ ! -e "$target" ] && [ ! -L "$target" ]; then
        return
    fi

    if [ -L "$target" ]; then
        link_dest="$(readlink "$target")"
        case "$link_dest" in
            *dotfiles/stow/*|*"$DOTFILES_DIR/stow"*)
                return
                ;;
        esac
    fi

    mv "$target" "$target.backup.$(date +%Y%m%d%H%M%S)"
    warn "Backed up existing before Stow: $target"
}

backup_existing_stow_targets() {
    mkdir -p "$HOME/.config/ghostty" "$HOME/.config/bash" "$HOME/.claude" "$HOME/.local/bin"

    for target in "${STOW_TARGETS[@]}"; do
        backup_stow_target "$target"
    done
}

apply_dotfiles() {
    backup_existing_stow_targets
    "$DOTFILES_DIR/scripts/stow.sh" apply
}

configure_bash_login_shell() {
    local bash_path
    local current_shell

    if command -v brew &> /dev/null && [ -x "$(brew --prefix bash)/bin/bash" ]; then
        bash_path="$(brew --prefix bash)/bin/bash"
    else
        bash_path="$(command -v bash)"
    fi
    current_shell="$(dscl . -read "/Users/$USER" UserShell 2>/dev/null | awk '{print $2}')"
    if [ "$current_shell" = "$bash_path" ]; then
        info "Login shell already uses $bash_path"
        return
    fi

    if ! grep -Fxq "$bash_path" /etc/shells; then
        if sudo -n true 2>/dev/null; then
            printf '%s\n' "$bash_path" | sudo tee -a /etc/shells >/dev/null
        else
            warn "Add $bash_path to /etc/shells, then run: chsh -s $bash_path"
            return
        fi
    fi

    if sudo -n chsh -s "$bash_path" "$USER" 2>/dev/null; then
        info "Changed login shell to $bash_path"
    else
        warn "Run this to change the login shell: chsh -s $bash_path"
    fi
}

sync_neovim_plugins() {
    if ! command -v nvim &> /dev/null; then
        warn "Neovim not found, skipping plugin installation"
        return
    fi

    info "Installing Neovim plugins from lockfile (Lazy restore)..."
    nvim --headless -c "Lazy! restore" -c "qa" || warn "Lazy restore may have encountered issues"
}

install_npm_globals() {
    if ! command -v npm &> /dev/null; then
        warn "npm not found, skipping global npm packages"
        return
    fi

    if [ ! -f "$DOTFILES_DIR/npm-global-packages.txt" ]; then
        return
    fi

    info "Installing global npm packages..."
    while read -r package; do
        if [ -z "$package" ] || [[ "$package" == \#* ]]; then
            continue
        fi

        if npm list -g "$package" &> /dev/null; then
            info "$package already installed"
        else
            info "Installing $package..."
            npm install -g "$package" || warn "Failed to install $package"
        fi
    done < "$DOTFILES_DIR/npm-global-packages.txt"
}

install_global_anti_slop() {
    local runtime="$DOTFILES_DIR/stow/bin/.local/share/anti-slop"

    if ! command -v npm &> /dev/null; then
        warn "npm not found, skipping global anti-slop dependencies"
        return
    fi

    if [ ! -f "$runtime/package.json" ]; then
        warn "Global anti-slop files not found; apply the bin Stow package first"
        return
    fi

    info "Installing global anti-slop dependencies..."
    npm install --prefix "$runtime" --omit=dev --ignore-scripts --no-package-lock --no-audit --no-fund || warn "Global anti-slop dependency installation failed"
}

install_claude_code() {
    if command -v claude &> /dev/null; then
        info "Claude Code already installed"
        return
    fi

    info "Installing Claude Code..."
    (set -o pipefail; curl -fsSL https://claude.ai/install.sh | bash) || warn "Claude Code installation failed"
}

# Claude Code registers its Chrome native host for Chrome-family browsers but not Helium.
install_claude_chrome_host_for_helium() {
    local manifest="com.anthropic.claude_code_browser_extension.json"
    local src="$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts/$manifest"
    local helium_dir="$HOME/Library/Application Support/net.imput.helium"

    if [ ! -d "$helium_dir" ]; then
        info "Helium profile not found, skipping Claude Chrome host setup"
        return
    fi

    if [ ! -f "$src" ]; then
        warn "Claude Chrome host not registered yet; run 'claude --chrome' once, then rerun bootstrap"
        return
    fi

    mkdir -p "$helium_dir/NativeMessagingHosts"
    cp "$src" "$helium_dir/NativeMessagingHosts/$manifest"
    info "Registered Claude Chrome host for Helium"
}

# Plannotator's installer owns its CLI and its plannotator-* skills in every agent harness.
install_plannotator() {
    if command -v plannotator &> /dev/null; then
        info "Plannotator already installed: $(plannotator --version 2>/dev/null || true)"
        return
    fi

    info "Installing Plannotator..."
    curl -fsSL https://plannotator.ai/install.sh | bash || warn "Plannotator installation failed"
}

# Rex installs from a DMG on macOS and a package on Linux; its CLI ships inside the app bundle.
setup_rex_agents() {
    local rex_bin
    local app_rex="/Applications/Rex Beta.app/Contents/Helpers/Rex Server.rex/Contents/MacOS/rex"

    rex_bin="$(command -v rex || true)"
    if [ -z "$rex_bin" ] && [ -x "$app_rex" ]; then
        rex_bin="$app_rex"
    fi

    if [ -z "$rex_bin" ]; then
        info "Rex not installed, skipping its agent skill and hooks"
        return
    fi

    info "Installing Rex's agent skill and hooks..."
    # Pass the naming choice explicitly; without it, newer Rex builds rewrite the tracked hooks to turn naming off.
    "$rex_bin" skill setup --session-naming || warn "Rex agent setup failed; rerun: rex skill setup --session-naming"
}

main() {
    info "Bootstrapping development environment..."
    install_homebrew
    install_brewfile
    install_claude_code
    install_claude_chrome_host_for_helium
    apply_dotfiles
    bash "$DOTFILES_DIR/scripts/sync_herdr_plugins.sh" || warn "Herdr plugin setup failed. Install Bun if missing, then rerun scripts/sync_herdr_plugins.sh"
    configure_bash_login_shell
    sync_neovim_plugins
    install_npm_globals
    install_global_anti_slop
    install_plannotator
    setup_rex_agents

    echo ""
    info "Bootstrap complete! Restart Rex or run: exec \"$(brew --prefix bash)/bin/bash\" --login"
}

main
