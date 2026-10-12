#!/bin/bash
# Pinned Psychopomp toolchain for animation mode.
#
#   psychopomp.sh status                       what is installed, and what is missing
#   psychopomp.sh setup                        clone the pinned commit and build the renderer (needs approval: downloads crates)
#   psychopomp.sh new-scene <lesson-dir>       copy the scene template into <lesson>/animation/scene
#   psychopomp.sh plan <lesson-dir>            build the scene program and write <slug>.plan.json and <slug>.beats.json
#   psychopomp.sh sheet <lesson-dir> <times>   stills at "a,b,c" or "from:to:step" seconds, plus a contact sheet
#   psychopomp.sh render <lesson-dir> [a..b]   render the film, or a window of it
set -e

PSYCHOPOMP_COMMIT="3a50a2bf1897ddeaa4e5a71df85224107aaf734b"
PSYCHOPOMP_REPO="https://github.com/kitlangton/psychopomp"
RUST_TOOLCHAIN="${LEARN_VISUALLY_RUST:-1.91}"
HOME_DIR="${LEARN_VISUALLY_HOME:-$HOME/.cache/learn-visually}"
PSYCHOPOMP_DIR="$HOME_DIR/psychopomp"
BIN="$PSYCHOPOMP_DIR/target/release/psychopomp"
SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

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

slug_of() {
    basename "$(cd "$1" && pwd)"
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

new_scene() {
    local lesson="$1"
    local scene="$lesson/animation/scene"
    if [ -e "$scene" ]; then
        error "$scene already exists"
        exit 1
    fi
    mkdir -p "$scene/src"
    sed "s|@PSYCHOPOMP_DIR@|$PSYCHOPOMP_DIR|; s|@SLUG@|$(slug_of "$lesson")|" "$SKILL_DIR/templates/scene/Cargo.toml" > "$scene/Cargo.toml"
    cp "$SKILL_DIR/templates/scene/main.rs" "$scene/src/main.rs"
    cp "$SKILL_DIR/templates/scene/film.rs" "$scene/src/film.rs"
    cp "$PSYCHOPOMP_DIR/Cargo.lock" "$scene/Cargo.lock"
    info "scene crate: $scene"
}

build_plan() {
    local lesson
    lesson="$(cd "$1" && pwd)"
    local slug
    slug="$(slug_of "$lesson")"
    (cd "$lesson/animation/scene" && cargo +"$RUST_TOOLCHAIN" build --release --offline --quiet)
    local scene_bin
    scene_bin="$(find "$lesson/animation/scene/target/release" -maxdepth 1 -type f -perm -u+x -name 'lv-*' | head -1)"
    "$scene_bin" "$lesson/example/trace.json" "$lesson/animation/$slug.plan.json"
    "$BIN" plan validate "$lesson/animation/$slug.plan.json"
}

sheet() {
    local lesson
    lesson="$(cd "$1" && pwd)"
    local times="$2"
    local slug
    slug="$(slug_of "$lesson")"
    local out="$lesson/checks/animation/sheet"
    rm -rf "$out"
    "$BIN" plan snapshot "$lesson/animation/$slug.plan.json" "$times" "$out" --theme neutral >/dev/null
    if command -v magick >/dev/null 2>&1; then
        magick montage "$out"/*.png -tile 4x -geometry 480x270+3+3 -background '#333' "$out/contact-sheet.jpg" 2>/dev/null || true
    fi
    info "stills: $out"
}

render() {
    local lesson
    lesson="$(cd "$1" && pwd)"
    local range="$2"
    local slug
    slug="$(slug_of "$lesson")"
    local plan="$lesson/animation/$slug.plan.json"
    if [ -n "$range" ]; then
        "$BIN" plan render "$plan" "$lesson/animation/$slug-window.mp4" --range "$range" --theme neutral
    else
        "$BIN" plan render "$plan" "$lesson/animation/$slug.mp4" --theme neutral
    fi
}

case "$1" in
    status) status ;;
    setup) setup ;;
    new-scene) new_scene "${2:?lesson dir}" ;;
    plan) build_plan "${2:?lesson dir}" ;;
    sheet) sheet "${2:?lesson dir}" "${3:?times}" ;;
    render) render "${2:?lesson dir}" "$3" ;;
    *)
        sed -n '2,10p' "$0"
        exit 2
        ;;
esac
