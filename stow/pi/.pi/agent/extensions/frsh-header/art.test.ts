import assert from "node:assert/strict";
import { test } from "node:test";
import { ART, artFrame, dropOffset, FINAL_FRAME, isFlashing, pieceAt } from "./art.ts";

const text = (frame: number) => artFrame(frame).map((cells) => cells.map((cell) => cell?.char ?? " ").join("").trimEnd());

test("splits the π into its bar, left leg, and right leg", () => {
  assert.equal(pieceAt(0, 20), "top");
  assert.equal(pieceAt(4, 5), "top");
  assert.equal(pieceAt(7, 14), "left");
  assert.equal(pieceAt(7, 27), "right");
});

test("drops the left leg, then the bar, then the right leg", () => {
  assert.equal(dropOffset("left", 0), 3);
  assert.equal(dropOffset("top", 0), undefined);
  assert.equal(dropOffset("left", 3), 0);
  assert.equal(dropOffset("top", 4), 2);
  assert.equal(dropOffset("right", 6), undefined);
  assert.equal(dropOffset("right", 7), 4);
});

test("the first frame shows only the falling left leg", () => {
  assert.ok(text(0).every((line) => line.length <= 21));
  assert.ok(text(0).some((line) => line.trim() !== ""));
});

test("a falling piece passes behind the pieces that already landed", () => {
  const bar = ART.slice(0, 3).map((line) => line.trimEnd());
  for (let frame = 0; frame <= FINAL_FRAME; frame += 1) {
    if (dropOffset("top", frame) !== 0) continue;
    text(frame).slice(0, 3).forEach((line, row) => assert.ok(line.startsWith(bar[row] ?? ""), `frame ${frame} row ${row}`));
  }
});

test("flashes twice after the last piece lands, then rests as the original art", () => {
  const flashes = Array.from({ length: FINAL_FRAME + 2 }, (_, frame) => isFlashing(frame)).filter(Boolean);
  assert.equal(flashes.length, 2);
  assert.equal(isFlashing(FINAL_FRAME), false);
  assert.deepEqual(text(FINAL_FRAME), ART.map((line) => line.trimEnd()));
});
