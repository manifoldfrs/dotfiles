import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import inlineSkills, { findMentionedSkills } from "./index.ts";

const skills = [
  { name: "bro", path: "/skills/bro/SKILL.md" },
  { name: "code-review", path: "/skills/code-review/SKILL.md" },
];

function names(text: string): string[] {
  return findMentionedSkills(text, skills).map((skill) => skill.name);
}

test("finds skills mentioned anywhere in the message", () => {
  assert.deepEqual(names("use the /bro skill to create the responses"), ["bro"]);
  assert.deepEqual(names("use the /skill:bro to create the responses"), ["bro"]);
  assert.deepEqual(names("/code-review then /bro."), ["code-review", "bro"]);
  assert.deepEqual(names("rewrite it (/bro)"), ["bro"]);
});

test("ignores paths, unknown names, code, and repeats", () => {
  assert.deepEqual(names("look in /bro/notes and /tmp/bro"), []);
  assert.deepEqual(names("run /unknown-skill"), []);
  assert.deepEqual(names("type `/bro` or\n```\n/bro\n```"), []);
  assert.deepEqual(names("/bro and /bro again"), ["bro"]);
  assert.deepEqual(names("a/bro b"), []);
});

test("leaves a leading /skill:name to Pi's own expansion", () => {
  assert.deepEqual(names("/skill:bro then /code-review"), ["code-review"]);
  assert.deepEqual(names("/bro then /code-review"), ["bro", "code-review"]);
});

test("appends each mentioned skill's instructions to the message", async () => {
  const dir = mkdtempSync(join(tmpdir(), "inline-skills-"));
  const path = join(dir, "SKILL.md");
  writeFileSync(path, "---\nname: bro\ndescription: Restate.\n---\n\nRestate your last message.\n");
  const notes: string[] = [];

  const ctx = { hasUI: true, ui: { notify: (note: string) => notes.push(note) } };

  type Handler = (event: Readonly<Record<string, string>>, context: typeof ctx) => { action: string; text?: string } | undefined;

  let handler: Handler | undefined;
  const api = {
    on(_name: string, registered: Handler) { handler = registered; },
    getCommands() {
      return [
        { name: "skill:bro", source: "skill", sourceInfo: { path } },
        { name: "model", source: "builtin", sourceInfo: { path: "" } },
      ];
    },
  };
  // SAFETY: the harness supplies only the runtime methods this extension uses.
  inlineSkills(api as unknown as ExtensionAPI);

  const result = await handler?.({ type: "input", text: "use the /bro skill", source: "interactive" }, ctx);
  assert.deepEqual(result, {
    action: "transform",
    text: `use the /bro skill\n\n<skill name="bro" location="${path}">\nReferences are relative to ${dir}.\n\nRestate your last message.\n</skill>`,
  });
  assert.deepEqual(await handler?.({ type: "input", text: "no skills here", source: "interactive" }, ctx), { action: "continue" });
  assert.deepEqual(notes, ["Skills loaded: /bro"]);
});
