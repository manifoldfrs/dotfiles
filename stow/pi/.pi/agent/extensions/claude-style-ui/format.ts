import { homedir } from "node:os";

export function shortenPath(path: string): string {
  const home = homedir();
  return path.startsWith(home) ? `~${path.slice(home.length)}` : path;
}

export function countLines(text: string): number {
  const trimmed = text.replace(/\n+$/, "");
  return trimmed === "" ? 0 : trimmed.split("\n").length;
}

export function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return "<1s";
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.round((ms % 60_000) / 1000);
  return `${minutes}m ${seconds}s`;
}

export interface DiffStats {
  added: number;
  removed: number;
  hunks: number;
}

// Pi's display diff marks lines as "+12 text", "-12 text", " 12 text", and elided gaps as "    ...".
export function diffStats(displayDiff: string): DiffStats {
  let added = 0;
  let removed = 0;
  let hunks = 0;
  let inHunk = false;
  for (const line of displayDiff.split("\n")) {
    const changed = line.startsWith("+") || line.startsWith("-");
    if (line.startsWith("+")) added += 1;
    if (line.startsWith("-")) removed += 1;
    if (changed && !inHunk) hunks += 1;
    if (changed) inHunk = true;
    if (/^\s+\.\.\.\s*$/.test(line)) inHunk = false;
  }
  return { added, removed, hunks };
}

export const STAT_BAR_CELLS = 8;

// Split the bar between additions and removals, giving each side at least one cell when it is non-zero.
export function statBarCells(stats: DiffStats, cells = STAT_BAR_CELLS): { added: number; removed: number } {
  const total = stats.added + stats.removed;
  if (total === 0) return { added: 0, removed: 0 };
  let added = Math.round((stats.added / total) * cells);
  if (stats.added > 0) added = Math.max(1, added);
  if (stats.removed > 0) added = Math.min(cells - 1, added);
  return { added, removed: cells - added };
}

export function unorderedBulletToDisc(marker: string): string {
  return /^[-*+] /.test(marker) ? `◉ ${marker.slice(2)}` : marker;
}

// First string-valued argument, for summarizing calls to tools this extension does not know.
export function primaryArgument(args: unknown): string | undefined {
  if (!args || typeof args !== "object") return undefined;
  for (const value of Object.values(args as Record<string, unknown>)) {
    if (typeof value === "string" && value.trim() !== "") return value.split("\n")[0];
  }
  return undefined;
}

export function toolDisplayName(toolName: string): string {
  const base = toolName.replace(/^mcp__/, "").replace(/__/g, " · ");
  return base.charAt(0).toUpperCase() + base.slice(1);
}

// Porcelain lines that touch the work tree: untracked files and anything with a work-tree status.
export function countUnstaged(porcelain: string): number {
  if (porcelain === "") return 0;
  return porcelain.split("\n").filter((line) => line.startsWith("??") || line[1] !== " ").length;
}

export function formatTokens(count: number): string {
  if (count >= 1_000_000) return `${Math.round(count / 100_000) / 10}M`;
  if (count >= 1_000) return `${Math.round(count / 1_000)}k`;
  return `${count}`;
}

// Same thresholds as the Claude Code statusline.
export function contextPercentLevel(percent: number): "ok" | "warning" | "error" {
  if (percent >= 90) return "error";
  if (percent >= 75) return "warning";
  return "ok";
}

type CostEntry = { type: string; message?: { role: string; model?: string; usage?: { cost?: { total?: number } } } };

/** Session spend per model, from every assistant message, most expensive first. */
export function modelCosts(entries: readonly CostEntry[]): [string, number][] {
  const costs = new Map<string, number>();

  for (const entry of entries) {
    const message = entry.type === "message" ? entry.message : undefined;
    const usd = message?.role === "assistant" ? message.usage?.cost?.total : undefined;

    if (!message?.model || !usd) continue;

    costs.set(message.model, (costs.get(message.model) ?? 0) + usd);
  }

  return [...costs].sort((a, b) => b[1] - a[1]);
}

// The footer already names the active model, so a single cost stays unlabeled; labels only tell several apart.
export function formatCosts(costs: readonly [string, number][]): string | undefined {
  if (costs.length === 0) return undefined;

  const [only] = costs;

  if (costs.length === 1 && only) return `$${only[1].toFixed(2)}`;

  return costs.map(([model, usd]) => `${model.replace(/^claude-/, "")} $${usd.toFixed(2)}`).join(" · ");
}

const SHIMMER_SPEED_MS = 70;
const SHIMMER_RADIUS = 2.5;
const STALL_START_MS = 4_000;
const STALL_FULL_MS = 14_000;

/** How strongly the shimmer lights the character at `index` at time `elapsedMs`, from 0 to 1. */
export function shimmerIntensity(index: number, length: number, elapsedMs: number): number {
  const sweep = length + SHIMMER_RADIUS * 4;
  const center = ((elapsedMs / SHIMMER_SPEED_MS) % sweep) - SHIMMER_RADIUS * 2;
  return Math.max(0, 1 - Math.abs(index - center) / SHIMMER_RADIUS);
}

/** How far the spinner has turned toward the error color after the model went quiet, from 0 to 1. */
export function stallAmount(quietMs: number): number {
  if (quietMs <= STALL_START_MS) return 0;
  return Math.min(1, (quietMs - STALL_START_MS) / (STALL_FULL_MS - STALL_START_MS));
}

export type BylineParts = { readonly elapsedMs: number; readonly tokens: number; readonly thinking: boolean; readonly interruptKey: string };

export function byline(parts: BylineParts): string {
  const segments = [
    ...(parts.elapsedMs >= 1_000 ? [formatDuration(parts.elapsedMs)] : []),
    ...(parts.tokens > 0 ? [`↓ ${formatTokens(parts.tokens)} tokens`] : []),
    ...(parts.thinking ? ["thinking"] : []),
    `${parts.interruptKey} to interrupt`,
  ];
  return `(${segments.join(" · ")})`;
}
