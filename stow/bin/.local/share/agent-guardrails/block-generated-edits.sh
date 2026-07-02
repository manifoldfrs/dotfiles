#!/usr/bin/env bash
# Shared agent hook: block edits to generated files.
# Exit 2 = block with stderr shown to the agent. Exit 0 = allow.
# Accepts Claude-style and Codex-style hook JSON payloads.

set -uo pipefail
trap 'echo "Hook error in $(basename "$0") at line $LINENO. Failing closed." >&2; exit 2' ERR

if ! command -v jq >/dev/null 2>&1; then
  echo "jq not installed but required by $(basename "$0"). Install jq or remove this hook." >&2
  exit 2
fi

input=$(cat) || { echo "Hook $(basename "$0"): failed to read stdin. Failing closed." >&2; exit 2; }

paths=$(printf '%s' "$input" | jq -r '
  def parsed_arguments:
    if (.arguments? | type) == "string" then
      try (.arguments | fromjson) catch {}
    elif (.arguments? | type) == "object" then
      .arguments
    else
      {}
    end;

  def patch_text:
    [
      .tool_input.patch?,
      .input.patch?,
      .params.patch?,
      .patch?,
      parsed_arguments.patch?
    ]
    | map(select(type == "string" and length > 0))
    | .[0] // "";

  (
    [
      .tool_input.file_path?,
      .tool_input.path?,
      .input.file_path?,
      .input.path?,
      .params.file_path?,
      .params.path?,
      .file_path?,
      .path?,
      .toolCall.arguments.file_path?,
      .toolCall.arguments.path?,
      .tool_call.arguments.file_path?,
      .tool_call.arguments.path?,
      parsed_arguments.file_path?,
      parsed_arguments.path?
    ]
    | map(select(type == "string" and length > 0))
  ) + (
    patch_text
    | split("\n")
    | map((try capture("^\\*\\*\\* (Add|Update|Delete) File: (?<path>.+)$").path catch empty) // empty)
    | map(select(type == "string" and length > 0))
  )
  | unique
  | .[]
' 2>/dev/null) || {
  echo "Hook $(basename "$0"): malformed JSON input. Failing closed." >&2
  exit 2
}
[ -z "$paths" ] && exit 0

check_path() {
  local file_path=$1

  case "$file_path" in
    # Protobuf and gRPC generated, all common languages
    *.pb.go|*_grpc.pb.go|*.pb.cc|*.pb.h|*.pb.py|*_pb2.py|*_pb2_grpc.py|*.pb.ts|*.pb.js|*.pb.swift|*.pb.rb|*.pb.rs|*_pb.rs|*.pb.java|*Grpc.java|*.pb.kt|*GrpcKt.kt)
      echo "Refusing edit to generated protobuf or gRPC file: $file_path" >&2
      echo "Regenerate from the .proto source instead." >&2
      exit 2
      ;;
    # Generic codegen markers, language-agnostic. Skip known hand-written
    # config files that happen to match the *.gen.* glob (notably buf's
    # buf.gen.yaml template, which is the source-of-truth for codegen, not
    # an output of it).
    *.gen.*|*.generated.*)
      case "$file_path" in
        */buf.gen.yaml|buf.gen.yaml) ;;
        *)
          echo "Refusing edit to generated file: $file_path" >&2
          echo "Regenerate from the source spec or template." >&2
          exit 2
          ;;
      esac
      ;;
    # Generated mock files. testutils/*/mocks/* are hand-written test helpers, not mockgen output.
    */mock_*.go|*/mocks/*|*/__mocks__/*)
      case "$file_path" in
        testutils/*) ;;
        *)
          echo "Refusing edit to generated mock file: $file_path" >&2
          echo "Regenerate via the project's mock-generation command (e.g. 'make gen', 'make gen.mocks')." >&2
          exit 2
          ;;
      esac
      ;;
    # Generated directories
    */generated/*|*/gen/*|*/__generated__/*)
      echo "Refusing edit inside generated directory: $file_path" >&2
      echo "Edit the source spec or template, then regenerate." >&2
      exit 2
      ;;
  esac
}

while IFS= read -r file_path; do
  [ -z "$file_path" ] && continue
  check_path "$file_path"
done <<< "$paths"

exit 0
