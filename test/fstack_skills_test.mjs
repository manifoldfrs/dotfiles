import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const catalog = resolve(root, "stow/agents/.agents/skills");
const read = (path) => readFileSync(path, "utf8");
const skill = (name) => read(resolve(catalog, name, "SKILL.md"));
const description = (text) => text.split("\n").find((line) => line.startsWith("description:"));
const workflows = ["dig", "prove", "sketch", "code-review", "learn-visually"];
const languages = ["ts", "go", "rust", "swift", "kotlin", "rails", "javascript"];

test("fstack stays manual while requested workflows remain discoverable", () => {
  assert.match(skill("fstack"), /^disable-model-invocation: true$/m);
  for (const name of workflows) {
    const content = skill(name);
    assert.match(content, new RegExp(`^name: ${name}$`, "m"));
    assert.doesNotMatch(content, /^disable-model-invocation: true$/m);
    assert.match(description(content), /user.*requests?|user.*asks/);
  }
  assert.match(description(skill("dig")), /not for routine code questions or every edit/);
  assert.match(description(skill("prove")), /ordinary edits still need relevant checks/);
  assert.match(description(skill("sketch")), /alone is not a request/);
  assert.match(description(skill("code-review")), /not automatically after an edit or test run/);
  assert.match(description(skill("learn-visually")), /answer casual explanations and quick diagrams without this workflow/);
});

test("ordinary testing and the fix route do not start the heavyweight chain", () => {
  assert.match(skill("testing"), /testing alone does not require `dig` or `sketch`/);
  const fix = skill("fstack").split("## fix\n")[1].split("## build\n")[0];
  assert.doesNotMatch(fix, /Run `dig`|Run `prove`/);
  assert.match(fix, /Run `code-review` only when the user requested independent review/);
  assert.doesNotMatch(skill("prove"), /## .*Attack your own diff/);
  assert.match(skill("code-review"), /When delegation is authorized for this review/);
});

test("language guidance remains available without a Ruby baseline", () => {
  const doctrine = read(resolve(catalog, "fstack/references/doctrine.md"));
  const template = read(resolve(catalog, "fstack/references/language-pack-template.md"));
  assert.match(doctrine, /Loading a language pack does not authorize/);
  for (const language of languages) {
    assert.doesNotMatch(skill(`coding-standards-${language}`), /^disable-model-invocation: true$/m);
  }
  assert.doesNotMatch(skill("coding-standards"), /^disable-model-invocation: true$/m);
  for (const content of [doctrine, template, ...["rust", "swift", "kotlin"].map((name) => skill(`coding-standards-${name}`))]) {
    assert.doesNotMatch(content, /Ruby default|Rails is the default taste|Hotwire Native first/);
  }
  assert.match(description(skill("coding-standards-javascript")), /not as universal guidance for Node/);
});

test("OpenCode command descriptions match their owning skills", () => {
  for (const name of ["fstack", "dig", "prove", "sketch", "code-review", ...["rust", "swift", "kotlin", "javascript"].map((language) => `coding-standards-${language}`)]) {
    const command = read(resolve(root, "stow/opencode/.config/opencode/commands", `${name}.md`));
    assert.equal(description(command), description(skill(name)), name);
  }
});

test("changed skill documents retain valid local reference links", () => {
  const paths = ["fstack/SKILL.md", "fstack/references/doctrine.md", ...workflows.map((name) => `${name}/SKILL.md`), "testing/SKILL.md", ...["rust", "swift", "kotlin", "javascript"].map((name) => `coding-standards-${name}/SKILL.md`)];
  for (const path of paths) {
    const absolute = resolve(catalog, path);
    for (const match of read(absolute).matchAll(/\]\(([^)]+)\)/g)) {
      const link = match[1];
      if (/^https?:|^#/.test(link)) continue;
      assert.ok(existsSync(resolve(dirname(absolute), link.split("#")[0])), `${path}: ${link}`);
    }
  }
});
