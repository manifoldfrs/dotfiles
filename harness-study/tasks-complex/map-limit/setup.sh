#!/bin/bash
set -e
f="$1"
mkdir -p "$f/src" "$f/test"
echo '{ "name": "map-limit", "private": true, "type": "commonjs" }' > "$f/package.json"
cat > "$f/README.md" <<'EOF'
# mapLimit(items, limit, fn) -> Promise<results>

- Calls `fn(item, index)` for each item of the iterable `items` and resolves to the results in input order.
- At most `limit` calls are in flight at any time, and a new call starts as soon as one settles.
- `limit` must be a positive integer or `Infinity`; anything else rejects with `RangeError` before any call starts.
- If `fn` throws synchronously or its promise rejects, `mapLimit` rejects with that error, starts no further calls, and does not wait for calls already in flight.
- `fn` may return a plain value instead of a promise.
- An empty `items` resolves to `[]`.
EOF
cat > "$f/src/mapLimit.js" <<'EOF'
async function mapLimit(items, limit, fn) {
  const list = Array.from(items);
  const results = [];
  for (let i = 0; i < list.length; i += limit) {
    const batch = list.slice(i, i + limit);
    const settled = await Promise.allSettled(batch.map((item, j) => fn(item, i + j)));
    for (const s of settled) {
      if (s.status === "fulfilled") results.push(s.value);
    }
  }
  return results;
}

module.exports = { mapLimit };
EOF
cat > "$f/test/mapLimit.test.js" <<'EOF'
const test = require("node:test");
const assert = require("node:assert");
const { mapLimit } = require("../src/mapLimit");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

test("keeps input order", async () => {
  const out = await mapLimit([30, 10, 20], 3, async (ms) => { await sleep(ms); return ms; });
  assert.deepStrictEqual(out, [30, 10, 20]);
});

test("rejects on failure", async () => {
  await assert.rejects(mapLimit([1, 2], 2, async (x) => { if (x === 2) throw new Error("boom"); return x; }), /boom/);
});
EOF
echo done > "$2"
