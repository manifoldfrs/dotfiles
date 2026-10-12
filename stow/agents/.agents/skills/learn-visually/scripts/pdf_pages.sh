#!/bin/bash
# Rasterize every page of a PDF for inspection, plus a contact sheet.
#   pdf_pages.sh <in.pdf> <out-dir> [dpi]
set -e

PDF="$1"
OUT="$2"
DPI="${3:-110}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info() { echo -e "${GREEN}[pdf_pages]${NC} $1"; }
warn() { echo -e "${YELLOW}[pdf_pages]${NC} $1"; }
error() { echo -e "${RED}[pdf_pages]${NC} $1" >&2; }

if [ -z "$PDF" ] || [ -z "$OUT" ]; then
    error "usage: pdf_pages.sh <in.pdf> <out-dir> [dpi]"
    exit 2
fi
mkdir -p "$OUT"

if command -v pdftoppm >/dev/null 2>&1; then
    pdftoppm -r "$DPI" -png "$PDF" "$OUT/page"
elif command -v swift >/dev/null 2>&1 && [ "$(uname)" = "Darwin" ]; then
    swift "$SCRIPT_DIR/pdf_pages.swift" "$PDF" "$OUT" "$DPI" >/dev/null
else
    error "need pdftoppm (poppler) or macOS swift to rasterize pages"
    exit 1
fi

if command -v magick >/dev/null 2>&1; then
    # montage reports a missing label font as an error even when the sheet is written.
    magick montage "$OUT"/page*.png -tile 6x -geometry 300x+6+6 -background '#9a9a9a' "$OUT/contact-sheet.jpg" 2>/dev/null || true
fi
if [ -f "$OUT/contact-sheet.jpg" ]; then
    info "contact sheet: $OUT/contact-sheet.jpg"
else
    warn "no contact sheet (ImageMagick missing or failed)"
fi
info "pages rendered: $(find "$OUT" -name 'page*.png' | wc -l | tr -d ' ')"
