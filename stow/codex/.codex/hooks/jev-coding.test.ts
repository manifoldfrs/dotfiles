import assert from "node:assert/strict";
import { test } from "node:test";
import { handle, patchEdits, type AuditState } from "./jev-coding.ts";
import type { JevCall } from "./jev-mcp-client.ts";

const PATCH = [
  "*** Begin Patch",
  "*** Update File: src/app.ts",
  "@@",
  "-const a = 1;",
  "+const a = 2;",
  "*** Add File: src/debug.ts",
  "+console.log(\"here\");",
  "*** End Patch",
].join("\n");

function jev(classifications: string[], decision = "auto", fails = false) {
  const calls: Record<string, unknown>[] = [];
  const call: JevCall = async (tool, args) => {
    assert.equal(tool, "jev_classify");
    calls.push(args);
    if (fails) throw new Error("down");
    const items = args.items as { id: string }[];
    return {
      results: items.map((item, index) => ({
        id: item.id,
        classification: classifications[index] ?? "requested",
        top_probability: 0.9,
        decision,
      })),
    };
  };
  return { call, calls };
}

async function run(events: Record<string, unknown>[], call: JevCall) {
  let state: AuditState = { prompts: [], edits: [] };
  const outputs: unknown[] = [];
  for (const event of events) {
    const result = await handle(event, state, call);
    state = result.state;
    outputs.push(result.output);
  }
  return { state, outputs };
}

const prompt = { hook_event_name: "UserPromptSubmit", prompt: "Change a to 2" };
const patch = { hook_event_name: "PostToolUse", tool_name: "apply_patch", tool_input: { command: PATCH } };
const stop = { hook_event_name: "Stop", stop_hook_active: false };

test("splits a patch into per-file edits", () => {
  assert.deepEqual(patchEdits(PATCH), [
    { file: "src/app.ts", patch: "@@\n-const a = 1;\n+const a = 2;\n" },
    { file: "src/debug.ts", patch: "+console.log(\"here\");\n" },
  ]);
});

test("reminds about jev_decide on the first edit of a turn only", async () => {
  const { call } = jev([]);
  const { outputs } = await run([prompt, patch, patch], call);
  const first = outputs[1] as { hookSpecificOutput: { hookEventName: string; additionalContext: string } };
  assert.equal(first.hookSpecificOutput.hookEventName, "PostToolUse");
  assert.match(first.hookSpecificOutput.additionalContext, /jev_decide/);
  assert.equal(outputs[2], undefined);
});

test("blocks the stop with the edits Jev flags", async () => {
  const { call, calls } = jev(["requested", "leftover"]);
  const { state, outputs } = await run([prompt, patch, stop], call);
  const output = outputs[2] as { decision: string; reason: string };
  assert.equal(output.decision, "block");
  assert.match(output.reason, /src\/debug\.ts \(leftover, p=0\.9\): console\.log\("here"\);/);
  assert.doesNotMatch(output.reason, /src\/app\.ts/);
  assert.deepEqual((calls[0]!.context as { request: string }).request, "Change a to 2");
  assert.deepEqual(state.edits, []);
});

test("lets the stop through when every edit is requested or uncertain", async () => {
  const { call } = jev(["requested", "leftover"], "review");
  const { outputs } = await run([prompt, patch, stop], call);
  assert.equal(outputs[2], undefined);
});

test("checks each turn once and skips turns without edits", async () => {
  const { call, calls } = jev(["leftover", "leftover"]);
  const { outputs } = await run([prompt, patch, { ...stop, stop_hook_active: true }, prompt, stop], call);
  assert.equal(outputs[2], undefined);
  assert.equal(outputs[4], undefined);
  assert.equal(calls.length, 0);
});

test("reports a failed audit instead of passing it", async () => {
  const { call } = jev([], "auto", true);
  const { outputs } = await run([prompt, patch, stop], call);
  assert.match((outputs[2] as { reason: string }).reason, /audit failed/);
});

test("ignores subagent events and other tools", async () => {
  const { call } = jev([]);
  const { state } = await run([
    prompt,
    { ...patch, agent_id: "sub-1" },
    { hook_event_name: "PostToolUse", tool_name: "Bash", tool_input: { command: PATCH } },
  ], call);
  assert.deepEqual(state.edits, []);
});
