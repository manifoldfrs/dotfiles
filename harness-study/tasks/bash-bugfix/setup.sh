#!/bin/bash
set -e
fixture="$1"
mkdir -p "$fixture/scripts" "$fixture/tests"
cat > "$fixture/scripts/stats.sh" <<'EOF'
#!/bin/bash
# Usage: stats.sh median|mean NUM...
set -e
cmd="$1"
shift
sorted=($(printf '%s\n' "$@" | sort -n))
count=${#sorted[@]}
case "$cmd" in
  mean)
    sum=0
    for n in "${sorted[@]}"; do
      sum=$((sum + n))
    done
    echo $((sum / count))
    ;;
  median)
    mid=$((count / 2))
    if [ $((count % 2)) -eq 1 ]; then
      echo "${sorted[$mid]}"
    else
      echo $(( (sorted[mid] + sorted[mid + 1]) / 2 ))
    fi
    ;;
esac
EOF
cat > "$fixture/tests/test_stats.sh" <<'EOF'
#!/bin/bash
fail=0
check() {
  local expected="$1"
  shift
  local got
  got=$(bash scripts/stats.sh "$@")
  if [ "$got" != "$expected" ]; then
    echo "FAIL: stats.sh $* -> $got (expected $expected)"
    fail=1
  fi
}
check 3 median 5 1 3
check 25 median 10 20 30 40
check 3 median 4 1 2 5
check 20 mean 10 20 30
check 7 median 7
exit $fail
EOF
echo "done" > "$2"
