import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { registerAgentGuardrails } from "../stow/pi/.pi/agent/extensions/agent-guardrails.ts";

const GUARDRAILS_DIR = join(import.meta.dirname, "../stow/bin/.local/share/agent-guardrails");

type ToolCallResult = { block?: boolean; reason?: string } | undefined;
type ToolCallHandler = (event: Record<string, unknown>, ctx: ExtensionContext) => ToolCallResult;

function harness(guardrailsDir = GUARDRAILS_DIR) {
  let handler: ToolCallHandler | undefined;
  const notices: string[] = [];
  const api = {
    on(name: string, registered: ToolCallHandler) {
      if (name === "tool_call") handler = registered;
    },
  };
  // SAFETY: the harness supplies only the API and context members this extension uses.
  registerAgentGuardrails(api as unknown as ExtensionAPI, guardrailsDir);
  const ctx = { cwd: "/tmp", ui: { notify(message: string) { notices.push(message); } } } as unknown as ExtensionContext;
  return {
    notices,
    call(event: Record<string, unknown>) {
      assert.ok(handler);
      return handler({ type: "tool_call", toolCallId: "1", ...event }, ctx);
    },
  };
}

test("blocks a destructive Rails command with the shared script's reason", () => {
  const result = harness().call({ toolName: "bash", input: { command: "bin/rails db:drop" } });
  assert.equal(result?.block, true);
  assert.match(result?.reason ?? "", /destructive Rails database task/);
});

test("blocks the same command when a Codemode script issues it", () => {
  const result = harness().call({ toolName: "bash", parentToolCallId: "codemode/1", input: { command: "git commit --no-verify -m x" } });
  assert.equal(result?.block, true);
});

test("blocks edits and writes to generated Rails files", () => {
  const h = harness();
  assert.equal(h.call({ toolName: "edit", input: { path: "db/schema.rb", edits: [] } })?.block, true);
  assert.equal(h.call({ toolName: "write", input: { path: "config/master.key", content: "x" } })?.block, true);
});

test("allows ordinary commands and edits", () => {
  const h = harness();
  assert.equal(h.call({ toolName: "bash", input: { command: "bin/rails test" } }), undefined);
  assert.equal(h.call({ toolName: "edit", input: { path: "app/models/card.rb", edits: [] } }), undefined);
  assert.equal(h.call({ toolName: "read", input: { path: "db/schema.rb" } }), undefined);
});

test("keeps git from opening an interactive editor", () => {
  const input = { command: "git rebase --continue" };
  harness().call({ toolName: "bash", input });
  assert.equal(input.command, "export GIT_EDITOR=true GIT_SEQUENCE_EDITOR=true GIT_MERGE_AUTOEDIT=no\ngit rebase --continue");
  const plain = { command: "ls" };
  harness().call({ toolName: "bash", input: plain });
  assert.equal(plain.command, "ls");
});

test("fails closed when a guardrail script crashes", () => {
  const broken = mkdtempSync(join(tmpdir(), "guardrails-broken-"));
  try {
    for (const name of ["block-dangerous-bash.sh", "block-generated-edits.sh"]) writeFileSync(join(broken, name), "exit 1\n");
    const h = harness(broken);
    const bash = h.call({ toolName: "bash", input: { command: "ls" } });
    assert.equal(bash?.block, true);
    assert.match(bash?.reason ?? "", /Failing closed/);
    assert.equal(h.call({ toolName: "edit", input: { path: "app/models/card.rb", edits: [] } })?.block, true);
  } finally {
    rmSync(broken, { recursive: true });
  }
});

test("warns once and allows calls when the shared scripts are not installed", () => {
  const missing = mkdtempSync(join(tmpdir(), "guardrails-missing-"));
  try {
    const h = harness(join(missing, "absent"));
    assert.equal(h.call({ toolName: "bash", input: { command: "bin/rails db:drop" } }), undefined);
    assert.equal(h.call({ toolName: "bash", input: { command: "bin/rails db:drop" } }), undefined);
    assert.equal(h.notices.length, 1);
    assert.match(h.notices[0] ?? "", /guardrails are not enforced/);
  } finally {
    rmSync(missing, { recursive: true });
  }
});
