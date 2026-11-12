const test = require("node:test");
const assert = require("node:assert");
const { mapLimit } = require("../src/mapLimit");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

test("never exceeds limit and refills immediately", async () => {
  let active = 0, peak = 0;
  const started = [];
  const t0 = Date.now();
  await mapLimit([80, 10, 10, 10, 10], 2, async (ms, i) => {
    started.push([i, Date.now() - t0]);
    active++; peak = Math.max(peak, active);
    await sleep(ms);
    active--;
    return i;
  });
  assert.strictEqual(peak, 2);
  const last = started.find(([i]) => i === 4)[1];
  assert.ok(last < 60, `item 4 should start before the slow item finishes, started at ${last}ms`);
});

test("passes index and keeps order", async () => {
  const out = await mapLimit(["a", "b", "c"], 2, async (x, i) => { await sleep(10 * (3 - i)); return `${x}${i}`; });
  assert.deepStrictEqual(out, ["a0", "b1", "c2"]);
});

test("accepts iterables and plain values", async () => {
  const out = await mapLimit(new Set([1, 2, 3]), 2, (x) => x * 2);
  assert.deepStrictEqual(out, [2, 4, 6]);
});

test("empty input", async () => {
  assert.deepStrictEqual(await mapLimit([], 3, () => 1), []);
});

test("invalid limits reject with RangeError before calling fn", async () => {
  for (const limit of [0, -1, 1.5, NaN, "2", undefined]) {
    let called = false;
    await assert.rejects(mapLimit([1], limit, () => { called = true; }), RangeError);
    assert.strictEqual(called, false);
  }
  assert.deepStrictEqual(await mapLimit([1, 2], Infinity, (x) => x), [1, 2]);
});

test("stops starting calls after a failure and does not wait for in-flight calls", async () => {
  const startedIdx = [];
  const t0 = Date.now();
  await assert.rejects(mapLimit([0, 1, 2, 3, 4, 5], 2, async (x, i) => {
    startedIdx.push(i);
    if (i === 1) { await sleep(5); throw new Error("fail-1"); }
    await sleep(200);
    return x;
  }), /fail-1/);
  assert.ok(Date.now() - t0 < 150, "should reject without waiting for the slow in-flight call");
  await sleep(250);
  assert.deepStrictEqual(startedIdx.sort(), [0, 1]);
});

test("synchronous throw rejects", async () => {
  await assert.rejects(mapLimit([1, 2], 1, () => { throw new TypeError("sync"); }), TypeError);
});
