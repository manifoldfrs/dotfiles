import type { ExtensionAPI, Theme } from "@earendil-works/pi-coding-agent";
import { keyText } from "@earendil-works/pi-coding-agent";
import { truncateToWidth, visibleWidth, wrapTextWithAnsi } from "@earendil-works/pi-tui";
import { Type } from "typebox";
import { Value } from "typebox/value";

const summaryPacket = Type.Object({ stats: Type.String(), handled: Type.Boolean() });

const panels = {
  ready: ["◈ READY", "muted"],
  working: ["◈ MODEL WORKING", "toolTitle"],
  tool: ["◈ TOOL RUNNING", "toolTitle"],
  done: ["✓ DONE", "success"],
  failed: ["× FAILED", "error"],
  cancelled: ["× CANCELLED", "warning"],
} as const;

type Panel = keyof typeof panels;

type Run = {
  tools: Set<string>;
  outcome?: "completed" | "aborted" | "error";
};

function panelLines(theme: Theme, width: number, panel: Panel, summary: string | undefined): string[] {
  const [label, color] = panels[panel];
  const status = theme.bold(theme.fg(color, label));
  const active = panel === "working" || panel === "tool";
  const hint = active ? theme.fg("muted", `  ${keyText("app.interrupt")} to cancel`) : "";

  if (width < 6) return [truncateToWidth(status, width)];

  const trailing = !active && summary ? `${theme.fg("dim", " · ")}${summary}` : hint;
  const content = status + trailing;
  const inner = Math.min(width - 4, Math.max(50, visibleWidth(content)));
  const lines = !active && summary ? wrapTextWithAnsi(content, inner) : [truncateToWidth(content, inner)];
  const border = (text: string) => theme.fg("toolTitle", text);
  const rows = lines.map((line) => `${border("│")} ${line}${" ".repeat(inner - visibleWidth(line))} ${border("│")}`);
  const rule = "─".repeat(inner + 2);

  return [border(`┌${rule}┐`), ...rows, border(`└${rule}┘`)];
}

export default function signalDeck(pi: ExtensionAPI) {
  let panel: Panel = "ready";
  let run: Run | undefined;
  let summary: string | undefined;
  let redraw: (() => void) | undefined;

  function show(next: Panel) {
    if (next === panel) return;
    panel = next;
    redraw?.();
  }

  pi.events.on("cyber-ui:summary", (event) => {
    if (!redraw || !Value.Check(summaryPacket, event)) return;

    event.handled = true;
    summary = event.stats;
    redraw();
  });

  pi.on("session_start", (_event, ctx) => {
    if (ctx.mode !== "tui") return;
    panel = "ready";
    run = undefined;
    summary = undefined;
    ctx.ui.setHeader((_tui, theme) => ({
      render: (width) => [truncateToWidth(theme.bold(theme.fg("toolTitle", "▰ π / signal deck")), width)],
      invalidate() {},
    }));
    ctx.ui.setWidget("signal-deck", (tui, theme) => {
      redraw = () => tui.requestRender();

      return { render: (width) => panelLines(theme, width, panel, summary), invalidate() {} };
    });
  });

  pi.on("agent_start", (_event, ctx) => {
    if (ctx.mode !== "tui") return;
    summary = undefined;
    run = { tools: new Set() };
    show("working");
  });
  pi.on("tool_execution_start", (event) => {
    if (!run) return;
    run.tools.add(event.toolCallId);
    show("tool");
  });
  pi.on("tool_execution_end", (event) => {
    if (!run) return;
    run.tools.delete(event.toolCallId);
    show(run.tools.size > 0 ? "tool" : "working");
  });
  pi.on("agent_before_settle", (event) => {
    if (run) run.outcome = event.outcome;
  });
  pi.on("agent_settled", (event) => {
    if (!run) return;

    if (event.aborted || run.outcome === "aborted") show("cancelled");
    else if (run.outcome === "error") show("failed");
    else show("done");

    run = undefined;
  });
  pi.on("session_tree", () => {
    run = undefined;
    summary = undefined;
    show("ready");
  });
  pi.on("session_shutdown", () => {
    redraw = undefined;
  });
}
