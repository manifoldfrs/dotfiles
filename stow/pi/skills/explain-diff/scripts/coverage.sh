#!/bin/bash
# Check that a diff walkthrough names every changed file.
#
#   coverage.sh <walkthrough.html> [git diff arguments...]
#
# With no diff arguments, compares the merge base with the default branch to the working tree,
# untracked files included.
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

html="${1:?walkthrough.html}"
shift

include_untracked=0
if [ "$#" -eq 0 ]; then
    include_untracked=1
    default_branch="$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null || echo origin/main)"
    set -- "$(git merge-base HEAD "$default_branch")"
fi

missing=0
total=0
while IFS= read -r path; do
    total=$((total + 1))
    if ! grep -qF -- "$path" "$html"; then
        echo -e "${RED}[coverage]${NC} missing: $path"
        missing=$((missing + 1))
    fi
done < <(git diff --name-only "$@")
while IFS= read -r path; do
    total=$((total + 1))
    if ! grep -qF -- "$path" "$html"; then
        echo -e "${RED}[coverage]${NC} missing untracked: $path"
        missing=$((missing + 1))
    fi
done < <(if [ "$include_untracked" -eq 1 ]; then git ls-files --others --exclude-standard; fi)

if [ "$missing" -gt 0 ]; then
    echo -e "${RED}[coverage]${NC} $missing of $total changed files are not in $html"
    exit 1
fi
echo -e "${GREEN}[coverage]${NC} all $total changed files are in $html"
