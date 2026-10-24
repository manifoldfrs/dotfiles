import assert from "node:assert/strict";
import { test } from "node:test";
import { respond, type RunRunner } from "./xai-search.ts";

function runner(exitCode: number, stdout: string, stderr = "") {
  const stdins: string[] = [];
  const run: RunRunner = async (stdin) => {
    stdins.push(stdin);
    return { exitCode, stdout, stderr };
  };
  return { run, stdins };
}

test("lists the xai_search tool", async () => {
  const response = await respond({ id: 1, method: "tools/list" }) as { result: { tools: { name: string }[] } };
  assert.deepEqual(response.result.tools.map((tool) => tool.name), ["xai_search"]);
});

test("runs the Pi runner with only known params and returns its text", async () => {
  const { run, stdins } = runner(0, JSON.stringify({ text: "Top posts" }));
  const response = await respond({
    id: 2,
    method: "tools/call",
    params: { name: "xai_search", arguments: { query: "agents", from_date: "2026-10-14", junk: true } },
  }, run);
  assert.deepEqual(response, { jsonrpc: "2.0", id: 2, result: { content: [{ type: "text", text: "Top posts" }] } });
  assert.deepEqual(JSON.parse(stdins[0]!), { query: "agents", from_date: "2026-10-14" });
});

test("surfaces runner errors as tool errors", async () => {
  const failing = runner(1, "", "xAI sign-in required\n");
  const failed = await respond({ id: 3, method: "tools/call", params: { name: "xai_search", arguments: { query: "x" } } }, failing.run);
  assert.deepEqual(failed, { jsonrpc: "2.0", id: 3, result: { content: [{ type: "text", text: "xAI sign-in required" }], isError: true } });

  const garbled = runner(0, "not json");
  const bad = await respond({ id: 4, method: "tools/call", params: { name: "xai_search", arguments: { query: "x" } } }, garbled.run);
  assert.equal((bad as { result: { isError: boolean } }).result.isError, true);
});

test("ignores notifications and rejects unknown tools and methods", async () => {
  assert.equal(await respond({ method: "notifications/initialized" }), undefined);
  const unknownTool = await respond({ id: 5, method: "tools/call", params: { name: "other" } }) as { error: { code: number } };
  assert.equal(unknownTool.error.code, -32602);
  const unknownMethod = await respond({ id: 6, method: "resources/list" }) as { error: { code: number } };
  assert.equal(unknownMethod.error.code, -32601);
});
