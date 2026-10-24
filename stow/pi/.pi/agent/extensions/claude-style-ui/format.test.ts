import assert from "node:assert/strict";
import { test } from "node:test";
import {
  contextPercentLevel,
  countLines,
  countUnstaged,
  diffStats,
  formatDuration,
  formatTokens,
  primaryArgument,
  statBarCells,
  toolDisplayName,
  unorderedBulletToDisc,
} from "./format.ts";

test("counts lines without the trailing newline", () => {
  assert.equal(countLines(""), 0);
  assert.equal(countLines("a\nb\n"), 2);
  assert.equal(countLines("a\n\nb"), 3);
});

test("formats durations the way the tool rows show them", () => {
  assert.equal(formatDuration(300), "<1s");
  assert.equal(formatDuration(4_400), "4s");
  assert.equal(formatDuration(125_000), "2m 5s");
});

test("counts additions, removals, and hunks in Pi's display diff", () => {
  const diff = [" 1 export function greet() {", "-2   return 1;", "+2   return 2;", "     ...", "-9 old", "+9 new", "+10 more"].join("\n");
  assert.deepEqual(diffStats(diff), { added: 3, removed: 2, hunks: 2 });
});

test("gives each non-zero side of the stat bar at least one cell", () => {
  assert.deepEqual(statBarCells({ added: 1, removed: 1, hunks: 1 }), { added: 4, removed: 4 });
  assert.deepEqual(statBarCells({ added: 100, removed: 1, hunks: 1 }), { added: 7, removed: 1 });
  assert.deepEqual(statBarCells({ added: 1, removed: 100, hunks: 1 }), { added: 1, removed: 7 });
  assert.deepEqual(statBarCells({ added: 0, removed: 3, hunks: 1 }), { added: 0, removed: 8 });
  assert.deepEqual(statBarCells({ added: 0, removed: 0, hunks: 0 }), { added: 0, removed: 0 });
});

test("turns unordered list markers into discs and leaves ordered ones alone", () => {
  assert.equal(unorderedBulletToDisc("- "), "◉ ");
  assert.equal(unorderedBulletToDisc("- [x] "), "◉ [x] ");
  assert.equal(unorderedBulletToDisc("1. "), "1. ");
});

test("summarizes unknown tool calls by their first string argument", () => {
  assert.equal(primaryArgument({ count: 2, query: "pi themes\nsecond line" }), "pi themes");
  assert.equal(primaryArgument({ count: 2 }), undefined);
  assert.equal(toolDisplayName("mcp__exa__web_search_exa"), "Exa · web_search_exa");
  assert.equal(toolDisplayName("codemode"), "Codemode");
});

test("counts unstaged and untracked files like the Claude Code statusline", () => {
  assert.equal(countUnstaged(""), 0);
  assert.equal(countUnstaged(["M  staged.ts", " M edited.ts", "MM both.ts", "?? new.ts"].join("\n")), 3);
});

test("formats token counts and flags a filling context window", () => {
  assert.equal(formatTokens(950), "950");
  assert.equal(formatTokens(272_000), "272k");
  assert.equal(formatTokens(1_000_000), "1M");
  assert.equal(contextPercentLevel(74), "ok");
  assert.equal(contextPercentLevel(75), "warning");
  assert.equal(contextPercentLevel(90), "error");
});
