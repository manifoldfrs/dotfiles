#!/bin/bash
set -e
got=$(tr -d ' _' <<< "$3" | tr 'A-Z' 'a-z')
case "$got" in
  "o(logn)"|"o(log2n)"|"o(lgn)") exit 0 ;;
esac
exit 1
