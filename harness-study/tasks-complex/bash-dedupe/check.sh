#!/bin/bash
# Grade on a copy with the hidden tests; visible tests must be unchanged.
here="$(cd "$(dirname "$0")" && pwd)"
cd "$1" || exit 1
git diff --quiet HEAD -- test || exit 1
work="$(mktemp -d)"
cp -R . "$work/"
timeout 60 bash "$work/test/run.sh" > /dev/null 2>&1 || exit 1
timeout 120 bash "$here/hidden/run_hidden.sh" "$work" > /dev/null 2>&1
