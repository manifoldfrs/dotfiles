#!/bin/bash
# Run the harness study: every task x arm x rep in a throwaway fixture.
# Usage: harness-study/run.sh [--suite tasks|tasks-complex] [--reps N] [--rep-start N] [--jobs N] [--arms a,b] [--tasks a,b] [--out DIR]
#        harness-study/run.sh --rescore RESULTS_DIR
set -e

STUDY_DIR="$(cd "$(dirname "$0")" && pwd)"
MODEL="claude-opus-5-5"
EFFORT="medium"
RUN_TIMEOUT=900
CLAUDE_SETTINGS="$STUDY_DIR/../stow/claude/.claude/settings.json"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

now() {
  perl -MTime::HiRes=time -e 'printf "%.3f", time'
}

# Child harnesses must not inherit this pi session's identity.
clean_env() {
  local unset_args=()
  local var
  for var in $(env | awk -F= '/^(PI_|CLAUDECODE|CLAUDE_CODE_ENTRYPOINT)/ {print $1}'); do
    unset_args+=(-u "$var")
  done
  env "${unset_args[@]}" "$@"
}

# Claude Code settings that pin the mod list, with or without the codemode mod, whatever the live default is.
cc_mod_settings() {
  local with_codemode="$1"
  local dirs
  dirs="$(jq -r '.env.CLAUDE_CODE_PLUGIN_DIRS' "$CLAUDE_SETTINGS" | tr ':' '\n' | grep -v '/mods/codemode$' | paste -sd: -)"
  if [ "$with_codemode" = "yes" ]; then
    dirs="$dirs:$(cd "$STUDY_DIR/../stow/claude/.claude/mods/codemode" && pwd)"
  fi
  jq -nc --arg dirs "$dirs" '{env: {CLAUDE_CODE_PLUGIN_DIRS: $dirs}}'
}

# Writes the MCP server config a task needs; the server stays outside the fixture.
write_mcp_config() {
  local server="$1"
  local exposure="$2"
  local dest="$3"
  jq -n --arg name "$server" --arg script "$STUDY_DIR/mcp/fixture-server.mjs" --arg exposure "$exposure" \
    '{mcpServers: {($name): ({command: "node", args: [$script, $name]} + (if $exposure == "" then {} else {exposure: $exposure} end))}}' > "$dest"
}

run_arm() {
  local arm="$1"
  local prompt="$2"
  local raw="$3"
  local mcp_server="$4"
  local work="$5"
  local cc_mcp=()
  if [ -n "$mcp_server" ]; then
    write_mcp_config "$mcp_server" "" "$work/cc-mcp.json"
    cc_mcp=(--mcp-config "$work/cc-mcp.json")
    mkdir -p .pi
    if [ "$arm" = "pi-codemode-only" ]; then
      write_mcp_config "$mcp_server" "codemode" .pi/mcp.json
    else
      write_mcp_config "$mcp_server" "direct" .pi/mcp.json
    fi
  fi
  case "$arm" in
    cc)
      clean_env timeout "$RUN_TIMEOUT" claude -p --output-format stream-json --verbose \
        --model "$MODEL" --effort "$EFFORT" --dangerously-skip-permissions --settings "$(cc_mod_settings no)" \
        --no-session-persistence ${cc_mcp[@]+"${cc_mcp[@]}"} -- "$prompt" < /dev/null > "$raw" 2> "$raw.err"
      ;;
    cc-codemode)
      clean_env timeout "$RUN_TIMEOUT" claude -p --output-format stream-json --verbose \
        --model "$MODEL" --effort "$EFFORT" --dangerously-skip-permissions \
        --settings "$(cc_mod_settings yes)" \
        --no-session-persistence ${cc_mcp[@]+"${cc_mcp[@]}"} -- "$prompt" < /dev/null > "$raw" 2> "$raw.err"
      ;;
    pi)
      clean_env timeout "$RUN_TIMEOUT" pi -p --approve --mode json --no-session \
        --model "pi-claude-cli/$MODEL" --thinking "$EFFORT" --exclude-tools codemode \
        "$prompt" < /dev/null > "$raw" 2> "$raw.err"
      ;;
    pi-codemode)
      clean_env timeout "$RUN_TIMEOUT" pi -p --approve --mode json --no-session \
        --model "pi-claude-cli/$MODEL" --thinking "$EFFORT" \
        "$prompt" < /dev/null > "$raw" 2> "$raw.err"
      ;;
    pi-codemode-only)
      mkdir -p .pi
      echo '{ "codemode": { "mode": "only" } }' > .pi/settings.json
      clean_env timeout "$RUN_TIMEOUT" pi -p --approve --mode json --no-session \
        --model "pi-claude-cli/$MODEL" --thinking "$EFFORT" \
        "$prompt" < /dev/null > "$raw" 2> "$raw.err"
      ;;
    *)
      error "unknown arm: $arm"
      return 2
      ;;
  esac
}

extract_metrics() {
  local arm="$1"
  local raw="$2"
  case "$arm" in
    cc | cc-codemode)
      jq -s '
        (map(select(.type == "result")) | last) as $r
        | [ .[] | select(.type == "assistant") | .message.content[]? | select(.type == "tool_use") | .name ] as $tools
        | {
            final_text: ([ .[] | select(.type == "assistant") | .message.content[]? | select(.type == "text") | .text ] + [ $r.result // "" ] | join("\n")),
            followups: 0,
            harness_error: (($r == null) or ($r.is_error // false)),
            model_turns: ($r.num_turns // null),
            tool_calls: ($tools | length),
            tools: ($tools | map(if . == "mcp__codemode__codemode" then "codemode" else . end) | group_by(.) | map({key: .[0], value: length}) | from_entries),
            codemode_inner_calls: ([ .[] | select(.type == "assistant") | .message.content[]? | select(.type == "tool_use" and .name == "mcp__codemode__codemode") | .input.code // "" | [scan("tools\\.[A-Za-z_]+\\(")] | length ] | add // 0),
            input_tokens: (($r.usage.input_tokens // 0) + ($r.usage.cache_read_input_tokens // 0) + ($r.usage.cache_creation_input_tokens // 0)),
            output_tokens: ($r.usage.output_tokens // null),
            cost_usd: ($r.total_cost_usd // null),
            api_ms: ($r.duration_api_ms // null)
          }' "$raw"
      ;;
    pi | pi-codemode | pi-codemode-only)
      jq -s '
        (map(select(.type == "agent_end")) | map(.messages // []) | add // []) as $m
        | ($m | map(select(.role == "assistant"))) as $a
        | [ $a[] | .content[]? | select(.type == "toolCall") | .name ] as $tools
        | {
            final_text: ([ $a[] | .content[]? | select(.type == "text") | .text ] | join("\n")),
            followups: ((map(select(.type == "agent_start")) | length) - 1),
            harness_error: (($a | length) == 0 or (($a | last).stopReason == "error")),
            model_turns: ($a | length),
            tool_calls: ($tools | length),
            tools: ($tools | group_by(.) | map({key: .[0], value: length}) | from_entries),
            codemode_inner_calls: ([ $a[] | .content[]? | select(.type == "toolCall" and .name == "codemode") | .arguments.code // "" | [scan("tools\\.[A-Za-z_]+\\(")] | length ] | add // 0),
            input_tokens: ([ $a[] | .usage | (.input // 0) + (.cacheRead // 0) + (.cacheWrite // 0) ] | add),
            output_tokens: ([ $a[] | .usage.output // 0 ] | add),
            cost_usd: ([ $a[] | .usage.cost.total // 0 ] | add),
            api_ms: ([ $a[] | .durationMs // 0 ] | add)
          }' "$raw"
      ;;
  esac
}

run_one() {
  local suite="$1"
  local task="$2"
  local arm="$3"
  local rep="$4"
  local out="$5"
  local task_dir="$STUDY_DIR/$suite/$task"
  local id="$task.$arm.$rep"
  local work
  work="$(mktemp -d "${TMPDIR:-/tmp}/harness-study.$id.XXXXXX")"
  local fixture="$work/fixture"
  local expected_file="$out/keys/$id"
  local raw="$out/raw/$id.jsonl"
  mkdir -p "$fixture" "$out/keys"

  bash "$task_dir/setup.sh" "$fixture" "$expected_file"
  (
    cd "$fixture"
    git init -q
    git add -A
    git -c user.email=study@example.invalid -c user.name=study commit -qm fixture --allow-empty
  )

  local prompt
  prompt="$(cat "$task_dir/prompt.md")"
  local start end exit_code=0
  start="$(now)"
  local mcp_server=""
  if [ -f "$task_dir/mcp" ]; then
    mcp_server="$(cat "$task_dir/mcp")"
  fi
  (cd "$fixture" && run_arm "$arm" "$prompt" "$raw" "$mcp_server" "$work") || exit_code=$?
  end="$(now)"
  score_one "$suite" "$task" "$arm" "$rep" "$out" "$fixture" "$(perl -e "printf '%.3f', $end - $start")" "$exit_code"
}

# Grade a finished run from its raw transcript and fixture; safe to rerun.
score_one() {
  local suite="$1"
  local task="$2"
  local arm="$3"
  local rep="$4"
  local out="$5"
  local fixture="$6"
  local wall_s="$7"
  local exit_code="$8"
  local task_dir="$STUDY_DIR/$suite/$task"
  local id="$task.$arm.$rep"
  local raw="$out/raw/$id.jsonl"
  # run1 predates keys/ and kept each key beside its fixture.
  local expected_file="$out/keys/$id"
  if [ ! -f "$expected_file" ]; then
    expected_file="$(dirname "$fixture")/expected"
  fi

  local metrics
  metrics="$(extract_metrics "$arm" "$raw" 2> /dev/null || echo '{"harness_error": true, "final_text": ""}')"
  local answer
  answer="$(jq -r '.final_text' <<< "$metrics" | awk '/^[*`_ ]*ANSWER:/ {line = $0} END {print line}' \
    | sed -E 's/^[*`_ ]*ANSWER:[*`_ ]*//; s/[*`_ ]*$//')"

  local correct=false
  if bash "$task_dir/check.sh" "$fixture" "$expected_file" "$answer" > /dev/null 2>&1; then
    correct=true
  fi

  jq -n \
    --arg suite "$suite" --arg task "$task" --arg arm "$arm" --argjson rep "$rep" \
    --argjson wall_s "$wall_s" --argjson exit_code "$exit_code" \
    --arg answer "$answer" --arg expected "$(cat "$expected_file" 2> /dev/null)" \
    --argjson correct "$correct" --arg fixture "$fixture" --argjson m "$metrics" \
    '{suite: $suite, task: $task, arm: $arm, rep: $rep, wall_s: ($wall_s * 1000 | round / 1000),
      exit_code: $exit_code, correct: $correct, answer: $answer, expected: $expected, fixture: $fixture}
      + ($m | del(.final_text))' > "$out/runs/$id.json"

  local mark="${RED}FAIL${NC}"
  [ "$correct" = true ] && mark="${GREEN}ok${NC}"
  echo -e "$(printf '%-14s %-12s rep%-2s %7.1fs' "$task" "$arm" "$rep" "$wall_s") $mark  answer=$answer"
}

rescore() {
  local out
  out="$(cd "$1" && pwd)"
  local run
  for run in "$out"/runs/*.json; do
    score_one $(jq -r '[(.suite // "tasks"), .task, .arm, .rep, "'"$out"'", .fixture, .wall_s, .exit_code] | @tsv' "$run") > /dev/null
  done
  bash "$STUDY_DIR/summarize.sh" "$out"
}

main() {
  local reps=3
  local rep_start=1
  local jobs=3
  local arms="cc,pi,pi-codemode"
  local tasks=""
  local out=""
  local suite="tasks"
  while [ $# -gt 0 ]; do
    case "$1" in
      --one)
        run_one "$2" "$3" "$4" "$5" "$6"
        return
        ;;
      --rescore)
        rescore "$2"
        return
        ;;
      --reps) reps="$2"; shift 2 ;;
      --rep-start) rep_start="$2"; shift 2 ;;
      --jobs) jobs="$2"; shift 2 ;;
      --arms) arms="$2"; shift 2 ;;
      --tasks) tasks="$2"; shift 2 ;;
      --suite) suite="$2"; shift 2 ;;
      --out) out="$2"; shift 2 ;;
      *) error "unknown argument: $1"; exit 1 ;;
    esac
  done

  for tool in claude pi jq git node rg timeout perl; do
    if ! command -v "$tool" > /dev/null; then
      error "missing required tool: $tool"
      exit 1
    fi
  done

  if [ -z "$tasks" ]; then
    tasks="$(cd "$STUDY_DIR/$suite" && ls -d */ | tr -d / | paste -sd, -)"
  fi
  if [ -z "$out" ]; then
    out="$STUDY_DIR/results/$(date +%Y%m%d-%H%M%S)"
  fi
  mkdir -p "$out/raw" "$out/runs"
  out="$(cd "$out" && pwd)"

  local jobfile="$out/jobs.txt"
  : > "$jobfile"
  local task arm rep
  for rep in $(seq "$rep_start" $((rep_start + reps - 1))); do
    for task in ${tasks//,/ }; do
      for arm in ${arms//,/ }; do
        echo "$suite $task $arm $rep" >> "$jobfile"
      done
    done
  done
  # Interleave arms so rate limits and time-of-day drift hit every arm alike.
  sort -R -o "$jobfile" "$jobfile"

  info "Running $(wc -l < "$jobfile" | tr -d ' ') runs with $jobs parallel jobs into $out"
  xargs -P "$jobs" -L 1 bash "$STUDY_DIR/run.sh" --one < <(sed "s|\$| $out|" "$jobfile") || warn "some runs exited non-zero"
  bash "$STUDY_DIR/summarize.sh" "$out"
}

main "$@"
