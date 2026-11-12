#!/bin/bash
set -e
f="$1"
mkdir -p "$f/src" "$f/test"
echo '{ "name": "ttl-cache", "private": true, "type": "commonjs" }' > "$f/package.json"
cat > "$f/README.md" <<'EOF'
# TtlCache

`new TtlCache({ capacity, ttlMs, now = Date.now })`

- `set(key, value)` stores the value and makes `key` the most recently used entry; setting an existing key replaces its value and restarts its TTL.
- `get(key)` returns the value, or `undefined` when the key is missing or expired, and makes a live key the most recently used entry.
- An entry expires once `now() - storedAt >= ttlMs`; expired entries are never returned and never count toward `size` or capacity.
- `has(key)` reports whether a live entry exists and does not change recency.
- When a `set` would exceed `capacity` live entries, the least recently used live entry is evicted first.
- `size` is the number of live entries.
- `delete(key)` removes the entry and returns whether a live entry was removed.
EOF
cat > "$f/src/ttlCache.js" <<'EOF'
class TtlCache {
  constructor({ capacity, ttlMs, now = Date.now }) {
    this.capacity = capacity;
    this.ttlMs = ttlMs;
    this.now = now;
    this.map = new Map();
  }

  set(key, value) {
    if (this.map.size >= this.capacity) {
      const oldest = this.map.keys().next().value;
      this.map.delete(oldest);
    }
    this.map.set(key, { value, storedAt: this.now() });
  }

  get(key) {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    if (this.now() - entry.storedAt > this.ttlMs) return undefined;
    return entry.value;
  }

  has(key) {
    return this.get(key) !== undefined;
  }

  delete(key) {
    return this.map.delete(key);
  }

  get size() {
    return this.map.size;
  }
}

module.exports = { TtlCache };
EOF
cat > "$f/test/ttlCache.test.js" <<'EOF'
const test = require("node:test");
const assert = require("node:assert");
const { TtlCache } = require("../src/ttlCache");

test("stores and reads values", () => {
  const c = new TtlCache({ capacity: 2, ttlMs: 1000, now: () => 0 });
  c.set("a", 1);
  assert.strictEqual(c.get("a"), 1);
});

test("get refreshes recency", () => {
  const c = new TtlCache({ capacity: 2, ttlMs: 1000, now: () => 0 });
  c.set("a", 1);
  c.set("b", 2);
  c.get("a");
  c.set("c", 3);
  assert.strictEqual(c.get("a"), 1);
  assert.strictEqual(c.get("b"), undefined);
});
EOF
echo done > "$2"
