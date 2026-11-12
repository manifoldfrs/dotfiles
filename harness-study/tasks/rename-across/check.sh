#!/bin/bash
cd "$1" || exit 1
git diff --quiet HEAD -- test || exit 1
if rg -q -w 'getUser' src; then
  exit 1
fi
[ "$(rg -c -w 'getUserName' src | awk -F: '{s += $2} END {print s}')" = "26" ] || exit 1
node test/run.js > /dev/null 2>&1
