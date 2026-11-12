const test = require("node:test");
const assert = require("node:assert");
const { renderReport } = require("../src/report");
const { loadConfig } = require("../src/config");
const DEFAULTS = require("../src/defaults");
const snapshot = JSON.parse(JSON.stringify(DEFAULTS));
const rows = [{ name: "a", cents: 1234 }];

test("no override mutates the shared defaults", () => {
  loadConfig({ format: { currency: "GBP", decimals: 0 } });
  loadConfig({ extraColumns: ["tax"] });
  loadConfig({ format: { locale: "fr-FR" }, extraColumns: ["fee"] });
  assert.deepStrictEqual(DEFAULTS, snapshot);
});

test("partial format override keeps other default format fields", () => {
  assert.deepStrictEqual(loadConfig({ format: { decimals: 0 } }).format, { currency: "USD", decimals: 0, locale: "en-US" });
});

test("extra columns apply only to that config", () => {
  assert.deepStrictEqual(loadConfig({ extraColumns: ["tax"] }).columns, ["name", "amount", "tax"]);
  assert.deepStrictEqual(loadConfig().columns, ["name", "amount"]);
});

test("reports render independently in any order", () => {
  assert.strictEqual(renderReport(rows, { format: { currency: "EUR", decimals: 1 } }), "Report (eur) [name,amount]\na: 12.3 EUR");
  assert.strictEqual(renderReport(rows, { extraColumns: ["tax"] }), "Report (usd) [name,amount,tax]\na: 12.34 USD");
  assert.strictEqual(renderReport(rows), "Report (usd) [name,amount]\na: 12.34 USD");
});

test("defaults cannot be corrupted through a returned config", () => {
  const c = loadConfig();
  c.format.currency = "JPY";
  c.columns.push("oops");
  assert.strictEqual(renderReport(rows), "Report (usd) [name,amount]\na: 12.34 USD");
});

test("hiding the currency affects only that config", () => {
  assert.strictEqual(loadConfig({ hideCurrency: true }).format.currency, undefined);
  assert.strictEqual(loadConfig({ hideCurrency: true, format: { decimals: 1 } }).format.currency, undefined);
  assert.strictEqual(loadConfig().format.currency, "USD");
});
