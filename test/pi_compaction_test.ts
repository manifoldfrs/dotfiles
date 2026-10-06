import assert from "node:assert/strict";
import { test } from "node:test";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import continueAfterCompaction from "../stow/pi/.pi/agent/extensions/continue-after-compaction.ts";

type CompactHandler = (event: Record<string, unknown>, ctx: ExtensionContext) => void;

async function compact(reason: string, sessionFile: string | undefined) {
  let handler: CompactHandler | undefined;
  const sent: { content: string; options: unknown }[] = [];
  const api = {
    on(name: string, registered: CompactHandler) {
      if (name === "session_compact") handler = registered;
    },
    sendUserMessage(content: string, options: unknown) {
      sent.push({ content, options });
    },
  };
  // SAFETY: the harness supplies only the API and context members this extension uses.
  continueAfterCompaction(api as unknown as ExtensionAPI);
  const ctx = { sessionManager: { getSessionFile: () => sessionFile } } as unknown as ExtensionContext;
  assert.ok(handler);
  handler({ type: "session_compact", reason, compactionEntry: { id: "c1" }, fromExtension: false, willRetry: false }, ctx);
  await new Promise((resolve) => setTimeout(resolve, 5));
  return sent;
}

test("steers the agent to resume after automatic compaction", async () => {
  for (const reason of ["threshold", "overflow"]) {
    const sent = await compact(reason, "/sessions/s.jsonl");
    assert.equal(sent.length, 1);
    assert.deepEqual(sent[0]?.options, { deliverAs: "steer" });
    assert.match(sent[0]?.content ?? "", /"\/sessions\/s\.jsonl"/);
    assert.match(sent[0]?.content ?? "", /"c1"/);
  }
});

test("does nothing after manual compaction", async () => {
  assert.deepEqual(await compact("manual", "/sessions/s.jsonl"), []);
});

test("falls back to the summary for ephemeral sessions", async () => {
  const [message] = await compact("threshold", undefined);
  assert.match(message?.content ?? "", /ephemeral/);
});
