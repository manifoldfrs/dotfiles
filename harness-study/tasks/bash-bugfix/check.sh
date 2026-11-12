#!/bin/bash
cd "$1" || exit 1
git diff --quiet HEAD -- tests || exit 1
bash tests/test_stats.sh > /dev/null
