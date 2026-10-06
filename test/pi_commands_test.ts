import assert from "node:assert/strict";
import { test } from "node:test";
import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import lg from "../stow/pi/.pi/agent/extensions/lg.ts";
import update from "../stow/pi/.pi/agent/extensions/update.ts";

function harness(extension: (pi: ExtensionAPI) => void, idle = true, approved = true, code = 0) {
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
      return { code, stdout: "native updater output", stderr: "" };
    },
  };
  const context = {
    isIdle() { return idle; },
    async waitForIdle() { events.push("idle"); },
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
  assert.deepEqual(h.events, ["confirm", "idle", "exec"]);
  assert.deepEqual(h.executions, [{ command: "pi", args: ["update"], options: { timeout: 180_000 } }]);
  assert.deepEqual(h.notifications, [{ message: "native updater output", level: "info" }]);
});

test("/update reports failure without retrying installation", async () => {
  const h = harness(update, true, true, 1);
  await h.run("update");
  assert.equal(h.executions.length, 1);
  assert.deepEqual(h.notifications, [{ message: "native updater output", level: "error" }]);
});
