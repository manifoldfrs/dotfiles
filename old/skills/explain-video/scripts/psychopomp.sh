#!/bin/bash
# Pinned Psychopomp renderer for explainer films.
#
#   psychopomp.sh status   what is installed, and what is missing
#   psychopomp.sh setup    clone the pinned commit and build the renderer (downloads about 380 crates)
set -e

PSYCHOPOMP_COMMIT="3a50a2bf1897ddeaa4e5a71df85224107aaf734b"
PSYCHOPOMP_REPO="https://github.com/kitlangton/psychopomp"
RUST_TOOLCHAIN="${LEARN_VISUALLY_RUST:-1.91}"
# The cache path predates explain-video; keeping it reuses an existing renderer build.
HOME_DIR="${LEARN_VISUALLY_HOME:-$HOME/.cache/learn-visually}"
PSYCHOPOMP_DIR="$HOME_DIR/psychopomp"
BIN="$PSYCHOPOMP_DIR/target/release/psychopomp"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info() { echo -e "${GREEN}[psychopomp]${NC} $1"; }
warn() { echo -e "${YELLOW}[psychopomp]${NC} $1"; }
error() { echo -e "${RED}[psychopomp]${NC} $1" >&2; }

require() {
    if ! command -v "$1" >/dev/null 2>&1; then
        error "missing $1: $2"
        exit 1
    fi
}


status() {
    local ok=0
    for tool in git rustup ffmpeg ffprobe; do
        if command -v "$tool" >/dev/null 2>&1; then
            info "$tool: $(command -v "$tool")"
        else
            warn "$tool: missing"
            ok=1
        fi
    done
    if command -v rustup >/dev/null 2>&1 && rustup toolchain list | grep -q "^$RUST_TOOLCHAIN"; then
        info "rust toolchain $RUST_TOOLCHAIN: installed"
    else
        warn "rust toolchain $RUST_TOOLCHAIN: missing (Psychopomp needs edition 2024 and Rust >= 1.89)"
        ok=1
    fi
    if command -v ffmpeg >/dev/null 2>&1 && ! ffmpeg -hide_banner -encoders 2>/dev/null | grep -q libx264; then
        warn "ffmpeg has no libx264 encoder"
        ok=1
    fi
    if [ -x "$BIN" ]; then
        info "renderer: $BIN at $(git -C "$PSYCHOPOMP_DIR" rev-parse --short HEAD)"
    else
        warn "renderer: not built ($BIN)"
        ok=1
    fi
    return "$ok"
}

setup() {
    require git "install git"
    require rustup "install rustup"
    require ffmpeg "install ffmpeg with libx264"
    if ! rustup toolchain list | grep -q "^$RUST_TOOLCHAIN"; then
        info "installing Rust $RUST_TOOLCHAIN beside the default toolchain"
        rustup toolchain install "$RUST_TOOLCHAIN" --profile minimal
    fi
    mkdir -p "$HOME_DIR"
    if [ ! -d "$PSYCHOPOMP_DIR/.git" ]; then
        git clone "$PSYCHOPOMP_REPO" "$PSYCHOPOMP_DIR"
    fi
    git -C "$PSYCHOPOMP_DIR" fetch --quiet origin "$PSYCHOPOMP_COMMIT" 2>/dev/null || true
    git -C "$PSYCHOPOMP_DIR" checkout --quiet "$PSYCHOPOMP_COMMIT"
    info "building the renderer at ${PSYCHOPOMP_COMMIT:0:7} with --locked"
    (cd "$PSYCHOPOMP_DIR" && cargo +"$RUST_TOOLCHAIN" build --release --locked -p psychopomp-render)
    info "ready: $BIN"
}

case "$1" in
    status) status ;;
    setup) setup ;;
    *) echo "usage: psychopomp.sh status|setup" >&2; exit 2 ;;
esac
