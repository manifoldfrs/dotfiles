import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

const FRAMES = ["·", "✢", "✳", "✶", "✻", "✽", "✻", "✶", "✳", "✢"];
const FRAME_INTERVAL_MS = 120;

export const WORKING_VERBS = [
  "Baking",
  "Brewing",
  "Computing",
  "Conjuring",
  "Crafting",
  "Deliberating",
  "Distilling",
  "Forging",
  "Harmonizing",
  "Musing",
  "Noodling",
  "Percolating",
  "Pondering",
  "Puzzling",
  "Ruminating",
  "Simmering",
  "Synthesizing",
  "Tinkering",
  "Untangling",
  "Whittling",
];

function pickVerb(): string {
  return WORKING_VERBS[Math.floor(Math.random() * WORKING_VERBS.length)] ?? "Working";
}

function applyIndicator(ctx: ExtensionContext): void {
  if (!ctx.hasUI) return;
  const theme = ctx.ui.theme;
  ctx.ui.setWorkingIndicator({
    frames: FRAMES.map((frame) => theme.fg("accent", frame)),
    intervalMs: FRAME_INTERVAL_MS,
  });
}

export function registerSpinner(pi: ExtensionAPI): void {
  pi.on("session_start", (_event, ctx) => {
    applyIndicator(ctx);
  });

  pi.on("agent_start", (_event, ctx) => {
    if (ctx.hasUI) ctx.ui.setWorkingMessage(`${pickVerb()}…`);
  });

  pi.on("agent_end", (_event, ctx) => {
    if (ctx.hasUI) ctx.ui.setWorkingMessage(undefined);
  });
}
