#!/bin/bash
set -e
fixture="$1"
expected_file="$2"
mkdir -p "$fixture/people"
for i in $(seq 1 80); do
  id=$(printf "e%03d" "$i")
  if [ "$i" -le 6 ]; then
    mgr="null"
  else
    mgr="\"$(printf "e%03d" $(( (i * 7) % 6 + 1 )))\""
  fi
  active=true
  [ $((i % 5)) -eq 0 ] && active=false
  [ "$i" -eq 3 ] && active=false
  printf '{\n  "id": "%s",\n  "name": "Person %s",\n  "manager_id": %s,\n  "active": %s\n}\n' "$id" "$i" "$mgr" "$active" > "$fixture/people/$id.json"
done
jq -s -r '
  (map(select(.active)) | map({key: .id, value: true}) | from_entries) as $act
  | map(select(.active and .manager_id != null and $act[.manager_id]))
  | group_by(.manager_id) | map({m: .[0].manager_id, n: length}) | sort_by(-.n)
  | if .[0].n == .[1].n then error("tie") else .[0].m end
' "$fixture"/people/*.json > "$expected_file"
