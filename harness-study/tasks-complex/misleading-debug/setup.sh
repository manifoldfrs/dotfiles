#!/bin/bash
set -e
f="$1"
mkdir -p "$f/src" "$f/test"
echo '{ "name": "reports", "private": true, "type": "commonjs" }' > "$f/package.json"
cat > "$f/src/defaults.js" <<'EOF'
module.exports = {
  title: "Report",
  format: { currency: "USD", decimals: 2, locale: "en-US" },
  columns: ["name", "amount"],
};
EOF
cat > "$f/src/config.js" <<'EOF'
const DEFAULTS = require("./defaults");

function loadConfig(overrides = {}) {
  const config = Object.assign({}, DEFAULTS, overrides);
  if (overrides.format) {
    config.format = Object.assign(DEFAULTS.format, overrides.format);
  }
  if (overrides.hideCurrency) {
    delete config.format.currency;
  }
  if (overrides.extraColumns) {
    config.columns.push(...overrides.extraColumns);
  }
  return config;
}

module.exports = { loadConfig };
EOF
cat > "$f/src/format.js" <<'EOF'
function money(cents, format) {
  const value = (cents / 100).toFixed(format.decimals);
  return format.currency ? `${value} ${format.currency}` : value;
}

module.exports = { money };
EOF
cat > "$f/src/report.js" <<'EOF'
const { loadConfig } = require("./config");
const { money } = require("./format");

function renderReport(rows, overrides) {
  const config = loadConfig(overrides);
  // TODO: currency sometimes goes missing in production; maybe default it here?
  const unit = config.format.currency.toLowerCase();
  const lines = rows.map((r) => `${r.name}: ${money(r.cents, config.format)}`);
  return [`${config.title} (${unit}) [${config.columns.join(",")}]`, ...lines].join("\n");
}

module.exports = { renderReport };
EOF
cat > "$f/test/report.test.js" <<'EOF'
const test = require("node:test");
const assert = require("node:assert");
const { renderReport } = require("../src/report");
const { loadConfig } = require("../src/config");
const rows = [{ name: "a", cents: 1234 }];
const usd = "Report (usd) [name,amount]\na: 12.34 USD";

test("renders with defaults", () => {
  assert.strictEqual(renderReport(rows), usd);
});

test("plain-number export config drops the currency", () => {
  assert.strictEqual(loadConfig({ hideCurrency: true }).format.currency, undefined);
});

test("renders with defaults after an export config", () => {
  assert.strictEqual(renderReport(rows), usd);
});

test("euro report", () => {
  assert.strictEqual(renderReport(rows, { format: { currency: "EUR" } }), "Report (eur) [name,amount]\na: 12.34 EUR");
});

test("renders with defaults after a euro report", () => {
  assert.strictEqual(renderReport(rows), usd);
});
EOF
echo done > "$2"
