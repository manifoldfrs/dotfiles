#!/bin/bash

# Compare or sync the tracked global Pi skills with Matt Pocock and dmmulroy.
# Usage: ./scripts/update_agent_skills.sh [--check|--review|--sync]

set -euo pipefail

DOTFILES_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
DEST="$DOTFILES_DIR/stow/agents/.agents/skills"
MANIFEST_NAME=".skill-sources.tsv"
MATT_REPO="https://github.com/mattpocock/skills.git"
DMMULROY_REPO="https://github.com/dmmulroy/.dotfiles.git"
MODE="report"

usage() {
    cat <<'EOF'
Usage: ./scripts/update_agent_skills.sh [--check|--review|--sync]

Modes:
  (none)     Fetch both sources and print added, changed, removed, and unchanged skills.
  --check    Exit non-zero when the tracked skill tree differs from the fetched sources.
  --review   Write a Markdown report under .scratch/ and open it in Plannotator.
  --sync     Apply the fetched stable Matt catalog and dmmulroy personalization layer.

The stable Matt catalog is discovered from skills/engineering and skills/productivity.
Dmmulroy skills not present in Matt's stable catalog are treated as personalization.
Existing local-owned skills win over same-name dmmulroy skills. Matt owns collisions with
its stable catalog so that its composed workflow stays internally consistent.
EOF
}

case "${1:-}" in
    "") ;;
    --check) MODE="check" ;;
    --review) MODE="review" ;;
    --sync) MODE="sync" ;;
    -h|--help) usage; exit 0 ;;
    *) usage >&2; exit 2 ;;
esac

command -v git >/dev/null || { echo "git is required" >&2; exit 1; }
command -v diff >/dev/null || { echo "diff is required" >&2; exit 1; }

work_dir="$(mktemp -d)"
trap 'rm -rf "$work_dir"' EXIT
matt_dir="$work_dir/matt"
dmm_dir="$work_dir/dmmulroy"
expected="$work_dir/expected"
old_manifest="$work_dir/old-manifest.tsv"
new_manifest="$work_dir/new-manifest.tsv"
report="$work_dir/report.tsv"

printf 'Fetching Matt Pocock skills...\n'
git clone --quiet --depth 1 "$MATT_REPO" "$matt_dir"
printf 'Fetching dmmulroy skills...\n'
git clone --quiet --depth 1 "$DMMULROY_REPO" "$dmm_dir"

matt_sha="$(git -C "$matt_dir" rev-parse HEAD)"
dmm_sha="$(git -C "$dmm_dir" rev-parse HEAD)"
printf 'Matt:     %s\n' "$matt_sha"
printf 'dmmulroy: %s\n' "$dmm_sha"

mkdir -p "$DEST" "$expected"
if [ -d "$DEST" ]; then
    cp -R "$DEST"/. "$expected"/ 2>/dev/null || true
fi

if [ -f "$DEST/$MANIFEST_NAME" ]; then
    grep -v '^#' "$DEST/$MANIFEST_NAME" > "$old_manifest" || true
else
    : > "$old_manifest"
fi
cp "$old_manifest" "$new_manifest"

owner_of() {
    awk -F '\t' -v skill="$1" '$1 == skill { print $2; exit }' "$new_manifest"
}

set_owner() {
    local skill=$1
    local source=$2
    local temp="$work_dir/manifest-next.tsv"
    awk -F '\t' -v skill="$skill" '$1 != skill' "$new_manifest" > "$temp"
    printf '%s\t%s\n' "$skill" "$source" >> "$temp"
    sort "$temp" > "$new_manifest"
}

copy_skill() {
    local src=$1
    local skill=$2
    rm -rf "$expected/$skill"
    cp -R "$src" "$expected/$skill"
}

matt_catalog="$work_dir/matt-catalog.tsv"
: > "$matt_catalog"
for group in engineering productivity; do
    group_dir="$matt_dir/skills/$group"
    [ -d "$group_dir" ] || continue
    for skill_dir in "$group_dir"/*; do
        [ -f "$skill_dir/SKILL.md" ] || continue
        printf '%s\t%s\n' "$(basename "$skill_dir")" "$skill_dir" >> "$matt_catalog"
    done
done
sort -o "$matt_catalog" "$matt_catalog"

# Matt's stable catalog is the baseline and wins same-name collisions.
while IFS=$'\t' read -r skill skill_dir; do
    [ -n "$skill" ] || continue
    copy_skill "$skill_dir" "$skill"
    set_owner "$skill" "matt"
done < "$matt_catalog"

# Dmmulroy-only skills form the personalization layer. Existing local skills win.
dmm_catalog="$work_dir/dmm-catalog.tsv"
: > "$dmm_catalog"
for skill_dir in "$dmm_dir/home/.agents/skills"/*; do
    [ -f "$skill_dir/SKILL.md" ] || continue
    skill="$(basename "$skill_dir")"
    printf '%s\t%s\n' "$skill" "$skill_dir" >> "$dmm_catalog"
done
sort -o "$dmm_catalog" "$dmm_catalog"

while IFS=$'\t' read -r skill skill_dir; do
    [ -n "$skill" ] || continue
    if awk -F '\t' -v skill="$skill" '$1 == skill { found=1 } END { exit !found }' "$matt_catalog"; then
        continue
    fi

    owner="$(owner_of "$skill")"
    if [ "$owner" = "local" ]; then
        continue
    fi
    if [ -z "$owner" ] && [ -d "$DEST/$skill" ]; then
        set_owner "$skill" "local"
        continue
    fi

    copy_skill "$skill_dir" "$skill"
    set_owner "$skill" "dmmulroy"
done < "$dmm_catalog"

# Remove source-owned skills that disappeared from their source catalog.
while IFS=$'\t' read -r skill source; do
    [ -n "$skill" ] || continue
    current_owner="$(owner_of "$skill")"
    case "$source" in
        matt)
            if [ "$current_owner" = "matt" ] && ! awk -F '\t' -v skill="$skill" '$1 == skill { found=1 } END { exit !found }' "$matt_catalog"; then
                rm -rf "$expected/$skill"
                temp="$work_dir/manifest-next.tsv"
                awk -F '\t' -v skill="$skill" '$1 != skill' "$new_manifest" > "$temp"
                mv "$temp" "$new_manifest"
            fi
            ;;
        dmmulroy)
            if [ "$current_owner" = "dmmulroy" ] && ! awk -F '\t' -v skill="$skill" '$1 == skill { found=1 } END { exit !found }' "$dmm_catalog"; then
                rm -rf "$expected/$skill"
                temp="$work_dir/manifest-next.tsv"
                awk -F '\t' -v skill="$skill" '$1 != skill' "$new_manifest" > "$temp"
                mv "$temp" "$new_manifest"
            fi
            ;;
    esac
done < "$old_manifest"

{
    printf '# skill\tsource\n'
    sort "$new_manifest"
} > "$expected/$MANIFEST_NAME"

# Build a per-skill report.
: > "$report"
{
    for dir in "$DEST"/* "$expected"/*; do
        [ -d "$dir" ] || continue
        basename "$dir"
    done
} | sort -u | while IFS= read -r skill; do
    current="$DEST/$skill"
    next="$expected/$skill"
    source="$(awk -F '\t' -v skill="$skill" '$1 == skill { print $2; exit }' "$new_manifest")"
    if [ ! -d "$current" ]; then
        status="added"
    elif [ ! -d "$next" ]; then
        status="removed"
    elif diff -qr "$current" "$next" >/dev/null; then
        status="unchanged"
    else
        status="changed"
    fi
    printf '%s\t%s\t%s\n' "$status" "$skill" "${source:-local}" >> "$report"
done

printf '\nSkill changes:\n'
awk -F '\t' '{ printf "  %-10s %-36s %s\n", $1, $2, $3 }' "$report"

changed_count="$(awk -F '\t' '$1 != "unchanged" { count++ } END { print count+0 }' "$report")"
printf '\n%s skill change(s) detected.\n' "$changed_count"

case "$MODE" in
    report)
        ;;
    check)
        [ "$changed_count" -eq 0 ]
        ;;
    review)
        review_dir="$DOTFILES_DIR/.scratch"
        review_file="$review_dir/agent-skills-update.md"
        mkdir -p "$review_dir"
        {
            printf '# Agent Skills Update Review\n\n'
            printf -- '- Matt commit: `%s`\n' "$matt_sha"
            printf -- '- dmmulroy commit: `%s`\n\n' "$dmm_sha"
            printf '| Status | Skill | Source |\n| --- | --- | --- |\n'
            awk -F '\t' '{ printf "| %s | `%s` | %s |\n", $1, $2, $3 }' "$report"
            printf '\nRun `./scripts/update_agent_skills.sh --sync` to apply this snapshot.\n'
        } > "$review_file"
        printf 'Review written to %s\n' "$review_file"
        if command -v plannotator >/dev/null; then
            plannotator annotate "$review_file"
        fi
        ;;
    sync)
        sync_dir="$DEST.sync.$$"
        old_dir="$DEST.old.$$"
        rm -rf "$sync_dir" "$old_dir"
        mkdir -p "$sync_dir"
        cp -R "$expected"/. "$sync_dir"/
        mv "$DEST" "$old_dir"
        if mv "$sync_dir" "$DEST"; then
            rm -rf "$old_dir"
        else
            mv "$old_dir" "$DEST"
            echo "Failed to activate synced skills; restored the previous tree." >&2
            exit 1
        fi
        printf 'Synced global skill sources. Review with: git status --short && git diff --stat\n'
        ;;
esac
