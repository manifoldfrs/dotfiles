#!/bin/bash

# Build Zed from upstream source plus the tracked patches in zed-custom/patches.
# Usage: ./scripts/build_zed.sh [build|install|remote HOST|export|update]
#   build   Reset zed-custom/source to the pinned base commit, apply the patches,
#           build release binaries, and bundle Zed Dev.app (default).
#   install Copy the bundled Zed Dev.app into /Applications.
#   remote  Cross-compile the Linux remote server and install it on an SSH host,
#           where Zed Dev looks for it on remote projects.
#   export  Rewrite zed-custom/patches from the commits on the source checkout's
#           custom branch, after editing them there.
#   update  Rebase the patches onto the latest upstream main, then export them
#           and pin the new base commit.

set -e

DOTFILES_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
ZED_CUSTOM_DIR="$DOTFILES_DIR/zed-custom"
SOURCE_DIR="$ZED_CUSTOM_DIR/source"
PATCH_DIR="$ZED_CUSTOM_DIR/patches"
BASE_COMMIT_FILE="$ZED_CUSTOM_DIR/base-commit"
ZED_REPO="https://github.com/zed-industries/zed.git"
WORK_BRANCH="custom"
APP_NAME="Zed Dev.app"
APP_PATH="$SOURCE_DIR/target/release/bundle/osx/$APP_NAME"
REMOTE_TARGET="x86_64-unknown-linux-musl"
# Dev-channel Zed looks for the server at this fixed path instead of downloading one.
REMOTE_SERVER_PATH=".zed_server/zed-remote-server-dev-build"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

usage() {
    local status=${1:-1}

    echo "Usage: $0 [build|install|remote HOST|export|update]"
    exit "$status"
}

require_tools() {
    local tool

    for tool in git cargo cmake "$@"; do
        if ! command -v "$tool" &> /dev/null; then
            error "$tool is required; see the Custom Zed build section of README.md"
        fi
    done
}

base_commit() {
    if [ ! -f "$BASE_COMMIT_FILE" ]; then
        error "Missing $BASE_COMMIT_FILE"
    fi

    tr -d '[:space:]' < "$BASE_COMMIT_FILE"
}

ensure_source() {
    if [ -d "$SOURCE_DIR/.git" ]; then
        return
    fi

    info "Cloning Zed into $SOURCE_DIR"
    git clone --filter=blob:none --no-checkout "$ZED_REPO" "$SOURCE_DIR"
}

# Resetting the work branch would discard edits made in the checkout.
require_clean_source() {
    if [ -n "$(git -C "$SOURCE_DIR" status --porcelain)" ]; then
        error "Uncommitted changes in $SOURCE_DIR; commit them on the $WORK_BRANCH branch and run export, or discard them"
    fi
}

apply_patches() {
    local base=$1
    local patches=("$PATCH_DIR"/*.patch)

    if ! git -C "$SOURCE_DIR" cat-file -e "$base^{commit}" 2> /dev/null; then
        info "Fetching base commit $base"
        git -C "$SOURCE_DIR" fetch --filter=blob:none origin "$base"
    fi

    git -C "$SOURCE_DIR" checkout -q -B "$WORK_BRANCH" "$base"

    if [ ! -e "${patches[0]}" ]; then
        warn "No patches in $PATCH_DIR; building upstream Zed"
        return
    fi

    info "Applying ${#patches[@]} patches onto $base"
    git -C "$SOURCE_DIR" am --3way --quiet "${patches[@]}"
}

# Without Xcode's optional Metal toolchain, gpui compiles its shaders when the
# app starts instead of at build time.
shader_features() {
    if xcrun -sdk macosx metal --version &> /dev/null; then
        return
    fi

    warn "Metal toolchain missing; building with runtime shader compilation (install it with: xcodebuild -downloadComponent MetalToolchain)" >&2
    echo "--features gpui_platform/runtime_shaders"
}

build_zed() {
    local base
    local features

    require_tools cargo-bundle
    ensure_source
    require_clean_source
    base="$(base_commit)"
    apply_patches "$base"
    features="$(shader_features)"

    info "Building Zed (release); the first build compiles every dependency"
    # shellcheck disable=SC2086 # features is empty or one flag plus its value
    (cd "$SOURCE_DIR" && cargo build --release --package zed $features)
    (cd "$SOURCE_DIR" && cargo build --release --package cli)
    bundle_app
}

# Mirrors the local-install path of upstream script/bundle-mac, minus the
# bundled git binary: without ZED_BUNDLE at compile time Zed uses system git.
bundle_app() {
    local zed_crate="$SOURCE_DIR/crates/zed"
    local entitlements="$APP_PATH/Contents/Resources/zed.entitlements"

    info "Bundling $APP_NAME"
    cp "$zed_crate/Cargo.toml" "$zed_crate/Cargo.toml.orig"
    sed -i '' 's/package.metadata.bundle-dev/package.metadata.bundle/' "$zed_crate/Cargo.toml"
    (cd "$zed_crate" && CARGO_BUNDLE_SKIP_BUILD=true cargo bundle --release --select-workspace-root > /dev/null) || {
        mv "$zed_crate/Cargo.toml.orig" "$zed_crate/Cargo.toml"
        error "cargo bundle failed"
    }
    mv "$zed_crate/Cargo.toml.orig" "$zed_crate/Cargo.toml"

    cp "$zed_crate/resources/Document.icns" "$APP_PATH/Contents/Resources/Document.icns"
    cp "$SOURCE_DIR/target/release/cli" "$APP_PATH/Contents/MacOS/cli"

    # Ad-hoc signing cannot carry the associated-domains entitlement.
    sed '/com.apple.developer.associated-domains/,+1d' "$zed_crate/resources/zed.entitlements" > "$entitlements"
    codesign --force --deep --entitlements "$entitlements" --sign - "$APP_PATH"
    info "Bundled $APP_PATH"
}

install_app() {
    if [ ! -d "$APP_PATH" ]; then
        error "No bundle at $APP_PATH; run build first"
    fi

    rm -rf "/Applications/$APP_NAME"
    cp -R "$APP_PATH" "/Applications/$APP_NAME"
    info "Installed /Applications/$APP_NAME"
}

install_remote_server() {
    local host=$1
    local binary="$SOURCE_DIR/target/remote_server/$REMOTE_TARGET/release/remote_server"
    local stripped="$binary.stripped"
    local llvm_strip

    if [ -z "$host" ]; then
        usage
    fi
    require_tools zig cargo-zigbuild

    info "Cross-compiling the remote server for $REMOTE_TARGET"
    (cd "$SOURCE_DIR" && RUSTFLAGS="-C target-feature=+crt-static" cargo zigbuild --release --package remote_server --target "$REMOTE_TARGET" --target-dir target/remote_server)

    # The release profile keeps debug info, which makes the upload several times larger.
    llvm_strip="$(cd "$SOURCE_DIR" && rustc --print sysroot)/lib/rustlib/$(cd "$SOURCE_DIR" && rustc -vV | sed -n 's/^host: //p')/bin/llvm-strip"
    if [ ! -x "$llvm_strip" ]; then
        error "llvm-strip not found; run: rustup component add llvm-tools (inside $SOURCE_DIR)"
    fi
    "$llvm_strip" --strip-debug -o "$stripped" "$binary"

    info "Installing the remote server on $host"
    ssh "$host" "mkdir -p \"\$(dirname ~/$REMOTE_SERVER_PATH)\""
    scp -q "$stripped" "$host:$REMOTE_SERVER_PATH.tmp"
    ssh "$host" "chmod +x ~/$REMOTE_SERVER_PATH.tmp && mv ~/$REMOTE_SERVER_PATH.tmp ~/$REMOTE_SERVER_PATH && ~/$REMOTE_SERVER_PATH version"
}

export_patches() {
    local base

    base="$(base_commit)"
    rm -f "$PATCH_DIR"/*.patch
    mkdir -p "$PATCH_DIR"
    git -C "$SOURCE_DIR" format-patch --quiet --no-signature --zero-commit -o "$PATCH_DIR" "$base..$WORK_BRANCH"
    info "Exported patches to $PATCH_DIR:"
    ls "$PATCH_DIR"
}

update_base() {
    local new_base

    ensure_source
    require_clean_source
    git -C "$SOURCE_DIR" fetch --filter=blob:none origin main
    new_base="$(git -C "$SOURCE_DIR" rev-parse origin/main)"

    info "Rebasing $WORK_BRANCH onto $new_base"
    if ! git -C "$SOURCE_DIR" rebase --quiet --onto "$new_base" "$(base_commit)" "$WORK_BRANCH"; then
        error "Rebase stopped on a conflict in $SOURCE_DIR; resolve it, run 'git rebase --continue' there, then set $BASE_COMMIT_FILE to $new_base and run export"
    fi

    echo "$new_base" > "$BASE_COMMIT_FILE"
    export_patches
}

ACTION=${1:-build}

case "$ACTION" in
    build)
        build_zed
        ;;
    install)
        install_app
        ;;
    remote)
        install_remote_server "${2:-}"
        ;;
    export)
        export_patches
        ;;
    update)
        update_base
        ;;
    help|--help|-h)
        usage 0
        ;;
    *)
        usage
        ;;
esac
