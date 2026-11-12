const test = require("node:test");
const assert = require("node:assert");
const { TtlCache } = require("../src/ttlCache");
const clock = () => { let t = 0; const now = () => t; now.advance = (ms) => { t += ms; }; return now; };

test("expiry boundary is inclusive", () => {
  const now = clock();
  const c = new TtlCache({ capacity: 3, ttlMs: 100, now });
  c.set("a", 1);
  now.advance(99);
  assert.strictEqual(c.get("a"), 1);
  now.advance(1);
  assert.strictEqual(c.get("a"), undefined);
});

test("expired entries do not count toward size", () => {
  const now = clock();
  const c = new TtlCache({ capacity: 3, ttlMs: 100, now });
  c.set("a", 1);
  c.set("b", 2);
  now.advance(100);
  c.set("c", 3);
  assert.strictEqual(c.size, 1);
});

test("expired entries free capacity instead of evicting live ones", () => {
  const now = clock();
  const c = new TtlCache({ capacity: 2, ttlMs: 100, now });
  c.set("old", 1);
  now.advance(60);
  c.set("live", 2);
  now.advance(50);
  c.set("new", 3);
  assert.strictEqual(c.get("live"), 2);
  assert.strictEqual(c.get("new"), 3);
});

test("re-setting a key refreshes recency and ttl without growing", () => {
  const now = clock();
  const c = new TtlCache({ capacity: 2, ttlMs: 100, now });
  c.set("a", 1);
  c.set("b", 2);
  now.advance(80);
  c.set("a", 10);
  c.set("c", 3);
  assert.strictEqual(c.get("b"), undefined);
  now.advance(80);
  assert.strictEqual(c.get("a"), 10);
  assert.strictEqual(c.size, 2);
});

test("has does not change recency and ignores expired", () => {
  const now = clock();
  const c = new TtlCache({ capacity: 2, ttlMs: 100, now });
  c.set("a", 1);
  c.set("b", 2);
  assert.strictEqual(c.has("a"), true);
  c.set("c", 3);
  assert.strictEqual(c.has("a"), false);
  now.advance(100);
  assert.strictEqual(c.has("b"), false);
});

test("falsy values are stored and found", () => {
  const c = new TtlCache({ capacity: 2, ttlMs: 100, now: () => 0 });
  c.set("zero", 0);
  c.set("undef", undefined);
  assert.strictEqual(c.has("zero"), true);
  assert.strictEqual(c.get("zero"), 0);
  assert.strictEqual(c.has("undef"), true);
});

test("delete reports live removal only", () => {
  const now = clock();
  const c = new TtlCache({ capacity: 2, ttlMs: 100, now });
  c.set("a", 1);
  c.set("b", 2);
  now.advance(100);
  assert.strictEqual(c.delete("a"), false);
  c.set("c", 3);
  assert.strictEqual(c.delete("c"), true);
  assert.strictEqual(c.size, 0);
});
