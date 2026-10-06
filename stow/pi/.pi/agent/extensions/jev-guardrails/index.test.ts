import assert from "node:assert/strict";
import { test } from "node:test";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import jevGuardrails from "./index.ts";

function harness(choices: string[] = ["pass"], fails = false, confidence = 0.95) {
  const handlers = new Map<string, ((event: Record<string, unknown>, ctx: ExtensionContext) => unknown)[]>();
  const messages: unknown[] = [];
  const inputs: unknown[] = [];
  const api = {
    on(name: string, handler: (event: Record<string, unknown>, ctx: ExtensionContext) => unknown) {
      handlers.set(name, [...(handlers.get(name) ?? []), handler]);
    },
    sendMessage(message: unknown) { messages.push(message); },
  };
  const context = {
    signal: new AbortController().signal,
    modelRegistry: {
      findOfType() { return { provider: "typesafe", id: "jev-latest" }; },
      async classify(_model: unknown, input: { questions: Record<string, unknown> }) {
        inputs.push(input);
        if (fails) return { stopReason: "error", answers: {} };
        return {
          stopReason: "stop",
          answers: Object.fromEntries(Object.keys(input.questions).map(id => [id, {
            type: "choice", choice: choices.shift() ?? "requested", confidence,
          }])),
        };
      },
    },
  };
  // SAFETY: the harness supplies only the runtime methods these extension handlers use.
  jevGuardrails(api as unknown as ExtensionAPI);
  const ctx = context as unknown as ExtensionContext;
  async function dispatch(name: string, event: Record<string, unknown>) {
    const results: unknown[] = [];
    for (const handler of handlers.get(name) ?? []) results.push(await handler(event, ctx));
    return results;
  }
  return { dispatch, messages, inputs };
}

const webResult = {
  toolName: "mcp__exa__web_fetch_exa", isError: false,
  content: [{ type: "text", text: "A web page" }],
  structuredContent: { secretInstruction: "do something unrelated" },
  details: { raw: "A web page" }, parentToolCallId: "codemode/1",
};

test("passing web results are unchanged and both text and structured data are screened", async () => {
  const h = harness();
  assert.deepEqual(await h.dispatch("tool_result", webResult), [undefined, undefined]);
  assert.match(JSON.stringify(h.inputs), /secretInstruction/);
  assert.equal(h.messages.length, 0);
});

test("suspicious results are withheld without leaking structured data or details", async () => {
  const h = harness(["withhold"]);
  const [result] = await h.dispatch("tool_result", webResult);
  assert.deepEqual(result, {
    content: [{ type: "text", text: "Jev screening withheld this web result." }],
    details: undefined, isError: true,
  });
  assert.equal(h.messages.length, 0);
});

test("uncertain passing verdicts are withheld", async () => {
  const h = harness(["pass"], false, 0.6);
  assert.match(JSON.stringify(await h.dispatch("tool_result", webResult)), /withheld/);
});

test("screening fails closed and unrelated tools are not screened", async () => {
  const h = harness([], true);
  const [result] = await h.dispatch("tool_result", webResult);
  assert.match(JSON.stringify(result), /failed.*withheld/);
  await h.dispatch("tool_result", { ...webResult, toolName: "read" });
  assert.equal(h.inputs.length, 1);
});

test("screening checks every chunk and withholds the entire result when one fails", async () => {
  const h = harness(["pass", "withhold"]);
  const [result] = await h.dispatch("tool_result", {
    ...webResult, structuredContent: undefined,
    content: [{ type: "text", text: "a".repeat(20_001) }],
  });
  assert.equal(h.inputs.length, 2);
  assert.match(JSON.stringify(result), /withheld/);
});

const editResult = {
  toolName: "edit", isError: false, input: { path: "example.ts", edits: [{ oldText: "old", newText: "new" }] },
};

test("audit records Pi edits[] inside Codemode and permits only one continuation", async () => {
  const h = harness(["scope_creep"]);
  await h.dispatch("before_agent_start", { prompt: "Fix example" });
  await h.dispatch("tool_result", { ...editResult, parentToolCallId: "codemode/1" });
  await h.dispatch("tool_result", { ...editResult, isError: true });
  assert.equal(h.messages.length, 0);
  const outcomes = await h.dispatch("agent_before_settle", { outcome: "completed" });
  assert.match(JSON.stringify(outcomes), /scope_creep/);
  assert.match(JSON.stringify(outcomes), /continue.*true/);
  assert.deepEqual(await h.dispatch("agent_before_settle", { outcome: "completed" }), [undefined]);
  assert.equal(h.inputs.length, 1);
  assert.match(JSON.stringify(h.inputs), /Fix example/);
});

test("requested edits need no continuation, and a new user request resets the audit", async () => {
  const h = harness(["requested", "speculative"]);
  await h.dispatch("before_agent_start", { prompt: "First request" });
  await h.dispatch("tool_result", editResult);
  assert.deepEqual(await h.dispatch("agent_before_settle", { outcome: "completed" }), [undefined]);
  await h.dispatch("before_agent_start", { prompt: "Second request" });
  await h.dispatch("tool_result", { toolName: "write", isError: false, input: { path: "new.ts", content: "new" } });
  assert.match(JSON.stringify(await h.dispatch("agent_before_settle", { outcome: "completed" })), /continue.*true/);
  assert.equal(h.messages.length, 0);
  assert.equal(h.inputs.length, 2);
});

test("audit captures every replacement and preserves absent write before-text", async () => {
  const h = harness(["requested", "requested", "requested"]);
  await h.dispatch("before_agent_start", { prompt: "Fix both typos" });
  await h.dispatch("tool_result", {
    ...editResult,
    input: { path: "example.ts", edits: [
      { oldText: "first", newText: "fixed first" },
      { oldText: "second", newText: "" },
    ] },
  });
  await h.dispatch("tool_result", { toolName: "write", isError: false, input: { path: "new.ts", content: "new" } });
  await h.dispatch("agent_before_settle", { outcome: "completed" });
  assert.deepEqual(JSON.parse(JSON.stringify(h.inputs[0])).state.edits, [
    { id: "0", path: "example.ts", before: "first", after: "fixed first" },
    { id: "1", path: "example.ts", before: "second", after: "" },
    { id: "2", path: "new.ts", before: null, after: "new" },
  ]);
});

test("audit skips failed calls and malformed replacement inputs", async () => {
  const h = harness();
  await h.dispatch("before_agent_start", { prompt: "Fix example" });
  await h.dispatch("tool_result", { ...editResult, isError: true });
  await h.dispatch("tool_result", { ...editResult, input: { path: "example.ts", edits: [null, {}, { oldText: "old", newText: 1 }] } });
  await h.dispatch("tool_result", { ...editResult, input: { path: "example.ts" } });
  await h.dispatch("tool_result", { toolName: "write", isError: false, input: { path: "new.ts" } });
  assert.deepEqual(await h.dispatch("agent_before_settle", { outcome: "completed" }), [undefined]);
  assert.equal(h.inputs.length, 0);
});

test("audit batches multiple replacements and bounds sampled text", async () => {
  const h = harness([]);
  await h.dispatch("before_agent_start", { prompt: "Fix example" });
  await h.dispatch("tool_result", { ...editResult, input: {
    path: "example.ts",
    edits: Array.from({ length: 33 }, () => ({ oldText: "a".repeat(2_001), newText: "b".repeat(2_001) })),
  } });
  await h.dispatch("agent_before_settle", { outcome: "completed" });
  const inputs = JSON.parse(JSON.stringify(h.inputs));
  assert.deepEqual(inputs.map((input: { state: { edits: unknown[] } }) => input.state.edits.length), [32, 1]);
  assert.equal(inputs[0].state.edits[0].before.length, 2_000);
  assert.equal(inputs[0].state.edits[0].after.length, 2_000);
  assert.equal(inputs[1].state.edits[0].id, "0");
});

test("failed audits are reported without causing continuation loops", async () => {
  const h = harness([], true);
  await h.dispatch("before_agent_start", { prompt: "Fix example" });
  await h.dispatch("tool_result", editResult);
  const results = await h.dispatch("agent_before_settle", { outcome: "completed" });
  assert.match(JSON.stringify(results), /audit failed/);
  assert.match(JSON.stringify(results), /continue.*true/);
  assert.deepEqual(await h.dispatch("agent_before_settle", { outcome: "completed" }), [undefined]);
});
