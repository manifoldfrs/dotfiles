import type {
  EditToolDetails,
  ExtensionAPI,
  Theme,
  ToolRenderResultOptions,
  ToolRenderers,
} from "@earendil-works/pi-coding-agent";
import { keyHint, renderDiff } from "@earendil-works/pi-coding-agent";
import type { Component } from "@earendil-works/pi-tui";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";
import {
  countLines,
  diffStats,
  formatDuration,
  plural,
  primaryArgument,
  shortenPath,
  statBarCells,
  toolDisplayName,
} from "./format.ts";
import { GutterText, Indented, Rows, Stack } from "./rows.ts";

type Args = Record<string, unknown>;
type Result = { content: Array<{ type: string; text?: string }>; details?: unknown };
type Context = Parameters<NonNullable<ToolRenderers["renderCall"]>>[2];

function asArgs(args: unknown): Args {
  return args && typeof args === "object" ? (args as Args) : {};
}

const BASH_PREVIEW_LINES = 3;
const DIFF_PREVIEW_LINES = 12;

function pad(context: Context): string {
  return " ".repeat(context.outputPad);
}

function statusDot(theme: Theme, context: Context): string {
  if (context.isError) return theme.fg("error", "●");
  if (!context.executionStarted || context.isPartial || context.durationMs === undefined) {
    return theme.fg("dim", "●");
  }
  return theme.fg("success", "●");
}

function callRow(name: string, target: string, theme: Theme, context: Context): Component {
  const title = theme.bold(theme.fg("text", name));
  const detail = target ? ` ${theme.fg("accent", target)}` : "";
  const duration = context.durationMs !== undefined && context.durationMs >= 1000
    ? theme.fg("dim", formatDuration(context.durationMs))
    : undefined;
  return new Rows([{ left: `${pad(context)}${statusDot(theme, context)} ${title}${detail}`, ...(duration ? { right: duration } : {}) }]);
}

function resultText(result: Result): string {
  return result.content
    .filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text)
    .join("\n");
}

function gutter(context: Context, theme: Theme, connector: "└" | "├" | "│"): string {
  return `${pad(context)}  ${theme.fg("borderMuted", connector)} `;
}

function blankGutter(context: Context): string {
  return `${pad(context)}    `;
}

function summaryRow(summary: string, theme: Theme, context: Context): Component {
  return new Rows([{ left: `${gutter(context, theme, "└")}${summary}` }]);
}

function expandHint(theme: Theme): string {
  return theme.fg("dim", `(${keyHint("app.tools.expand", "to expand")})`);
}

function outputBlock(text: string, maxLines: number | undefined, theme: Theme, context: Context): Component {
  const lines = text.replace(/\n+$/, "").split("\n");
  const shown = maxLines === undefined ? lines : lines.slice(0, maxLines);
  const styled = shown.map((line) => theme.fg(context.isError ? "error" : "toolOutput", line));
  const hidden = lines.length - shown.length;
  if (hidden > 0) styled.push(`${theme.fg("dim", `… +${plural(hidden, "line")}`)} ${expandHint(theme)}`);
  return new GutterText(styled, gutter(context, theme, "└"), blankGutter(context));
}

function errorBlock(result: Result, theme: Theme, context: Context): Component {
  const text = resultText(result).trim() || "Failed";
  const lines = text.split("\n").slice(0, 6).map((line) => theme.fg("error", line));
  return new GutterText(lines, gutter(context, theme, "└"), blankGutter(context));
}

function pathTarget(args: Args): string {
  return typeof args.path === "string" ? shortenPath(args.path) : "";
}

function readTarget(args: Args): string {
  const path = pathTarget(args);
  const offset = typeof args.offset === "number" ? args.offset : undefined;
  const limit = typeof args.limit === "number" ? args.limit : undefined;
  if (offset === undefined && limit === undefined) return path;
  const start = offset ?? 1;
  return limit === undefined ? `${path}:${start}` : `${path}:${start}-${start + limit - 1}`;
}

function quoted(value: unknown): string {
  return typeof value === "string" ? `"${value}"` : "";
}

function searchTarget(args: Args): string {
  const pattern = quoted(args.pattern);
  const where = typeof args.path === "string" ? ` in ${shortenPath(args.path)}` : "";
  const glob = typeof args.glob === "string" ? ` (${args.glob})` : "";
  return `${pattern}${where}${glob}`;
}

function listResult(noun: string) {
  return (result: Result, options: ToolRenderResultOptions, theme: Theme, context: Context): Component => {
    if (context.isError) return errorBlock(result, theme, context);
    const text = resultText(result).trim();
    const count = text === "" || /^no (files|matches)/i.test(text) ? 0 : countLines(text);
    const summary = theme.fg("muted", count === 0 ? `No ${noun}s` : plural(count, noun));
    if (!options.expanded || count === 0) {
      return summaryRow(count > 0 ? `${summary} ${expandHint(theme)}` : summary, theme, context);
    }
    return new Stack([summaryRow(summary, theme, context), outputBlock(text, undefined, theme, context)]);
  };
}

function diffLine(line: string, theme: Theme, width: number): string {
  const plain = line.replace(/\x1b\[[0-9;]*m/g, "");
  const fitted = truncateToWidth(line, width, "");
  const padded = `${fitted}${" ".repeat(Math.max(0, width - visibleWidth(fitted)))}`;
  if (plain.startsWith("+")) return theme.bg("toolSuccessBg", padded);
  if (plain.startsWith("-")) return theme.bg("toolErrorBg", padded);
  return padded;
}

class DiffBody implements Component {
  constructor(
    private readonly lines: string[],
    private readonly theme: Theme,
    private readonly context: Context,
  ) {}

  render(width: number): string[] {
    const prefix = gutter(this.context, this.theme, "│");
    const available = Math.max(1, width - visibleWidth(prefix));
    return this.lines.map((line) => `${prefix}${diffLine(line, this.theme, available)}`);
  }

  invalidate(): void {}
}

function editResult(result: Result, options: ToolRenderResultOptions, theme: Theme, context: Context): Component {
  if (context.isError) return errorBlock(result, theme, context);
  const details = result.details as EditToolDetails | undefined;
  if (!details?.diff) return summaryRow(theme.fg("muted", "Edited"), theme, context);

  const stats = diffStats(details.diff);
  const cells = statBarCells(stats);
  const bar = `[${theme.fg("toolDiffAdded", "━".repeat(cells.added))}${theme.fg("toolDiffRemoved", "━".repeat(cells.removed))}]`;
  const where = details.firstChangedLine !== undefined ? theme.fg("dim", ` at line ${details.firstChangedLine}`) : "";
  const header = `${theme.fg("toolDiffAdded", `+${stats.added}`)} ${theme.fg("toolDiffRemoved", `-${stats.removed}`)} ${bar}${where}`;

  const rendered = renderDiff(details.diff).split("\n");
  const shown = options.expanded ? rendered : rendered.slice(0, DIFF_PREVIEW_LINES);
  const hidden = rendered.length - shown.length;
  const footer = hidden > 0
    ? `${theme.fg("dim", `… +${plural(hidden, "line")}`)} ${expandHint(theme)}`
    : theme.fg("dim", plural(stats.hunks, "hunk"));

  return new Stack([
    new Rows([{ left: `${gutter(context, theme, "├")}${header}` }]),
    new DiffBody(shown, theme, context),
    summaryRow(footer, theme, context),
  ]);
}

const BUILT_IN_RENDERERS: Record<string, ToolRenderers> = {
  read: {
    renderShell: "self",
    renderCall: (args, theme, context) => callRow("Read", readTarget(asArgs(args)), theme, context),
    renderResult: (result, options, theme, context) => {
      if (context.isError) return errorBlock(result, theme, context);
      const text = resultText(result);
      const summary = theme.fg("muted", `Read ${plural(countLines(text), "line")}`);
      if (!options.expanded) return summaryRow(`${summary} ${expandHint(theme)}`, theme, context);
      return new Stack([summaryRow(summary, theme, context), outputBlock(text, undefined, theme, context)]);
    },
  },
  bash: {
    renderShell: "self",
    renderCall: (args, theme, context) => {
      const { command } = asArgs(args);
      const firstLine = typeof command === "string" ? command.split("\n")[0] ?? "" : "";
      return callRow("Bash", firstLine, theme, context);
    },
    renderResult: (result, options, theme, context) => {
      if (options.isPartial && resultText(result).trim() === "") return new Rows([]);
      const text = resultText(result);
      if (text.trim() === "") return summaryRow(theme.fg("dim", "(no output)"), theme, context);
      return outputBlock(text, options.expanded ? undefined : BASH_PREVIEW_LINES, theme, context);
    },
  },
  edit: {
    renderShell: "self",
    renderCall: (args, theme, context) => callRow("Edit", pathTarget(asArgs(args)), theme, context),
    renderResult: editResult,
  },
  write: {
    renderShell: "self",
    renderCall: (args, theme, context) => callRow("Write", pathTarget(asArgs(args)), theme, context),
    renderResult: (result, options, theme, context) => {
      if (context.isError) return errorBlock(result, theme, context);
      const { content: written } = asArgs(context.args);
      const content = typeof written === "string" ? written : "";
      const summary = theme.fg("muted", `Wrote ${plural(countLines(content), "line")}`);
      if (!options.expanded || content === "") return summaryRow(summary, theme, context);
      return new Stack([summaryRow(summary, theme, context), outputBlock(content, undefined, theme, context)]);
    },
  },
  grep: {
    renderShell: "self",
    renderCall: (args, theme, context) => callRow("Search", searchTarget(asArgs(args)), theme, context),
    renderResult: listResult("match"),
  },
  find: {
    renderShell: "self",
    renderCall: (args, theme, context) => callRow("Find", searchTarget(asArgs(args)), theme, context),
    renderResult: listResult("file"),
  },
  ls: {
    renderShell: "self",
    renderCall: (args, theme, context) => callRow("List", pathTarget(asArgs(args)) || ".", theme, context),
    renderResult: listResult("entry"),
  },
};

// Renderers such as codemode's reuse context.lastComponent, so hand back their own component, not the wrapper.
function unwrapped(context: Context): Context {
  const last = context.lastComponent;
  return last instanceof Indented ? { ...context, lastComponent: last.inner } : context;
}

// Other tools keep their own call and result components, drawn in the same dot-and-gutter rows.
function wrapOtherTool(toolName: string, base: ToolRenderers | undefined): ToolRenderers {
  const baseCall = base?.renderCall;
  const baseResult = base?.renderResult;
  return {
    renderShell: "self",
    renderCall: (args, theme, context) => {
      const target = primaryArgument(args) ?? "";
      if (!baseCall) return callRow(toolDisplayName(toolName), target, theme, context);
      return new Indented(baseCall(args, theme, unwrapped(context)), `${pad(context)}${statusDot(theme, context)} `, `${pad(context)}  `);
    },
    renderResult: (result, options, theme, context) => {
      if (baseResult) {
        return new Indented(baseResult(result, options, theme, unwrapped(context)), gutter(context, theme, "└"), blankGutter(context));
      }
      if (context.isError) return errorBlock(result, theme, context);
      const text = resultText(result);
      if (text.trim() === "") return summaryRow(theme.fg("dim", "Done"), theme, context);
      return outputBlock(text, options.expanded ? undefined : BASH_PREVIEW_LINES, theme, context);
    },
  };
}

export function registerToolRows(pi: ExtensionAPI): void {
  pi.registerToolRenderer((toolName, next) => {
    const builtIn = BUILT_IN_RENDERERS[toolName];
    if (builtIn) return builtIn;
    const base = next();
    if (base?.renderShell === "self") return base;
    return wrapOtherTool(toolName, base);
  });
}
