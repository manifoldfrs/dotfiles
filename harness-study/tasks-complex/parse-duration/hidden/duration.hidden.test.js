const test = require("node:test");
const assert = require("node:assert");
const { parseDuration: p } = require("../src/duration");
const bad = (s, E = SyntaxError) => assert.throws(() => p(s), E, `expected ${JSON.stringify(s)} to throw ${E.name}`);

test("valid forms", () => {
  assert.strictEqual(p("2d"), 172800000);
  assert.strictEqual(p("1h 30m"), 5400000);
  assert.strictEqual(p("  1m  "), 60000);
  assert.strictEqual(p("1.5h"), 5400000);
  assert.strictEqual(p(".5s"), 500);
  assert.strictEqual(p("1m1ms"), 60001);
  assert.strictEqual(p("1s 500ms"), 1500);
  assert.strictEqual(p("-30s"), -30000);
  assert.strictEqual(p("+1d2h"), 93600000);
  assert.strictEqual(p("0.0004s"), 0);
  assert.strictEqual(p("0.0006s"), 1);
  assert.strictEqual(p("1d2h3m4s5ms"), 93784005);
});

test("type errors", () => {
  bad(5, TypeError);
  bad(null, TypeError);
  bad(undefined, TypeError);
});

test("syntax errors", () => {
  for (const s of ["", "   ", "10", "1H", "1h2h", "30m1h", "1ms1s", "1h  30m", "- 5s", "1.2.3s", "1e3ms", "5 m", "1h-30m", "--1s", "1h,30m", "s", "1.s5"]) bad(s);
});
