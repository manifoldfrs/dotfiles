#!/usr/bin/env node
// Deterministic stdio MCP server for harness-study tasks.
// Usage: node fixture-server.mjs <orders|tickets>
import { createInterface } from "node:readline";
import { buildOrders, buildTickets } from "./datasets.mjs";

const DATASETS = {
  orders: {
    instructions: "Read-only order store. List order ids with list_orders, then fetch each with get_order.",
    tools() {
      const orders = buildOrders();
      const byId = new Map(orders.map((o) => [o.id, o]));
      return {
        list_orders: {
          description: "List order ids, 15 per page. Pass the returned next_cursor to get the next page; next_cursor is null on the last page.",
          inputSchema: { type: "object", properties: { cursor: { type: ["string", "null"] } } },
          call: ({ cursor }) => {
            const start = cursor ? Number(cursor) : 0;
            const page = orders.slice(start, start + 15).map((o) => o.id);
            const next = start + 15 < orders.length ? String(start + 15) : null;
            return { order_ids: page, next_cursor: next };
          },
        },
        get_order: {
          description: "Fetch one order by id with its status, placed_at (UTC), shipping, billing, line items, and audit log.",
          inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
          call: ({ id }) => {
            const o = byId.get(id);
            if (!o) throw new Error(`no order ${id}`);
            return o;
          },
        },
      };
    },
  },
  tickets: {
    instructions: "Read-only support desk. Search tickets with search_tickets (paged) and look up customers with get_customer.",
    tools() {
      const { customers, tickets } = buildTickets();
      const byId = new Map(customers.map((c) => [c.id, c]));
      return {
        search_tickets: {
          description: "Search tickets by optional exact status and priority. Returns 20 tickets per page and has_more; pages start at 1.",
          inputSchema: { type: "object", properties: { status: { type: "string" }, priority: { type: "string" }, page: { type: "integer" } } },
          call: ({ status, priority, page = 1 }) => {
            const hits = tickets.filter((t) => (!status || t.status === status) && (!priority || t.priority === priority));
            const start = (page - 1) * 20;
            return { page, total: hits.length, has_more: start + 20 < hits.length, tickets: hits.slice(start, start + 20) };
          },
        },
        get_customer: {
          description: "Fetch one customer by id, including tier.",
          inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
          call: ({ id }) => {
            const c = byId.get(id);
            if (!c) throw new Error(`no customer ${id}`);
            return c;
          },
        },
      };
    },
  },
};

function serve(name) {
  const dataset = DATASETS[name];
  const tools = dataset.tools();
  const send = (msg) => process.stdout.write(`${JSON.stringify(msg)}\n`);
  const rl = createInterface({ input: process.stdin });
  rl.on("line", (line) => {
    if (!line.trim()) return;
    let req;
    try {
      req = JSON.parse(line);
    } catch {
      return;
    }
    if (req.id === undefined) return;
    const reply = (result) => send({ jsonrpc: "2.0", id: req.id, result });
    switch (req.method) {
      case "initialize":
        return reply({
          protocolVersion: req.params?.protocolVersion ?? "2025-06-18",
          capabilities: { tools: {} },
          serverInfo: { name, version: "1.0.0" },
          instructions: dataset.instructions,
        });
      case "ping":
        return reply({});
      case "tools/list":
        return reply({
          tools: Object.entries(tools).map(([toolName, t]) => ({ name: toolName, description: t.description, inputSchema: t.inputSchema })),
        });
      case "tools/call": {
        const tool = tools[req.params?.name];
        if (!tool) return send({ jsonrpc: "2.0", id: req.id, error: { code: -32602, message: `unknown tool ${req.params?.name}` } });
        try {
          const result = tool.call(req.params.arguments ?? {});
          return reply({ content: [{ type: "text", text: JSON.stringify(result) }], structuredContent: result });
        } catch (err) {
          return reply({ content: [{ type: "text", text: String(err.message) }], isError: true });
        }
      }
      default:
        return send({ jsonrpc: "2.0", id: req.id, error: { code: -32601, message: `method not found: ${req.method}` } });
    }
  });
}

const name = process.argv[2];
if (!DATASETS[name]) {
  console.error("usage: fixture-server.mjs orders|tickets");
  process.exit(2);
}
serve(name);
