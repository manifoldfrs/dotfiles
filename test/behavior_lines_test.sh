#!/bin/bash
set -euo pipefail

repo_dir=${1:?Pass the dotfiles repository directory}
script="$repo_dir/stow/opencode/skills/sol-loop/scripts/behavior-lines"
test_dir=$(mktemp -d)
trap 'rm -rf "$test_dir"' EXIT

cd "$test_dir"
git init -q
printf 'a\nb\n' >code.ts
printf '{}\n' >package-lock.json
mkdir gen
printf 'x\n' >gen/out.ts
printf 'gen/** linguist-generated\n' >.gitattributes
seq 1 200 >moved.ts
mkdir -p services/api
printf 'old\n' >services/api/go.sum
git add -A
git -c user.email=test@example.com -c user.name=test commit -qm base

git mv code.ts renamed.ts
printf 'a\nb\nc\n' >renamed.ts
seq 1 500 >package-lock.json
seq 1 300 >gen/out.ts
printf 'new\nfile\n' >new.ts
printf '\000\001' >blob.bin
mv moved.ts moved-plain.ts
seq 1 50 >services/api/go.sum

index_before=$(git ls-files --stage)
actual=$("$script" HEAD 2>/dev/null)
if [ "$actual" != "3" ]; then
    echo "FAIL: behavior-lines counted $actual, expected 3 (one edited line plus a two-line new file)"
    exit 1
fi
if [ "$(git ls-files --stage)" != "$index_before" ]; then
    echo "FAIL: behavior-lines changed the real index"
    exit 1
fi
echo "PASS: behavior-lines skips lockfiles, generated files, binaries, nested go.sum, and staged or plain renames"
