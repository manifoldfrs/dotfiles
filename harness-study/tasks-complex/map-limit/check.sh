#!/bin/bash
# Grade on a copy with the hidden tests added; visible tests must be unchanged.
here="$(cd "$(dirname "$0")" && pwd)"
cd "$1" || exit 1
git diff --quiet HEAD -- test || exit 1
work="$(mktemp -d)"
cp -R . "$work/"
cp "$here"/hidden/*.js "$work/test/"
cd "$work" && timeout 60 node --test --test-timeout=20000 > /dev/null 2>&1
