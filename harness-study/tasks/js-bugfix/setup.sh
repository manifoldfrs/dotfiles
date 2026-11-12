#!/bin/bash
set -e
fixture="$1"
mkdir -p "$fixture/src" "$fixture/test"
echo '{ "name": "cart", "private": true, "type": "commonjs" }' > "$fixture/package.json"
cat > "$fixture/src/discount.js" <<'EOF'
function applyDiscount(cents, percent) {
  if (percent <= 0) return cents;
  return Math.round(cents - cents * percent);
}
module.exports = { applyDiscount };
EOF
cat > "$fixture/src/tax.js" <<'EOF'
const RATES = { CA: 0.0725, NY: 0.04, OR: 0 };
function taxFor(cents, state) {
  const rate = RATES[state];
  if (rate === undefined) throw new Error(`unknown state ${state}`);
  return Math.floor(cents * rate);
}
module.exports = { taxFor, RATES };
EOF
cat > "$fixture/src/cart.js" <<'EOF'
const { applyDiscount } = require("./discount");
const { taxFor } = require("./tax");
function subtotal(items) {
  return items.reduce((sum, item) => sum + item.cents * item.qty, 0);
}
function total(items, { state, discountPercent = 0 }) {
  const discounted = applyDiscount(subtotal(items), discountPercent);
  return discounted + taxFor(discounted, state);
}
module.exports = { subtotal, total };
EOF
cat > "$fixture/test/cart.test.js" <<'EOF'
const test = require("node:test");
const assert = require("node:assert");
const { subtotal, total } = require("../src/cart");
const { applyDiscount } = require("../src/discount");
const { taxFor } = require("../src/tax");
const items = [{ cents: 1999, qty: 2 }, { cents: 500, qty: 1 }];
test("subtotal", () => assert.strictEqual(subtotal(items), 4498));
test("discount is a percentage", () => assert.strictEqual(applyDiscount(10000, 15), 8500));
test("zero discount", () => assert.strictEqual(applyDiscount(10000, 0), 10000));
test("tax rounds half up to the cent", () => assert.strictEqual(taxFor(1000, "CA"), 73));
test("oregon has no tax", () => assert.strictEqual(taxFor(1000, "OR"), 0));
test("total", () => assert.strictEqual(total(items, { state: "CA", discountPercent: 10 }), 4341));
EOF
echo "done" > "$2"
