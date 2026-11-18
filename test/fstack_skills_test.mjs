import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const catalog = resolve(root, "stow/pi/skills");
const archive = resolve(root, "old/skills");
const read = (path) => readFileSync(path, "utf8");
const archivedSkill = (name) => read(resolve(archive, name, "SKILL.md"));
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

const workflows = ["dig", "prove", "sketch", "code-review", "fstack", "full-send", "full-stop", "babysit-pr", "sol-loop", "pr"];
const languages = ["ts", "go", "rust", "swift", "kotlin"];

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

test("archived fstack records how verification was routed", () => {
  const fstack = archivedSkill("fstack");
  const fix = fstack.split("## fix\n")[1].split("## build\n")[0];
  assert.doesNotMatch(fix, /Run `dig`|Run `prove`/);
  assert.match(fix, /Run `sol-loop`/);
  assert.doesNotMatch(fstack, /only when the user requested/);
  assert.match(archivedSkill("code-review"), /^Run \[`sol-loop`\]/m);
  assert.doesNotMatch(archivedSkill("code-review"), /ask before delegating/);
  assert.match(archivedSkill("testing"), /testing alone does not require `dig` or `sketch`/);
  assert.doesNotMatch(archivedSkill("prove"), /## .*Attack your own diff/);
});

test("the archive preserves the single-goal PR and Sol review workflows", () => {
  for (const name of ["learn-visually"]) assert.ok(!existsSync(resolve(catalog, name)), `${name} was removed`);
  assert.ok(!existsSync(resolve(archive, "codebase-design/DESIGN-IT-TWICE.md")));
  assert.match(archivedSkill("pr"), /A pull request addresses one goal/);
  assert.match(archivedSkill("full-send"), /One PR addresses one goal/);
  const solLoop = archivedSkill("sol-loop");
  assert.match(solLoop, /pi -p --no-session --no-extensions --no-mcp --no-skills/);
  assert.match(solLoop, /--tools read,grep,find,ls/);
  assert.match(solLoop, /--model openai\/gpt-6\.1-sol --thinking xhigh/);
  assert.doesNotMatch(solLoop, /codex exec|~\/\.claude/);
  assert.ok(existsSync(resolve(archive, "sol-loop/reviewer.md")));
  assert.ok(existsSync(resolve(archive, "sol-loop/scripts/behavior-lines")));
  assert.doesNotMatch(solLoop, /follow it\." > /, "sol-loop leaves reviewer stdin open");
});

test("the archive preserves full-send's merge gate", () => {
  assert.match(archivedSkill("babysit-pr"), /this skill never merges/);
  assert.match(archivedSkill("full-stop"), /Never merge/);
  assert.match(archivedSkill("full-send"), /## Merge gate/);
  assert.doesNotMatch(archivedSkill("pr"), /Merge only when/);
});

test("archived language guidance does not prescribe a Ruby baseline", () => {
  const doctrine = read(resolve(archive, "fstack/references/doctrine.md"));
  const template = read(resolve(archive, "fstack/references/language-pack-template.md"));
  assert.match(doctrine, /Scale verification to the risk/);

  for (const language of languages) {
    assert.doesNotMatch(archivedSkill(`coding-standards-${language}`), /^disable-model-invocation: true$/m);
  }

  assert.doesNotMatch(read(resolve(catalog, "coding-standards/SKILL.md")), /^disable-model-invocation: true$/m);

  for (const content of [doctrine, template, ...["rust", "swift", "kotlin"].map((name) => archivedSkill(`coding-standards-${name}`))]) {
    assert.doesNotMatch(content, /Ruby default|Rails is the default taste|Hotwire Native first/);
  }
});

test("archived workflow documents retain valid local reference links", () => {
  const paths = ["fstack/references/doctrine.md", ...workflows.map((name) => `${name}/SKILL.md`), "testing/SKILL.md", ...["rust", "swift", "kotlin"].map((name) => `coding-standards-${name}/SKILL.md`)];

  for (const path of paths) {
    const absolute = resolve(archive, path);

    for (const match of read(absolute).replace(/`[^`\n]*`/g, "").matchAll(/\]\(([^)]+)\)/g)) {
      const link = match[1];

      if (/^https?:|^#/.test(link)) continue;
      assert.ok(existsSync(resolve(dirname(absolute), link.split("#")[0])), `${path}: ${link}`);
    }
  }
});
