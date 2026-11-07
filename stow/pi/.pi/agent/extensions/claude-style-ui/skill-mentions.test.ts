import assert from "node:assert/strict";
import { test } from "node:test";
import type { AutocompleteProvider } from "@earendil-works/pi-tui";
import { highlightSkillMentions, matchingSkills, mentionBeingTyped, skillMentionProvider } from "./skill-mentions.ts";

const skills = [
  { name: "bro", description: "Restate plainly" },
  { name: "code-review", description: "Review a change" },
  { name: "dig", description: "Ground brief" },
];

const builtIn: AutocompleteProvider = {
  async getSuggestions() {
    return { items: [{ value: "builtin", label: "builtin" }], prefix: "" };
  },
  applyCompletion(lines, cursorLine, cursorCol) {
    return { lines, cursorLine, cursorCol };
  },
};

const signal = new AbortController().signal;

test("finds the mention being typed only at a word start", () => {
  assert.equal(mentionBeingTyped("use /br"), "/br");
  assert.equal(mentionBeingTyped("use /"), "/");
  assert.equal(mentionBeingTyped("(/co"), "/co");
  assert.equal(mentionBeingTyped("look in /tmp/x"), undefined);
  assert.equal(mentionBeingTyped("a/br"), undefined);
  assert.equal(mentionBeingTyped("use /bro now"), undefined);
});

test("ranks names that start with the query before names that contain it", () => {
  assert.deepEqual(matchingSkills("/d", skills).map((skill) => skill.name), ["dig", "code-review"]);
  assert.deepEqual(matchingSkills("/", skills).length, 3);
});

test("suggests skills mid-message and leaves the start of a message to Pi's menu", async () => {
  const provider = skillMentionProvider(builtIn, () => skills);
  const mid = await provider.getSuggestions(["please /br"], 0, 10, { signal });

  assert.deepEqual(mid, { items: [{ value: "/bro", label: "/bro", description: "Restate plainly" }], prefix: "/br" });
  assert.deepEqual((await provider.getSuggestions(["/br"], 0, 3, { signal }))?.items[0]?.value, "builtin");
  assert.deepEqual((await provider.getSuggestions(["please /zz"], 0, 10, { signal }))?.items[0]?.value, "builtin");
  assert.equal(await provider.getSuggestions(["please /dig "], 0, 12, { signal }), null);
});

test("completion replaces the partial mention and adds a space", () => {
  const provider = skillMentionProvider(builtIn, () => skills);

  assert.deepEqual(provider.applyCompletion(["please /br then"], 0, 10, { value: "/bro", label: "/bro" }, "/br"), {
    lines: ["please /bro  then"],
    cursorLine: 0,
    cursorCol: 12,
  });
});

test("highlights known skills only, including /skill:name, and leaves paths alone", () => {
  const names = new Set(skills.map((skill) => skill.name));
  const mark = (text: string) => `[${text}]`;

  assert.equal(highlightSkillMentions("use /bro and /dig.", names, mark), "use [/bro] and [/dig].");
  assert.equal(highlightSkillMentions("/skill:bro go", names, mark), "[/skill:bro] go");
  assert.equal(highlightSkillMentions("open /tmp/bro and /nope", names, mark), "open /tmp/bro and /nope");
  assert.equal(highlightSkillMentions("\x1b[0m/bro", names, mark), "\x1b[0m[/bro]");
});
