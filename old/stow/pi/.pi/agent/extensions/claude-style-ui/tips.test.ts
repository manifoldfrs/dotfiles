import assert from "node:assert/strict";
import { test } from "node:test";
import { BackgroundAgents } from "./agents.ts";
import { byline, shimmerIntensity, stallAmount } from "./format.ts";
import { mentionedIds, relevantIds, TipDeck, tipsFromCommands } from "./tips.ts";

const commands = [
  { name: "lg", description: "Summarize unstaged Git changes with per-file counts. Use when the user says lg.", source: "extension" },
  { name: "skill:diagnosing-bugs", description: "Diagnosis loop for hard bugs.", source: "skill" },
  { name: "skill:quiet", source: "skill" },
  { name: "lg", description: "A duplicate from another package.", source: "prompt" },
  { name: "run", description: "Run one subagent.", source: "extension", sourceInfo: { origin: "package" } },
];

test("turns your own commands and skills into one-sentence tips invoked as /name", () => {
  assert.deepEqual(tipsFromCommands(commands), [
    { id: "lg", text: "/lg · Summarize unstaged Git changes with per-file counts." },
    { id: "diagnosing-bugs", text: "/diagnosing-bugs · Diagnosis loop for hard bugs." },
  ]);
});

test("keeps only reranked tips that clear the relevance bar, best first", () => {
  const result = { ranked: [{ id: "diagnosing-bugs", relevance: 0.9 }, { id: "lg", relevance: 0.51 }, { id: "x", relevance: 0.2 }] };
  assert.deepEqual(relevantIds(result), ["diagnosing-bugs", "lg"]);
  assert.deepEqual(relevantIds("not json"), []);
});

test("skips tips for commands the prompt already uses", () => {
  const tips = tipsFromCommands(commands);
  assert.deepEqual([...mentionedIds("/diagnosing-bugs why does login flake?", tips)], ["diagnosing-bugs"]);
  assert.deepEqual([...mentionedIds("check /tmp/lg.txt and /lgtm", tips)], []);
});

test("shows relevant tips first, then rotates through the rest", () => {
  const deck = new TipDeck();
  const tips = tipsFromCommands(commands);
  deck.reset(tips);
  deck.promote(["diagnosing-bugs"]);

  const first = deck.current();
  assert.equal(first?.id, "diagnosing-bugs");
  assert.equal(first && deck.isRelevant(first), true);
  deck.advance();
  assert.equal(deck.current()?.id, "lg");
  deck.advance();
  assert.equal(deck.current()?.id, "diagnosing-bugs");
});

test("an empty deck has no tip", () => {
  const deck = new TipDeck();
  deck.reset([]);
  assert.equal(deck.current(), undefined);
});

test("the byline grows from the interrupt hint to time, tokens, and thinking", () => {
  assert.equal(byline({ elapsedMs: 400, tokens: 0, thinking: false, interruptKey: "esc" }), "(esc to interrupt)");
  assert.equal(byline({ elapsedMs: 72_000, tokens: 3_400, thinking: true, interruptKey: "esc" }), "(1m 12s · ↓ 3k tokens · thinking · esc to interrupt)");
});

test("the shimmer lights one moving band of the verb", () => {
  const lit = (elapsedMs: number) => [...Array(10).keys()].map((index) => shimmerIntensity(index, 10, elapsedMs)).findIndex((value) => value === 1);
  assert.ok(lit(700) >= 0 && lit(700) < lit(840));
  assert.ok(Array.from({ length: 10 }, (_, index) => shimmerIntensity(index, 10, 700)).filter((value) => value > 0).length <= 5);
});

test("the spinner reddens only after the model has been quiet for a while", () => {
  assert.equal(stallAmount(1_000), 0);
  assert.ok(stallAmount(9_000) > 0 && stallAmount(9_000) < 1);
  assert.equal(stallAmount(60_000), 1);
});

test("counts background agents but not workflow coordinators", () => {
  const agents = new BackgroundAgents();
  agents.started({ id: "a", mode: "single" });
  agents.started({ id: "w", mode: "workflow" });
  agents.started({ id: "b" });
  agents.started({ mode: "single" });
  assert.equal(agents.count(), 2);
  agents.completed({ runId: "a", id: "other" });
  agents.completed({ id: "b" });
  assert.equal(agents.count(), 0);
});
