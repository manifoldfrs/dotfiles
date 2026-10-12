#!/bin/bash
# Structural lint for a learn-visually lesson folder.
#   check_lesson.sh <lesson-dir>
# Checks that the plan has every required section, the trace has its required
# fields, the quiz separates answers, each mode that exists has its deliverable,
# and every row in checks.md has a verdict. It checks structure, not correctness.
set -e

LESSON="${1:?usage: check_lesson.sh <lesson-dir>}"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
FAILS=0

info() { echo -e "${GREEN}PASS${NC} $1"; }
warn() { echo -e "${YELLOW}NOTE${NC} $1"; }
error() { echo -e "${RED}FAIL${NC} $1"; FAILS=$((FAILS + 1)); }

require_file() {
    if [ -s "$LESSON/$1" ]; then
        info "$1 exists"
    else
        error "$1 is missing or empty"
    fi
}

require_heading() {
    if grep -qE "^## $1" "$LESSON/plan.md"; then
        info "plan.md has '## $1'"
    else
        error "plan.md lacks '## $1'"
    fi
}

require_file plan.md
require_file example/trace.json
require_file quiz.md
require_file checks.md

if [ -s "$LESSON/plan.md" ]; then
    for heading in Outcomes Sources "Running example" Legend Storyboard "Break points" "Debug challenge" "Transfer case"; do
        require_heading "$heading"
    done
    for beat in problem "mental model" "worked example" "edge case" application; do
        if grep -qiE "^\| *$beat *\|" "$LESSON/plan.md"; then
            info "storyboard has the '$beat' beat"
        else
            error "storyboard lacks the '$beat' beat"
        fi
    done
    predictions=$(grep -oE '\bP[0-9]+\b' "$LESSON/plan.md" | sort -u | wc -l | tr -d ' ')
    if [ "$predictions" -ge 2 ]; then
        info "plan names $predictions predictions"
    else
        error "plan names fewer than 2 predictions (P1, P2, ...)"
    fi
fi

if [ -s "$LESSON/example/trace.json" ]; then
    if node -e '
        const t = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"))
        const missing = ["concept", "provenance", "generator", "model", "scenarios"].filter((k) => !(k in t))
        const empty = Object.entries(t.scenarios ?? {}).filter(([, s]) => !Array.isArray(s.steps) || s.steps.length === 0).map(([id]) => id)
        if (missing.length || empty.length) { console.error("missing: " + missing.join(", ") + (empty.length ? " empty scenarios: " + empty.join(", ") : "")); process.exit(1) }
    ' "$LESSON/example/trace.json"; then
        info "trace.json has its required fields and non-empty scenarios"
    else
        error "trace.json is missing required fields"
    fi
fi

if [ -s "$LESSON/quiz.md" ]; then
    if grep -qE '^---$' "$LESSON/quiz.md" && grep -qiE '^## Answers' "$LESSON/quiz.md"; then
        info "quiz.md separates answers"
    else
        error "quiz.md needs a '---' separator and an '## Answers' section"
    fi
fi

if [ -d "$LESSON/interactive" ]; then
    require_file interactive/index.html
    if grep -qE '<script[^>]+src=|<link[^>]+rel="stylesheet"[^>]+href=' "$LESSON/interactive/index.html"; then
        error "interactive/index.html loads external files"
    else
        info "interactive/index.html is self-contained"
    fi
else
    warn "no interactive/ folder"
fi
if [ -d "$LESSON/manual" ]; then
    require_file manual/manual.pdf
    require_file manual/manual.src.html
else
    warn "no manual/ folder"
fi
if [ -d "$LESSON/animation" ]; then
    slug=$(basename "$(cd "$LESSON" && pwd)")
    require_file "animation/$slug.mp4"
    require_file "animation/$slug.plan.json"
    require_file animation/scene/src/main.rs
else
    warn "no animation/ folder"
fi

if [ -s "$LESSON/checks.md" ]; then
    blank=$(grep -E '^\|' "$LESSON/checks.md" | grep -vE '^\| *(Area|---)' | awk -F'|' '{ gsub(/ /, "", $4); if ($4 == "") print }' | wc -l | tr -d ' ')
    if [ "$blank" -eq 0 ]; then
        info "every checks.md row has a verdict"
    else
        error "$blank checks.md rows have no verdict"
    fi
fi

if [ "$FAILS" -gt 0 ]; then
    echo -e "${RED}$FAILS structural problem(s)${NC}" >&2
    exit 1
fi
echo -e "${GREEN}lesson structure OK${NC}"
