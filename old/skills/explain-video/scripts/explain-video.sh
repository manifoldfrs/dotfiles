#!/bin/bash
# Narrated explainer films on the pinned Psychopomp renderer.
#
#   explain-video.sh status                    what is installed, and what is missing
#   explain-video.sh setup <film-dir>          download the locked crates the scene needs (once per machine)
#   explain-video.sh new <slug> [parent-dir]   copy the scene template into <parent-dir>/<slug> (default parent: agent artifacts dir)
#   explain-video.sh plan <film-dir>           time with macOS say (draft audio), write and validate <slug>.plan.json
#   explain-video.sh cost <film-dir>           report what voicing would generate and its estimated cost; calls nothing
#   explain-video.sh voice <film-dir>          generate missing or changed narration, then write and validate the plan
#   explain-video.sh sheet <film-dir> [step]   a still every <step> seconds (default 3), plus a contact sheet
#   explain-video.sh render <film-dir>         render <slug>.mp4 and check it
set -e

HOME_DIR="${LEARN_VISUALLY_HOME:-$HOME/.cache/learn-visually}"
PSYCHOPOMP_DIR="$HOME_DIR/psychopomp"
BIN="$PSYCHOPOMP_DIR/target/release/psychopomp"
RUST_TOOLCHAIN="${LEARN_VISUALLY_RUST:-1.91}"
TARGET_DIR="${EXPLAIN_VIDEO_TARGET_DIR:-$HOME/.cache/explain-video/target}"
ARTIFACTS_DIR="${TMPDIR:-/tmp}"
ARTIFACTS_DIR="${ARTIFACTS_DIR%/}/agent-artifacts"
SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPTS_DIR="$SKILL_DIR/scripts"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info() { echo -e "${GREEN}[explain-video]${NC} $1"; }
warn() { echo -e "${YELLOW}[explain-video]${NC} $1"; }
error() { echo -e "${RED}[explain-video]${NC} $1" >&2; }

slug_of() {
    basename "$(cd "$1" && pwd)"
}

status() {
    local ok=0
    if ! bash "$SCRIPTS_DIR/psychopomp.sh" status; then
        ok=1
    fi
    if command -v uvx >/dev/null 2>&1; then
        info "uvx: $(command -v uvx) (Whisper times macOS say drafts)"
    else
        warn "uvx: missing; draft narration cannot be timed"
        ok=1
    fi
    if [ -n "$ELEVENLABS_API_KEY" ]; then
        info "ELEVENLABS_API_KEY: set"
    else
        warn "ELEVENLABS_API_KEY: not set; narration uses macOS say"
    fi
    if [ -n "$ELEVENLABS_VOICE_ID" ]; then
        info "ELEVENLABS_VOICE_ID: $ELEVENLABS_VOICE_ID (overrides the template voice)"
    fi
    return "$ok"
}

new_film() {
    local slug="$1"
    local film="${2:-$ARTIFACTS_DIR/explain-video}/$slug"
    if [[ ! "$slug" =~ ^[a-z0-9-]+$ ]]; then
        error "slug '$slug' must be kebab-case"
        exit 1
    fi
    if [ -e "$film/scene" ]; then
        error "$film/scene already exists"
        exit 1
    fi
    mkdir -p "$film/scene/src"
    sed "s|@PSYCHOPOMP_DIR@|$PSYCHOPOMP_DIR|; s|@SLUG@|$slug|" "$SKILL_DIR/templates/Cargo.toml" > "$film/scene/Cargo.toml"
    cp "$SKILL_DIR/templates/main.rs" "$film/scene/src/main.rs"
    cp "$PSYCHOPOMP_DIR/Cargo.lock" "$film/scene/Cargo.lock"
    info "film: $film"
}

emit() {
    local film
    film="$(cd "$1" && pwd)"
    local slug
    slug="$(slug_of "$film")"
    (cd "$film/scene" && CARGO_TARGET_DIR="$TARGET_DIR" cargo +"$RUST_TOOLCHAIN" build --release --offline --quiet)
    "$TARGET_DIR/release/explain-video-$slug" "$film" "$slug"
    if [ "$PSYCHOPOMP_MEDIA" != "plan" ]; then
        "$BIN" plan validate "$film/$slug.plan.json"
    fi
}

setup() {
    local film
    film="$(cd "$1" && pwd)"
    (cd "$film/scene" && cargo +"$RUST_TOOLCHAIN" fetch --locked)
    info "crates fetched; builds now run offline"
}

voice() {
    if [ -z "$ELEVENLABS_API_KEY" ]; then
        warn "ELEVENLABS_API_KEY is not set; voicing with macOS say"
    fi
    PSYCHOPOMP_MEDIA=apply emit "$1"
}

sheet() {
    local film
    film="$(cd "$1" && pwd)"
    local step="${2:-3}"
    local slug
    slug="$(slug_of "$film")"
    local plan="$film/$slug.plan.json"
    local seconds
    seconds="$(bun -e "console.log(Math.floor(require('$plan').durationNanos / 1e9))")"
    local out="$film/checks/sheet"
    rm -rf "$out"
    "$BIN" plan snapshot "$plan" "0:$seconds:$step" "$out" --theme neutral >/dev/null
    if command -v magick >/dev/null 2>&1; then
        magick montage "$out"/*.png -tile 4x -geometry 480x270+3+3 -background '#333' "$out/contact-sheet.jpg" 2>/dev/null || true
    fi
    info "stills: $out"
}

render() {
    local film
    film="$(cd "$1" && pwd)"
    local slug
    slug="$(slug_of "$film")"
    local plan="$film/$slug.plan.json"
    "$BIN" plan render "$plan" "$film/$slug.mp4" --theme neutral
    bun "$SCRIPTS_DIR/video_check.ts" "$film/$slug.mp4" "$plan" "$film/checks/video"
    if ! ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "$film/$slug.mp4" | grep -q .; then
        error "$slug.mp4 has no audio stream"
        exit 1
    fi
    info "film: $film/$slug.mp4"
}

case "$1" in
    status) status ;;
    setup) setup "${2:?film dir}" ;;
    new) new_film "${2:?slug}" "$3" ;;
    plan) PSYCHOPOMP_MEDIA=draft emit "${2:?film dir}" ;;
    cost) PSYCHOPOMP_MEDIA=plan emit "${2:?film dir}" || true ;;
    voice) voice "${2:?film dir}" ;;
    sheet) sheet "${2:?film dir}" "$3" ;;
    render) render "${2:?film dir}" ;;
    *)
        sed -n '2,11p' "$0"
        exit 2
        ;;
esac
