#!/bin/bash
set -e
fixture="$1"
expected_file="$2"
awk 'BEGIN {
  srand(42)
  split("INFO INFO INFO WARN ERROR", levels, " ")
  split("billing billing-v2 auth search billing", services, " ")
  split("request ok|upstream Timeout after 30s|db TIMEOUT|cache miss|payment declined|connection timeout|retrying", msgs, "|")
  for (i = 0; i < 60000; i++) {
    lvl = levels[int(rand() * 5) + 1]
    svc = services[int(rand() * 5) + 1]
    usr = sprintf("u%04d", int(rand() * 3000))
    msg = msgs[int(rand() * 7) + 1]
    printf "2026-11-01T%02d:%02d:%02dZ %s service=%s user=%s msg=\"%s\"\n", int(i / 3600) % 24, int(i / 60) % 60, i % 60, lvl, svc, usr, msg
  }
}' > "$fixture/app.log"
awk '$2 == "ERROR" && $3 == "service=billing" && tolower($0) ~ /msg=".*timeout/ { seen[$4] = 1 } END { n = 0; for (u in seen) n++; print n }' "$fixture/app.log" > "$expected_file"
