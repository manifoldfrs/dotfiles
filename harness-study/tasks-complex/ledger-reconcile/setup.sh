#!/bin/bash
set -e
node - "$1" "$2" <<'EOF'
const fs = require("node:fs");
const [fixture, expectedFile] = process.argv.slice(2);
let a = 77;
const r = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const fmtBank = (cents) => {
  const abs = Math.abs(cents);
  const s = (abs / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return cents < 0 ? `"(${s})"` : `"${s}"`;
};
const ledger = ["id,date,amount,memo"];
const bank = ["date,description,amount"];
const unsettled = [];
for (let i = 1; i <= 70; i++) {
  const id = `LDG-${String(10000 + i * 37).padStart(5, "0")}`;
  const day = 1 + (i % 28);
  let cents = Math.floor(r() * 400000) + 100;
  if (r() < 0.2) cents = -cents;
  ledger.push(`${id},2026-10-${String(day).padStart(2, "0")},${(cents / 100).toFixed(2)},invoice ${i}`);
  const ref = [`REF:${id}`, `${id.toLowerCase()} payment`, `PAYMENT ${id.replace("-", "")}`, `Ref ${id}`][Math.floor(r() * 4)];
  const bdate = `10/${String(Math.min(28, day + 1)).padStart(2, "0")}/2026`;
  const roll = r();
  if (roll < 0.08) {
    unsettled.push(id);
  } else if (roll < 0.16) {
    bank.push(`${bdate},${ref},${fmtBank(cents + (r() < 0.5 ? 1 : -100))}`);
    unsettled.push(id);
  } else if (roll < 0.36) {
    const part = Math.round(cents * (0.3 + r() * 0.4));
    bank.push(`${bdate},${ref} 1/2,${fmtBank(part)}`);
    bank.push(`10/28/2026,${ref} 2/2,${fmtBank(cents - part)}`);
  } else if (roll < 0.42) {
    const part = Math.round(cents * 0.5);
    bank.push(`${bdate},${ref} partial,${fmtBank(part)}`);
    unsettled.push(id);
  } else if (roll < 0.47) {
    bank.push(`${bdate},${ref},${fmtBank(-cents)}`);
    unsettled.push(id);
  } else {
    bank.push(`${bdate},${ref},${fmtBank(cents)}`);
  }
  if (r() < 0.25) bank.push(`${bdate},MONTHLY FEE,${fmtBank(-Math.floor(r() * 3000))}`);
}
const header = bank.shift();
for (let i = bank.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [bank[i], bank[j]] = [bank[j], bank[i]]; }
fs.writeFileSync(`${fixture}/ledger.csv`, ledger.join("\n") + "\n");
fs.writeFileSync(`${fixture}/bank.csv`, [header, ...bank].join("\n") + "\n");
fs.writeFileSync(expectedFile, unsettled.sort().join(",") + "\n");
EOF
