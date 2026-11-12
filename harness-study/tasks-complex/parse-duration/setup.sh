#!/bin/bash
set -e
f="$1"
mkdir -p "$f/src" "$f/test"
echo '{ "name": "duration", "private": true, "type": "commonjs" }' > "$f/package.json"
cat > "$f/README.md" <<'EOF'
# parseDuration(input) -> milliseconds

- `input` must be a string; anything else throws `TypeError`.
- Leading and trailing whitespace is ignored. An empty or all-whitespace string throws `SyntaxError`.
- A duration is one or more components `<number><unit>`, optionally separated by single spaces, e.g. `1h30m`, `1h 30m`.
- Units are `d`, `h`, `m`, `s`, `ms` (days, hours, minutes, seconds, milliseconds), lowercase only.
- Components must appear in strictly decreasing unit order (`d`, `h`, `m`, `s`, `ms`); a repeated or out-of-order unit throws `SyntaxError`.
- Numbers are non-negative decimals such as `2`, `1.5`, or `.5`; at most one decimal point; no exponent and no sign inside a component.
- The whole duration may have one leading `-` (making the result negative) or `+`; no space between the sign and the first component.
- The result is rounded to the nearest integer millisecond with `Math.round`.
- Anything else, including a bare number without a unit, throws `SyntaxError`.
EOF
cat > "$f/src/duration.js" <<'EOF'
const UNITS = { d: 86400000, h: 3600000, m: 60000, s: 1000, ms: 1 };

function parseDuration(input) {
  let total = 0;
  for (const [, num, unit] of input.matchAll(/(\d+)(d|h|m|s|ms)/g)) {
    total += Number(num) * UNITS[unit];
  }
  return total;
}

module.exports = { parseDuration };
EOF
cat > "$f/test/duration.test.js" <<'EOF'
const test = require("node:test");
const assert = require("node:assert");
const { parseDuration } = require("../src/duration");

test("single component", () => assert.strictEqual(parseDuration("90s"), 90000));
test("combined", () => assert.strictEqual(parseDuration("1h30m"), 5400000));
test("milliseconds unit", () => assert.strictEqual(parseDuration("250ms"), 250));
test("rejects unknown unit", () => assert.throws(() => parseDuration("5y"), SyntaxError));
EOF
echo done > "$2"
