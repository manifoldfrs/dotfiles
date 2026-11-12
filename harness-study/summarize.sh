#!/bin/bash
# Summarize a results directory written by run.sh into summary.md and summary.json.
# Usage: harness-study/summarize.sh RESULTS_DIR
set -e

out="$1"
if [ -z "$out" ] || [ ! -d "$out/runs" ]; then
  echo "usage: summarize.sh RESULTS_DIR" >&2
  exit 1
fi

jq -s '
  def median: sort | if length == 0 then null elif length % 2 == 1 then .[length / 2 | floor] else (.[length / 2 - 1] + .[length / 2]) / 2 end;
  def r1: if . == null then null else . * 10 | round / 10 end;
  def stats: {
    runs: length,
    accuracy: ((map(select(.correct)) | length) / length * 100 | round),
    median_wall_s: (map(.wall_s) | median | r1),
    mean_wall_s: (map(.wall_s) | add / length | r1),
    median_turns: (map(.model_turns // 0) | median),
    mean_tool_calls: (map(.tool_calls // 0) | add / length | r1),
    median_input_ktok: (map((.input_tokens // 0) / 1000) | median | r1),
    median_output_tok: (map(.output_tokens // 0) | median | round),
    mean_cost_usd: (map(.cost_usd // 0) | add / length * 100 | round / 100),
    codemode_calls: (map(.tools.codemode // 0) | add),
    codemode_inner_calls: (map(.codemode_inner_calls // 0) | add),
    guardrail_followups: (map(.followups // 0) | add),
    harness_errors: (map(select(.harness_error)) | length)
  };
  {
    by_arm: (group_by(.arm) | map({arm: .[0].arm} + stats)),
    by_task: (group_by(.task) | map({task: .[0].task, arms: (group_by(.arm) | map({arm: .[0].arm} + stats))}))
  }
' "$out"/runs/*.json > "$out/summary.json"

{
  echo "# Harness study results"
  echo
  echo "## By arm"
  echo
  echo "| arm | runs | accuracy % | median wall s | mean wall s | median turns | mean tool calls | median input ktok | median output tok | mean cost USD | codemode calls | tool calls inside codemode | guardrail follow-ups | harness errors |"
  echo "|---|---|---|---|---|---|---|---|---|---|---|---|---|---|"
  jq -r '.by_arm[] | "| \(.arm) | \(.runs) | \(.accuracy) | \(.median_wall_s) | \(.mean_wall_s) | \(.median_turns) | \(.mean_tool_calls) | \(.median_input_ktok) | \(.median_output_tok) | \(.mean_cost_usd) | \(.codemode_calls) | \(.codemode_inner_calls) | \(.guardrail_followups) | \(.harness_errors) |"' "$out/summary.json"
  echo
  echo "## By task"
  echo
  echo "| task | arm | accuracy % | median wall s | median turns | mean tool calls | median input ktok | mean cost USD | codemode calls | guardrail follow-ups |"
  echo "|---|---|---|---|---|---|---|---|---|---|"
  jq -r '.by_task[] | .task as $t | .arms[] | "| \($t) | \(.arm) | \(.accuracy) | \(.median_wall_s) | \(.median_turns) | \(.mean_tool_calls) | \(.median_input_ktok) | \(.mean_cost_usd) | \(.codemode_calls) | \(.guardrail_followups) |"' "$out/summary.json"
} > "$out/summary.md"

cat "$out/summary.md"
