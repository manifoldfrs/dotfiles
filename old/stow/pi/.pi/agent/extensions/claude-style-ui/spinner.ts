import type { ExtensionAPI, ExtensionContext, Theme } from "@earendil-works/pi-coding-agent";
import { keyText } from "@earendil-works/pi-coding-agent";
import type { Color } from "@earendil-works/pi-tui";
import { mixColors, Text } from "@earendil-works/pi-tui";
import { callJev } from "../jev-guardrails/jev-mcp.ts";
import { byline, formatDuration, shimmerIntensity, stallAmount } from "./format.ts";
import { mentionedIds, relevantIds, RELEVANT_TOP_K, rerankQuery, TipDeck, tipsFromCommands, type Tip } from "./tips.ts";

const FRAMES = ["·", "✢", "✳", "✶", "✻", "✽", "✻", "✶", "✳", "✢"];
const FRAME_MS = 120;
const TICK_MS = 60;
const TIP_DELAY_MS = 2_500;
const TIP_ROTATE_MS = 9_000;
const CHARS_PER_TOKEN = 4;
const RECAP_MIN_MS = 3_000;
const RECAP_ENTRY = "claude-style-ui:recap";

export const WORKING_VERBS = [
  "Accomplishing", "Actualizing", "Approximating", "Architecting", "Baking", "Beaming", "Befuddling", "Billowing",
  "Bloviating", "Boondoggling", "Brewing", "Burrowing", "Calculating", "Canoodling", "Caramelizing", "Cascading",
  "Catapulting", "Cerebrating", "Channeling", "Choreographing", "Churning", "Circumnavigating", "Coalescing",
  "Cogitating", "Combobulating", "Composing", "Computing", "Concocting", "Conjuring", "Considering", "Contemplating",
  "Converging", "Cooking", "Crafting", "Crunching", "Crystallizing", "Cultivating", "Deciphering", "Deliberating",
  "Dilly-dallying", "Discombobulating", "Distilling", "Doodling", "Effecting", "Elucidating", "Embellishing",
  "Enchanting", "Envisioning", "Fermenting", "Fiddle-faddling", "Finagling", "Flibbertigibbeting", "Flummoxing",
  "Forging", "Frolicking", "Gallivanting", "Generating", "Germinating", "Grooving", "Harmonizing", "Hashing",
  "Hatching", "Hullaballooing", "Hyperspacing", "Ideating", "Imagining", "Improvising", "Incubating", "Inferring",
  "Infusing", "Integrating", "Irrationalizing", "Jitterbugging", "Kneading", "Lollygagging", "Manifesting",
  "Marinating", "Meandering", "Metamorphosing", "Moseying", "Mulling", "Musing", "Mustering", "Nebulizing",
  "Noodling", "Orbiting", "Orchestrating", "Percolating", "Perusing", "Philosophising", "Pondering", "Pontificating",
  "Proofing", "Puttering", "Puzzling", "Quantumizing", "Radiating", "Recombobulating", "Reticulating", "Revolving",
  "Ruminating", "Sautéing", "Scheming", "Schlepping", "Shimmying", "Shucking", "Simmering", "Skedaddling",
  "Smooshing", "Spelunking", "Spinning", "Stewing", "Sussing", "Swirling", "Synthesizing", "Tangenting",
  "Thinking", "Tinkering", "Tomfoolering", "Transcending", "Transmuting", "Twirling", "Undulating", "Unfurling",
  "Unravelling", "Untangling", "Vibing", "Waddling", "Wandering", "Whatchamacalliting", "Whirring", "Whittling",
  "Wibbling", "Wrangling", "Zigzagging",
];

export const RECAP_VERBS = [
  "Baked", "Brewed", "Churned", "Cogitated", "Concocted", "Converged", "Cooked", "Crunched", "Distilled", "Forged",
  "Marinated", "Mulled", "Noodled", "Orbited", "Percolated", "Pondered", "Sautéed", "Simmered", "Stewed", "Whittled",
];

function pick(words: readonly string[]): string {
  return words[Math.floor(Math.random() * words.length)] ?? "Working";
}

type Run = {
  readonly verb: string;
  readonly startedAt: number;
  readonly deck: TipDeck;
  finishedTokens: number;
  streamingChars: number;
  lastActivityAt: number;
  thinking: boolean;
  toolsRunning: number;
  tipShownAt: number | undefined;
};

function colorText(theme: Theme, text: string, color: (index: number) => Color): string {
  return [...text].map((char, index) => theme.style(char, { fg: color(index) })).join("");
}

function statusText(run: Run, theme: Theme, now: number): string {
  const elapsed = now - run.startedAt;
  const quiet = run.toolsRunning > 0 ? 0 : now - run.lastActivityAt;
  const base = mixColors(theme.colors.accent, theme.colors.error, stallAmount(quiet));
  const glow = theme.colors.text;
  const frame = FRAMES[Math.floor(elapsed / FRAME_MS) % FRAMES.length] ?? "·";
  const label = `${run.verb}…`;
  const verb = colorText(theme, label, (index) => mixColors(base, glow, shimmerIntensity(index, label.length, elapsed) * 0.75));
  const tokens = run.finishedTokens + Math.round(run.streamingChars / CHARS_PER_TOKEN);
  const details = byline({ elapsedMs: elapsed, tokens, thinking: run.thinking, interruptKey: keyText("app.interrupt").replace(/^escape$/, "esc") });
  const line = `${theme.style(frame, { fg: base })} ${verb} ${theme.fg("dim", details)}`;
  const tip = tipText(run, theme, now);

  return tip ? `${line}\n${tip}` : line;
}

function tipText(run: Run, theme: Theme, now: number): string | undefined {
  if (now - run.startedAt < TIP_DELAY_MS) return undefined;

  if (run.tipShownAt === undefined) run.tipShownAt = now;
  if (now - run.tipShownAt >= TIP_ROTATE_MS) {
    run.deck.advance();
    run.tipShownAt = now;
  }

  const tip = run.deck.current();
  if (!tip) return undefined;

  const label = run.deck.isRelevant(tip) ? theme.fg("borderAccent", "Try ") : theme.fg("dim", "Tip: ");
  return `  ${theme.fg("dim", "⎿")}  ${label}${theme.fg("dim", tip.text)}`;
}

/** Asks Jev which tips fit the prompt; any failure leaves the random order in place. */
async function rankTips(prompt: string, tips: readonly Tip[]): Promise<string[]> {
  if (tips.length === 0 || prompt.trim() === "") return [];

  const candidates = tips.map((tip) => ({ id: tip.id, text: tip.text }));

  try {
    return relevantIds(await callJev("jev_rerank", { query: rerankQuery(prompt), candidates, top_k: RELEVANT_TOP_K }));
  } catch {
    return [];
  }
}

function streamedChars(event: { readonly type: string; readonly delta?: unknown }): number {
  return typeof event.delta === "string" ? event.delta.length : 0;
}

export function registerSpinner(pi: ExtensionAPI): void {
  let run: Run | undefined;
  let timer: NodeJS.Timeout | undefined;
  let pendingPrompt = "";

  const paint = (ctx: ExtensionContext) => {
    if (run) ctx.ui.setWorkingMessage(statusText(run, ctx.ui.theme, Date.now()));
  };

  const stop = () => {
    if (timer) clearInterval(timer);
    timer = undefined;
  };

  const start = (ctx: ExtensionContext) => {
    const deck = new TipDeck();
    const tips = tipsFromCommands(pi.getCommands());
    const now = Date.now();
    const prompt = pendingPrompt;

    deck.reset(tips, mentionedIds(prompt, tips));
    run = { verb: pick(WORKING_VERBS), startedAt: now, deck, finishedTokens: 0, streamingChars: 0, lastActivityAt: now, thinking: false, toolsRunning: 0, tipShownAt: undefined };

    const current = run;
    void rankTips(prompt, tips).then((ids) => {
      if (run === current && ids.length > 0) deck.promote(ids);
    });

    stop();
    timer = setInterval(() => paint(ctx), TICK_MS);
    timer.unref();
    paint(ctx);
  };

  pi.on("session_start", (_event, ctx) => {
    if (!ctx.hasUI) return;
    // The verb, glyph, and byline are drawn in the message so they can share one changing color.
    ctx.ui.setWorkingIndicator({ frames: [] });
  });

  pi.on("before_agent_start", (event) => {
    if (event.messageType === "user") pendingPrompt = event.prompt;
  });

  pi.on("agent_start", (_event, ctx) => {
    if (ctx.hasUI && !run) start(ctx);
  });

  pi.on("message_update", (event) => {
    if (!run) return;
    const update = event.assistantMessageEvent;
    run.streamingChars += streamedChars(update);
    run.lastActivityAt = Date.now();
    if (update.type.startsWith("thinking")) run.thinking = update.type !== "thinking_end";
    if (update.type.startsWith("text") || update.type.startsWith("toolcall")) run.thinking = false;
  });

  pi.on("message_end", (event) => {
    if (!run || event.message.role !== "assistant") return;
    run.finishedTokens += event.message.usage.output || Math.round(run.streamingChars / CHARS_PER_TOKEN);
    run.streamingChars = 0;
    run.thinking = false;
    run.lastActivityAt = Date.now();
  });

  pi.on("tool_execution_start", () => {
    if (run) run.toolsRunning += 1;
  });

  pi.on("tool_execution_end", () => {
    if (!run) return;
    run.toolsRunning = Math.max(0, run.toolsRunning - 1);
    run.lastActivityAt = Date.now();
  });

  pi.on("agent_settled", (event, ctx) => {
    const finished = run;
    run = undefined;
    pendingPrompt = "";
    stop();
    if (ctx.hasUI) ctx.ui.setWorkingMessage(undefined);
    if (!finished) return;

    const elapsedMs = Date.now() - finished.startedAt;
    if (elapsedMs >= RECAP_MIN_MS) pi.appendEntry(RECAP_ENTRY, { verb: event.aborted ? "Interrupted after" : `${pick(RECAP_VERBS)} for`, elapsedMs });
  });

  pi.on("session_shutdown", () => {
    run = undefined;
    stop();
  });

  pi.registerEntryRenderer(RECAP_ENTRY, (entry, _options, theme) => {
    const data = entry.data as { verb?: string; elapsedMs?: number } | undefined;
    const text = `✻ ${data?.verb ?? "Worked for"} ${formatDuration(data?.elapsedMs ?? 0)}`;
    return new Text(theme.fg("dim", text), 1, 0);
  });
}
