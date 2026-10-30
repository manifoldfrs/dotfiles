import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const catalog = resolve(root, "stow/opencode/skills");
const read = (path) => readFileSync(path, "utf8");
const skill = (name) => read(resolve(catalog, name, "SKILL.md"));
const frontmatter = (text) => text.split("\n---")[0];
const description = (text) => frontmatter(text).split(/\n(?=[a-z-]+:)/).find((field) => field.startsWith("description:"));
const skillNames = readdirSync(catalog, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(resolve(catalog, entry.name, "SKILL.md")))
  .map((entry) => entry.name);
const workflows = ["dig", "prove", "sketch", "code-review", "fstack", "full-send", "full-stop", "babysit-pr", "sol-loop", "pr"];
const languages = ["ts", "go", "rust", "swift", "kotlin", "rails", "javascript"];

test("every skill is model-invoked with a trigger description", () => {
  for (const name of skillNames) {
    const content = skill(name);
    assert.doesNotMatch(content, /^disable-model-invocation: true$/m, name);
    assert.match(description(content), /\b(Use|Trigger|Apply)\b/, name);
    assert.doesNotMatch(description(content), /only when the user explicitly|not automatically/, name);
    const codex = resolve(catalog, name, "agents/openai.yaml");
    if (existsSync(codex)) assert.doesNotMatch(read(codex), /allow_implicit_invocation: false/, name);
  }
});

test("verification runs without waiting for the user to request it", () => {
  const fstack = skill("fstack");
  const fix = fstack.split("## fix\n")[1].split("## build\n")[0];
  assert.doesNotMatch(fix, /Run `dig`|Run `prove`/);
  assert.match(fix, /Run `sol-loop`/);
  assert.doesNotMatch(fstack, /only when the user requested/);
  assert.match(skill("code-review"), /^Run \[`sol-loop`\]/m);
  assert.doesNotMatch(skill("code-review"), /ask before delegating/);
  assert.match(skill("testing"), /testing alone does not require `dig` or `sketch`/);
  assert.doesNotMatch(skill("prove"), /## .*Attack your own diff/);
});

test("each PR addresses one goal and the loop reviews with Sol", () => {
  for (const name of ["council", "learn-visually"]) assert.ok(!existsSync(resolve(catalog, name)), `${name} was removed`);
  assert.ok(!existsSync(resolve(catalog, "codebase-design/DESIGN-IT-TWICE.md")));
  assert.match(skill("pr"), /A pull request addresses one goal/);
  assert.match(skill("full-send"), /One PR addresses one goal/);
  assert.match(skill("sol-loop"), /codex exec .*-s read-only/);
  assert.match(skill("sol-loop"), /-m gpt-6\.1-sol -c model_reasoning_effort=.*xhigh/);
  assert.ok(existsSync(resolve(catalog, "sol-loop/scripts/behavior-lines")));
  for (const name of ["sol-loop"]) {
    for (const line of skill(name).split("\n").filter((l) => /follow it\." > /.test(l))) assert.fail(`${name}: reviewer command leaves stdin open: ${line}`);
  }
});

test("merging stays behind full-send's gate", () => {
  assert.match(skill("babysit-pr"), /this skill never merges/);
  assert.match(skill("full-stop"), /Never merge/);
  assert.match(skill("full-send"), /## Merge gate/);
  assert.doesNotMatch(skill("pr"), /Merge only when/);
});

test("language guidance remains available without a Ruby baseline", () => {
  const doctrine = read(resolve(catalog, "fstack/references/doctrine.md"));
  const template = read(resolve(catalog, "fstack/references/language-pack-template.md"));
  assert.match(doctrine, /Scale verification to the risk/);
  for (const language of languages) {
    assert.doesNotMatch(skill(`coding-standards-${language}`), /^disable-model-invocation: true$/m);
  }
  assert.doesNotMatch(skill("coding-standards"), /^disable-model-invocation: true$/m);
  for (const content of [doctrine, template, ...["rust", "swift", "kotlin"].map((name) => skill(`coding-standards-${name}`))]) {
    assert.doesNotMatch(content, /Ruby default|Rails is the default taste|Hotwire Native first/);
  }
  assert.match(description(skill("coding-standards-javascript")), /not as universal guidance for Node/);
});

test("changed skill documents retain valid local reference links", () => {
  const paths = ["fstack/references/doctrine.md", ...workflows.map((name) => `${name}/SKILL.md`), "testing/SKILL.md", ...["rust", "swift", "kotlin", "javascript"].map((name) => `coding-standards-${name}/SKILL.md`)];
  for (const path of paths) {
    const absolute = resolve(catalog, path);
    for (const match of read(absolute).replace(/`[^`\n]*`/g, "").matchAll(/\]\(([^)]+)\)/g)) {
      const link = match[1];
      if (/^https?:|^#/.test(link)) continue;
      assert.ok(existsSync(resolve(dirname(absolute), link.split("#")[0])), `${path}: ${link}`);
    }
  }
});
