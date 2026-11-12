#!/bin/bash
set -e
fixture="$1"
expected_file="$2"
total=0
for i in $(seq -w 1 40); do
  n=$((10#$i))
  case $((n % 3)) in
    0) env="prod" ;;
    1) env="staging" ;;
    *) env="dev" ;;
  esac
  [ $((n % 7)) -eq 0 ] && env="prod"
  port=$((8000 + (n * 37) % 900))
  mkdir -p "$fixture/services/svc-$i"
  {
    echo "name = \"svc-$i\""
    echo "env = \"$env\""
    echo "# port = $((port + 1000))"
    echo "port = $port"
    echo "admin_port = $((port + 100))"
    echo "[limits]"
    echo "max_conn = $((n * 10))"
  } > "$fixture/services/svc-$i/config.toml"
  if [ "$env" = "prod" ]; then
    total=$((total + port))
  fi
done
echo "$total" > "$expected_file"
