import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  buildSkillPage,
  findSkills,
  type LoadedSkill,
  readSkillPage,
  summarizeSkill,
} from "../stow/pi/.pi/agent/extensions/skills-manual/skill-pages.ts";

function withSkills(run: (home: string, skill: (name: string, frontmatter: string, body?: string) => LoadedSkill) => void) {
  const home = mkdtempSync(join(tmpdir(), "skill-pages-"));
  try {
    run(home, (name, frontmatter, body = "") => {
      const dir = join(home, ".agents/skills", name);
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, "SKILL.md"), `---\n${frontmatter}\n---\n${body}`);
      return { name, description: "from Pi", path: join(dir, "SKILL.md"), group: "User" };
    });
  } finally {
    rmSync(home, { recursive: true });
  }
}

test("reads plain, quoted, and folded descriptions, invocation flags, and sections", () => {
  withSkills((_home, skill) => {
    const tdd = readSkillPage(skill("tdd", "name: tdd\ndescription: Test-driven development.", "# TDD\n\n## Seams\n\n## Rules of the `loop`\n"));
    assert.equal(tdd?.description, "Test-driven development.");
    assert.equal(tdd?.userInvoked, false);
    assert.deepEqual(tdd?.sections, ["Seams", "Rules of the loop"]);
    const quiz = readSkillPage(skill("quiz-me", 'name: quiz-me\ndescription: "Quiz me, one question at a time."\ndisable-model-invocation: true\nargument-hint: "topic"'));
    assert.equal(quiz?.description, "Quiz me, one question at a time.");
    assert.equal(quiz?.userInvoked, true);
    assert.equal(quiz?.argumentHint, "topic");
    const folded = readSkillPage(skill("typesafe-ai", "name: typesafe-ai\ndescription: >\n  Build AI-powered software\n  with TypeSafe.\nmetadata:\n  owner: x"));
    assert.equal(folded?.description, "Build AI-powered software with TypeSafe.");
  });
});

test("returns undefined for a SKILL.md without frontmatter", () => {
  withSkills((home) => {
    mkdirSync(join(home, "broken"));
    writeFileSync(join(home, "broken/SKILL.md"), "no frontmatter");
    assert.equal(readSkillPage({ name: "broken", description: "", path: join(home, "broken/SKILL.md"), group: "User" }), undefined);
  });
});

test("builds a page with summary, invocation mode, sections, and per-harness usage", () => {
  withSkills((home, skill) => {
    const tdd = readSkillPage(skill("tdd", "name: tdd\ndescription: Test-driven development. Use when the user wants test-first work.", "## Seams\n"));
    assert.ok(tdd);
    const page = buildSkillPage(tdd, home);
    assert.match(page, /^# tdd\n\n> Test-driven development\.\n> Use when the user wants test-first work\.\n/);
    assert.match(page, /> Agents load it automatically/);
    assert.match(page, /> Covers: Seams\./);
    assert.match(page, /- Run it in Pi:\n\n`\/skill:tdd <request>`/);
    assert.match(page, /- Run it in Claude Code or OpenCode:\n\n`\/tdd <request>`/);
    assert.match(page, /`glow ~\/\.agents\/skills\/tdd\/SKILL\.md`/);

    const quiz = readSkillPage(skill("quiz-me", "name: quiz-me\ndescription: Quiz me.\ndisable-model-invocation: true\nargument-hint: topic"));
    assert.ok(quiz);
    const quizPage = buildSkillPage(quiz, home);
    assert.match(quizPage, /> Runs only when you type it\./);
    assert.match(quizPage, /`\/skill:quiz-me <topic>`/);
    assert.doesNotMatch(buildSkillPage({ ...quiz, group: "Pi packages" }, home), /Claude Code/);
  });
});

test("finds an exact name first, otherwise matches all words in names and descriptions", () => {
  const skills = [
    { name: "tdd", description: "Test-driven development." },
    { name: "coding-standards-rails", description: "Ruby on Rails coding standards." },
    { name: "anti-slop-rails", description: "Evidence-based Rails cleanup." },
  ];
  assert.deepEqual(findSkills(skills, "tdd").map((s) => s.name), ["tdd"]);
  assert.deepEqual(findSkills(skills, "RAILS").map((s) => s.name), ["coding-standards-rails", "anti-slop-rails"]);
  assert.deepEqual(findSkills(skills, "rails cleanup").map((s) => s.name), ["anti-slop-rails"]);
  assert.deepEqual(findSkills(skills, "nothing"), []);
});

test("summarizes with the first sentence, joining a too-short one with the next", () => {
  assert.equal(summarizeSkill("Test-driven development. Use when testing."), "Test-driven development.");
  assert.equal(summarizeSkill("Stop. That last message did not land. Re-pitch it."), "Stop. That last message did not land.");
});
