// The π drawn in its own digits, animated the way pi-cc-header and pi.dev's install.sh draw their logo:
// the left leg, the bar, then the right leg drop into place, the whole π flashes twice, then it settles.

export const ART = [
  "       3.141592653589793238462643383279",
  "      5028841971693993751058209749445923",
  "     07816406286208998628034825342117067",
  "     9821    48086         5132",
  "    823      06647        09384",
  "   46        09550        58223",
  "             1725         3594",
  "            08128        48111",
  "           74502         84102",
  "          70193          85211        05",
  "        5596446           22948954930381",
  "       9644288             10975665933",
];
export const ART_WIDTH = Math.max(...ART.map((line) => line.length));

export type Piece = "top" | "left" | "right";

// Below the bar, the curl left of column 10 belongs to the bar and column 22 splits the legs.
const CURL_END = 10;
const LEG_SPLIT = 22;
const BAR_ROWS = 3;
const CURL_ROWS = 6;

export function pieceAt(row: number, column: number): Piece {
  if (row < BAR_ROWS || (row < CURL_ROWS && column < CURL_END)) return "top";
  return column < LEG_SPLIT ? "left" : "right";
}

// Same order and fall distances as pi-cc-header's frames.
const DROPS: readonly { readonly piece: Piece; readonly frames: number }[] = [
  { piece: "left", frames: 4 },
  { piece: "top", frames: 3 },
  { piece: "right", frames: 5 },
];
const DROP_FRAMES = DROPS.reduce((sum, drop) => sum + drop.frames, 0);
const FLASH_FRAMES = [true, false, true, false];

export const FINAL_FRAME = DROP_FRAMES + FLASH_FRAMES.length;

/** How many rows above its place a piece is at `frame`, or undefined before it appears. */
export function dropOffset(piece: Piece, frame: number): number | undefined {
  let start = 0;

  for (const drop of DROPS) {
    if (drop.piece === piece) {
      const step = frame - start;
      if (step < 0) return undefined;
      return Math.max(0, drop.frames - 1 - step);
    }
    start += drop.frames;
  }

  return 0;
}

export function isFlashing(frame: number): boolean {
  return FLASH_FRAMES[frame - DROP_FRAMES] ?? false;
}

/** A digit on screen; `row` is where it rests in the finished art, which decides its color. */
export type ArtCell = { readonly char: string; readonly row: number };

export function artFrame(frame: number): (ArtCell | undefined)[][] {
  const grid: (ArtCell | undefined)[][] = ART.map(() => Array<ArtCell | undefined>(ART_WIDTH).fill(undefined));
  const place = (falling: boolean) =>
    ART.forEach((line, row) => {
      [...line].forEach((char, column) => {
        const offset = char === " " ? undefined : dropOffset(pieceAt(row, column), frame);
        if (offset === undefined || (offset > 0) !== falling) return;
        const target = grid[row - offset];
        if (target && !target[column]) target[column] = { char, row };
      });
    });

  // Landed pieces go first, so a falling piece passes behind them instead of over their digits.
  place(false);
  place(true);
  return grid;
}
