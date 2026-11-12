#!/bin/bash
cd "$1" || exit 1
git diff --quiet HEAD -- test || exit 1
node --test > /dev/null 2>&1
