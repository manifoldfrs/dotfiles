#!/bin/bash
set -e
node "$(dirname "$0")/../../mcp/expected.mjs" orders > "$2"
