#!/bin/bash
set -e

DOTFILES_DIR=${1:-"$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"}
TEST_DIR=$(mktemp -d)
trap 'rm -rf "$TEST_DIR"' EXIT

mkdir -p "$TEST_DIR/home" "$TEST_DIR/stow/bin/.local/bin" "$TEST_DIR/stow/bin/.local/share" "$TEST_DIR/project one" "$TEST_DIR/project two"
cp "$DOTFILES_DIR/stow/bin/.stow-local-ignore" "$TEST_DIR/stow/bin/.stow-local-ignore"
cp "$DOTFILES_DIR/stow/bin/.local/bin/anti-slop" "$TEST_DIR/stow/bin/.local/bin/anti-slop"
mkdir -p "$TEST_DIR/stow/bin/.local/share/anti-slop"
for file in package.json oxlint.json oxlint-effect.json plugin; do
    cp -R "$DOTFILES_DIR/stow/bin/.local/share/anti-slop/$file" "$TEST_DIR/stow/bin/.local/share/anti-slop/$file"
done
stow --no-folding --dir="$TEST_DIR/stow" --target="$TEST_DIR/home" bin
RUNTIME="$TEST_DIR/stow/bin/.local/share/anti-slop"
COMMAND="$TEST_DIR/home/.local/bin/anti-slop"

if HOME="$TEST_DIR/home" "$COMMAND" --version >"$TEST_DIR/output" 2>&1; then
    printf 'FAIL: missing runtime was accepted\n' >&2
    exit 1
fi
grep -q 'runtime missing' "$TEST_DIR/output"

: >"$TEST_DIR/user.npmrc"
: >"$TEST_DIR/global.npmrc"
npm_config_userconfig="$TEST_DIR/user.npmrc" npm_config_globalconfig="$TEST_DIR/global.npmrc" npm install \
    --prefix "$RUNTIME" --cache "$TEST_DIR/npm-cache" \
    --ignore-scripts --no-package-lock --no-audit --no-fund >"$TEST_DIR/install.log" 2>&1 || {
    tail -60 "$TEST_DIR/install.log" >&2
    exit 1
}

stow --no-folding --restow --dir="$TEST_DIR/stow" --target="$TEST_DIR/home" bin
test ! -e "$TEST_DIR/home/.local/share/anti-slop/node_modules"

for project in "$TEST_DIR/project one" "$TEST_DIR/project two"; do
    printf 'export const value = 1;\n' >"$project/good.ts"
    printf 'export const value = "ok" as unknown as string;\n' >"$project/bad.ts"
    (
        cd "$project"
        HOME="$TEST_DIR/home" "$COMMAND" good.ts
        if HOME="$TEST_DIR/home" "$COMMAND" bad.ts >"$TEST_DIR/output" 2>&1; then
            printf 'FAIL: chained assertion was accepted\n' >&2
            exit 1
        fi
        grep -q 'no-chained-type-assertions' "$TEST_DIR/output"
    )
done

cd "$TEST_DIR/project one"
printf 'export const state = { _tag: "Ready", value: 1 };\n' >state.ts
HOME="$TEST_DIR/home" "$COMMAND" state.ts
if HOME="$TEST_DIR/home" "$COMMAND" --effect state.ts >"$TEST_DIR/output" 2>&1; then
    printf 'FAIL: Effect tagged construction was accepted\n' >&2
    exit 1
fi
grep -q 'no-manual-tagged-construction' "$TEST_DIR/output"
if HOME="$TEST_DIR/home" "$COMMAND" --effect bad.ts >"$TEST_DIR/output" 2>&1; then
    printf 'FAIL: Effect configuration lost generic rules\n' >&2
    exit 1
fi
grep -q 'no-chained-type-assertions' "$TEST_DIR/output"

printf '{"rules":{"anti-slop/no-chained-type-assertions":"off"}}\n' >.oxlintrc.json
if HOME="$TEST_DIR/home" "$COMMAND" bad.ts >"$TEST_DIR/output" 2>&1; then
    printf 'FAIL: project config displaced the global check\n' >&2
    exit 1
fi
grep -q 'no-chained-type-assertions' "$TEST_DIR/output"
printf 'export const value = "ok" as unknown as string;\n' >"$TEST_DIR/expected.ts"
cmp bad.ts "$TEST_DIR/expected.ts"
test ! -e package.json
test ! -e node_modules

mkdir .agents
cp bad.ts .agents/bad.ts
HOME="$TEST_DIR/home" "$COMMAND" good.ts .agents

printf 'PASS: one global runtime checks two projects, preserves generic rules in Effect mode, ignores agent assets, and leaves projects unchanged\n'
