import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const catalog = resolve(root, "stow/pi/skills");
const read = (path) => readFileSync(path, "utf8");
const frontmatter = (text) => text.split("\n---")[0];
const description = (text) => frontmatter(text).split(/\n(?=[a-z-]+:)/).find((field) => field.startsWith("description:"));

const skillNames = readdirSync(catalog, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(resolve(catalog, entry.name, "SKILL.md")))
  .map((entry) => entry.name);

// Upstream skills keep the invocation mode their authors chose, since a sync would restore it anyway.
const localSkills = new Set(
  read(resolve(catalog, ".skill-sources.tsv"))
    .split("\n")
    .map((line) => line.split("\t"))
    .filter(([, source]) => source === "local")
    .map(([name]) => name),
);

test("every local skill is model-invoked with a trigger description", () => {
  for (const name of skillNames.filter((name) => localSkills.has(name))) {
    const content = read(resolve(catalog, name, "SKILL.md"));
    assert.doesNotMatch(content, /^disable-model-invocation: true$/m, name);
    assert.match(description(content), /\b(Use|Trigger|Apply)\b/, name);
    assert.doesNotMatch(description(content), /only when the user explicitly|not automatically/, name);
    const codex = resolve(catalog, name, "agents/openai.yaml");

    if (existsSync(codex)) assert.doesNotMatch(read(codex), /allow_implicit_invocation: false/, name);
  }
});
