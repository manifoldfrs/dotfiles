import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import lg from "../stow/pi/.pi/agent/extensions/lg.ts";
import update from "../stow/pi/.pi/agent/extensions/update.ts";

function harness(extension: (pi: ExtensionAPI) => void, idle = true, approved = true, code = 0, versions = ["1.5.0", "1.5.0"]) {
  const commands = new Map<string, { handler: (args: string, ctx: ExtensionCommandContext) => Promise<void> }>();
  const messages: unknown[] = [];
  const notifications: unknown[] = [];
  const executions: unknown[] = [];
  const events: string[] = [];
  const api = {
    registerCommand(name: string, command: { handler: (args: string, ctx: ExtensionCommandContext) => Promise<void> }) {
      commands.set(name, command);
    },
    sendUserMessage(content: string, options: unknown) { messages.push({ content, options }); },
    async exec(command: string, args: string[], options: unknown) {
      events.push("exec");
      executions.push({ command, args, options });
      if (args[0] === "--version") return { code: 0, stdout: `${versions.shift() ?? ""}\n`, stderr: "" };
      return { code, stdout: "native updater output", stderr: "" };
    },
  };
  const context = {
    isIdle() { return idle; },
    async waitForIdle() { events.push("idle"); },
    sessionManager: { getSessionFile: () => "/sessions/current.jsonl" },
    shutdown() { events.push("shutdown"); },
    ui: {
      async confirm() { events.push("confirm"); return approved; },
      notify(message: string, level: string) { notifications.push({ message, level }); },
    },
  };
  // SAFETY: these stubs supply the methods used by the registered command handlers.
  extension(api as unknown as ExtensionAPI);
  return {
    messages, notifications, executions, events,
    async run(name: string) {
      const command = commands.get(name);
      assert.ok(command);
      await command.handler("", context as unknown as ExtensionCommandContext);
    },
  };
}

test("/lg expands the shared skill without copying its prompt", async () => {
  const h = harness(lg);
  await h.run("lg");
  assert.deepEqual(h.messages, [{ content: "/skill:lg", options: { expandPromptTemplates: true } }]);
});

test("/lg preserves follow-up queuing while the agent is busy", async () => {
  const h = harness(lg, false);
  await h.run("lg");
  assert.deepEqual(h.messages, [{ content: "/skill:lg", options: { deliverAs: "followUp", expandPromptTemplates: true } }]);
  assert.equal(h.notifications.length, 1);
});

test("/update does not execute without confirmation", async () => {
  const h = harness(update, true, false);
  await h.run("update");
  assert.equal(h.executions.length, 0);
  assert.deepEqual(h.events, ["confirm"]);
});

test("/update uses the native updater after approval and idle", async () => {
  const h = harness(update);
  await h.run("update");
  assert.deepEqual(h.events, ["confirm", "idle", "exec", "exec", "exec"]);
  assert.deepEqual(h.executions[1], { command: "pi", args: ["update"], options: { timeout: 180_000 } });
  assert.deepEqual(h.notifications, [{ message: "native updater output", level: "info" }]);
});

test("/update reports failure without retrying installation", async () => {
  const h = harness(update, true, true, 1);
  await h.run("update");
  assert.equal(h.executions.length, 2);
  assert.deepEqual(h.notifications, [{ message: "native updater output", level: "error" }]);
});

async function withRelaunchFile(run: (file: string | undefined) => Promise<void>, enabled = true) {
  const previous = process.env.PI_RELAUNCH_FILE;
  const file = enabled ? join(await mkdtemp(join(tmpdir(), "pi-relaunch-")), "file") : undefined;
  if (file) process.env.PI_RELAUNCH_FILE = file;
  else delete process.env.PI_RELAUNCH_FILE;
  try {
    await run(file);
  } finally {
    if (previous === undefined) delete process.env.PI_RELAUNCH_FILE;
    else process.env.PI_RELAUNCH_FILE = previous;
  }
}

test("/update resumes the session when the version changed", async () => {
  await withRelaunchFile(async (file) => {
    const h = harness(update, true, true, 0, ["1.5.0", "1.6.0"]);
    await h.run("update");
    assert.equal(h.events.at(-1), "shutdown");
    assert.equal(await readFile(file ?? "", "utf8"), "/sessions/current.jsonl");
    assert.deepEqual(h.notifications, [{ message: "Updated Pi: 1.5.0 -> 1.6.0. Restarting Pi…", level: "info" }]);
  });
});

test("/restart without the shell wrapper explains how to resume", async () => {
  await withRelaunchFile(async () => {
    const h = harness(update);
    await h.run("restart");
    assert.ok(!h.events.includes("shutdown"));
    assert.deepEqual(h.notifications, [{ message: "Exit and run `pi --session /sessions/current.jsonl` to continue.", level: "info" }]);
  }, false);
});
