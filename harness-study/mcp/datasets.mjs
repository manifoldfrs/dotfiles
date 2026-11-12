// Deterministic datasets shared by the fixture MCP server and the answer key.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = (r, list) => list[Math.floor(r() * list.length)];

export function buildOrders() {
  const r = rng(20261101);
  const countries = ["CA", "CA", "US", "US", "MX", "GB", "CA "];
  const statuses = ["delivered", "delivered", "shipped", "cancelled", "returned", "Delivered"];
  const skus = ["SKU-100", "SKU-220", "SKU-310", "SKU-404", "SKU-550", "SKU-777"];
  const orders = [];
  for (let i = 1; i <= 90; i++) {
    const month = pick(r, [9, 10, 10, 10, 11]);
    const day = 1 + Math.floor(r() * 28);
    const items = [];
    const n = 1 + Math.floor(r() * 4);
    for (let j = 0; j < n; j++) {
      items.push({
        sku: pick(r, skus),
        qty: 1 + Math.floor(r() * 5),
        unit_price_cents: 500 + Math.floor(r() * 20000),
        discount_cents: r() < 0.3 ? Math.floor(r() * 400) : 0,
      });
    }
    orders.push({
      id: `ord_${String(i).padStart(4, "0")}`,
      status: pick(r, statuses),
      placed_at: `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(Math.floor(r() * 24)).padStart(2, "0")}:15:00Z`,
      shipping: { country: pick(r, countries), carrier: pick(r, ["UPS", "FedEx", "Canada Post"]), tracking: `TRK${Math.floor(r() * 1e9)}` },
      billing: { country: pick(r, ["CA", "US", "GB"]) },
      line_items: items,
      audit_log: Array.from({ length: 6 }, (_, k) => ({ at: `2026-11-0${1 + (k % 8)}T00:0${k}:00Z`, actor: pick(r, ["system", "ops", "api"]), event: pick(r, ["viewed", "synced", "reindexed", "exported"]) })),
      notes: "Customer requested eco packaging. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.",
    });
  }
  return orders;
}

export function ordersExpected() {
  let total = 0;
  for (const o of buildOrders()) {
    if (o.status.toLowerCase() !== "delivered") continue;
    if (o.shipping.country.trim() !== "CA") continue;
    if (!o.placed_at.startsWith("2026-10-")) continue;
    for (const it of o.line_items) total += it.qty * it.unit_price_cents - it.discount_cents;
  }
  return (total / 100).toFixed(2);
}

export function buildTickets() {
  const r = rng(424242);
  const customers = [];
  for (let i = 1; i <= 40; i++) {
    customers.push({
      id: `cus_${String(i).padStart(3, "0")}`,
      name: `Customer ${i}`,
      tier: pick(r, ["enterprise", "enterprise", "pro", "free", "enterprise-trial"]),
      region: pick(r, ["na", "emea", "apac"]),
      account_manager: pick(r, ["ana", "bo", "cy"]),
    });
  }
  const tickets = [];
  for (let i = 1; i <= 230; i++) {
    tickets.push({
      id: `tkt_${String(i).padStart(4, "0")}`,
      customer_id: pick(r, customers).id,
      priority: pick(r, ["P1", "P1", "P2", "P3"]),
      status: pick(r, ["open", "open", "pending", "closed", "closed"]),
      subject: `Issue ${i}: ${pick(r, ["login fails", "slow dashboard", "export broken", "billing mismatch"])}`,
      merged_into: r() < 0.2 ? `tkt_${String(1 + Math.floor(r() * 230)).padStart(4, "0")}` : null,
    });
  }
  return { customers, tickets };
}

export function ticketsExpected() {
  const { customers, tickets } = buildTickets();
  const counts = new Map();
  for (const t of tickets) {
    if (t.priority !== "P1" || t.status !== "open" || t.merged_into) continue;
    counts.set(t.customer_id, (counts.get(t.customer_id) ?? 0) + 1);
  }
  return customers
    .filter((c) => c.tier === "enterprise" && (counts.get(c.id) ?? 0) >= 2)
    .map((c) => c.id)
    .sort()
    .join(",");
}

