#!/usr/bin/env bash
# PreToolUse hook: block edits to generated files.
# Matches Edit, Write, MultiEdit, and mcp__RepoPromptCE__apply_edits.
# Exit 2 = block with stderr shown to model. Exit 0 = allow.
# Fail-closed: any unexpected error converts to exit 2 (block) rather than the
# default exit 1 from `set -e`, which Claude Code treats as non-blocking.

set -uo pipefail
trap 'echo "Hook error in $(basename "$0") at line $LINENO. Failing closed." >&2; exit 2' ERR

if ! command -v jq >/dev/null 2>&1; then
  echo "jq not installed but required by $(basename "$0"). Install jq or remove this hook." >&2
  exit 2
fi

input=$(cat) || { echo "Hook $(basename "$0"): failed to read stdin. Failing closed." >&2; exit 2; }

# Edit/Write use file_path. RepoPromptCE apply_edits uses path.
file_path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // .tool_input.path // empty' 2>/dev/null) || {
  echo "Hook $(basename "$0"): malformed JSON input. Failing closed." >&2
  exit 2
}
[ -z "$file_path" ] && exit 0

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

exit 0
