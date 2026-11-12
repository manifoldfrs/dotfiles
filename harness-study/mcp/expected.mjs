#!/usr/bin/env node
// Print the answer key for a fixture dataset. Usage: node expected.mjs <orders|tickets>
import { ordersExpected, ticketsExpected } from "./datasets.mjs";

const keys = { orders: ordersExpected, tickets: ticketsExpected };
const name = process.argv[2];
if (!keys[name]) {
  console.error("usage: expected.mjs orders|tickets");
  process.exit(2);
}
console.log(keys[name]());
