import assert from "node:assert/strict";
import { test } from "node:test";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import skillToast, { skillOfRead } from "./index.ts";

type Note = { readonly hasUI: true; readonly ui: { readonly notify: (note: string) => void } };

type Event = Readonly<Record<string, string | boolean | Readonly<Record<string, string>>>>;

type Handler = (event: Event, ctx: Note) => { action: string } | undefined | void;

function harness() {
  const handlers = new Map<string, Handler>();
  const notes: string[] = [];
  const ctx: Note = { hasUI: true, ui: { notify: (note) => notes.push(note) } };
  const api = { on: (name: string, handler: Handler) => handlers.set(name, handler) };

  // SAFETY: skillToast only calls on(), and its handlers use only ctx.hasUI and ctx.ui.notify, which the fake supplies.
  skillToast(api as unknown as ExtensionAPI);

  return { notes, dispatch: (name: string, event: Event) => handlers.get(name)?.(event, ctx) };
}

test("names the skill a SKILL.md read loads", () => {
  assert.equal(skillOfRead("/home/u/.agents/skills/prove/SKILL.md"), "prove");
  assert.equal(skillOfRead("/repo/README.md"), undefined);
});

test("toasts a typed /skill:name and a model-read SKILL.md, and nothing else", () => {
  const h = harness();
  assert.deepEqual(h.dispatch("input", { text: "/skill:testing write the test" }), { action: "continue" });
  h.dispatch("input", { text: "mention /skill:testing later" });
  h.dispatch("tool_result", { toolName: "read", isError: false, input: { path: "/s/prove/SKILL.md" } });
  h.dispatch("tool_result", { toolName: "read", isError: true, input: { path: "/s/dig/SKILL.md" } });
  h.dispatch("tool_result", { toolName: "write", isError: false, input: { path: "/s/dig/SKILL.md" } });
  assert.deepEqual(h.notes, ["Skill ready: /testing", "Skill ready: /prove"]);
});
