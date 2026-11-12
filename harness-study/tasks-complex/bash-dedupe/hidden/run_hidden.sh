#!/bin/bash
# Usage: run_hidden.sh FIXTURE
script="$1/bin/dedupe.sh"
fail() { echo "FAIL: $*"; exit 1; }
t="$(mktemp -d)"
d="$t/data"
mkdir -p "$d/sub dir" "$d/.hidden" "$d/-dash"
printf 'X' > "$d/b.txt"
printf 'X' > "$d/a b.txt"
printf 'X' > "$d/-n"
printf 'X' > "$d/.hidden/x"
printf 'X' > "$d/sub dir/*"
printf 'X' > "$d/back\\slash"
printf 'Y' > "$d/-dash/y1"
printf 'Y' > "$d/y2"
printf 'Z' > "$d/z"
: > "$d/empty1"
: > "$d/empty2"
printf 'X' > "$t/outside"
ln -s "$t/outside" "$d/link-to-dup"
ln -s "$d/b.txt" "$d/link-inside"
out="$(cd "$t" && bash "$script" "$d" 2> "$t/err")" || fail "nonzero exit: $(cat "$t/err")"
expected="$(LC_ALL=C sort <<'LIST'
removed .hidden/x
removed a b.txt
removed b.txt
removed back\slash
removed sub dir/*
removed y2
LIST
)"
[ "$out" = "$expected" ] || fail "stdout mismatch:\n$out\n--- expected:\n$expected"
[ -e "$d/-n" ] || fail "kept file -n missing"
[ -e "$d/-dash/y1" ] || fail "kept y1 missing"
[ -e "$d/empty1" ] && [ -e "$d/empty2" ] || fail "empty files removed"
[ -L "$d/link-to-dup" ] && [ -L "$d/link-inside" ] || fail "symlink removed"
[ -e "$t/outside" ] || fail "followed symlink"
[ -e "$d/z" ] || fail "unique file removed"
bash "$script" "$t/nope" > /dev/null 2>&1
[ $? -eq 2 ] || fail "missing dir should exit 2"
bash "$script" "$d/z" > /dev/null 2>&1
[ $? -eq 2 ] || fail "file arg should exit 2"
out2="$(bash "$script" "$d")" || fail "second run failed"
[ -z "$out2" ] || fail "second run should remove nothing, got: $out2"
echo ok
