#!/bin/bash
set -e
node "$(dirname "$0")/../../mcp/expected.mjs" tickets > "$2"
