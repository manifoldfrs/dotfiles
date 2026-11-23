import type { ExtensionAPI, Theme } from "@earendil-works/pi-coding-agent";
import { keyText, VERSION } from "@earendil-works/pi-coding-agent";
import { parseColor, truncateToWidth, visibleWidth, wrapTextWithAnsi } from "@earendil-works/pi-tui";
import { Type } from "typebox";
import { Value } from "typebox/value";

const summaryPacket = Type.Object({ stats: Type.String(), handled: Type.Boolean() });

const watermark = [
  "⢀⣤⣶⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿",
  "⠿⠿⠀⠀⠀⣿⣿⣿⠀⠀⠀⠀⠀⠀⣿⣿⣿⠀⠀⠀⠀⠀",
  "⠀⠀⠀⠀⠀⣿⣿⣿⠀⠀⠀⠀⠀⠀⣿⣿⣿⠀⠀⠀⠀⠀",
  "⠀⠀⠀⠀⠀⣿⣿⣿⠀⠀⠀⠀⠀⠀⣿⣿⣿⠀⠀⠀⠀⠀",
  "⠀⠀⠀⠀⢠⣿⣿⡟⠀⠀⠀⠀⠀⠀⣿⣿⣿⠀⠀⠀⠀⠀",
  "⠀⠀⠀⢠⣿⣿⡟⠀⠀⠀⠀⠀⠀⠀⣿⣿⣿⠀⠀⠀⠀⠀",
  "⠀⠀⢠⣿⣿⡟⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⣿⠀⠀⠀⠀⠀",
  "⠀⣠⣿⣿⠟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠻⣿⣿⣿⣿⣿⣿⡿",
];

const watermarkTones = ["#424d65", "#3b465d", "#343e54", "#2d374a", "#283143"].map(parseColor);

function watermarkLines(theme: Theme): string[] {
  if (theme.getColorMode() !== "truecolor") {
    return watermark.map((row) => theme.style(row, { fg: watermarkTones[2] }));
  }

  return watermark.map((row, y) => Array.from(row, (cell, x) => {
    if (cell === "⠀") return cell;

    const shade = Math.floor(0.05 * x + 0.4 * y) + (cell === "⣿" ? 0 : 1);

    return theme.style(cell, { fg: watermarkTones[shade] });
  }).join(""));
}

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
  let closeWatermark: (() => void) | undefined;

  function dismissWatermark() {
    closeWatermark?.();
    closeWatermark = undefined;
  }

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

  pi.on("session_start", (event, ctx) => {
    if (ctx.mode !== "tui") return;
    panel = "ready";
    run = undefined;
    summary = undefined;
    const fresh = event.reason === "startup" || event.reason === "new";
    const empty = !ctx.sessionManager.getEntries().some((entry) => entry.type === "message" || entry.type === "custom_message");
    ctx.ui.setHeader((tui, theme) => {
      if (fresh && empty) {
        const lines = watermarkLines(theme);

        const overlay = tui.showOverlay({
          render: () => lines,
          invalidate() {},
        }, {
          anchor: "center",
          offsetY: -1,
          width: visibleWidth(watermark[0]),
          nonCapturing: true,
          visible: (width, height) => width >= 68 && height >= 22,
        });

        closeWatermark = () => overlay.hide();
      }

      return {
        render(width) {
          const stamp = `${theme.fg("toolTitle", "▰")} ${theme.bold(theme.fg("text", "Pi"))} ${theme.fg("muted", `(v${VERSION})`)}`;

          return [truncateToWidth(stamp, width)];
        },
        invalidate() {},
        dispose: dismissWatermark,
      };
    });
    ctx.ui.setWidget("signal-deck", (tui, theme) => {
      redraw = () => tui.requestRender();

      return { render: (width) => panelLines(theme, width, panel, summary), invalidate() {} };
    });
  });

  pi.on("before_agent_start", dismissWatermark);
  pi.on("user_bash", dismissWatermark);
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
    dismissWatermark();
    run = undefined;
    summary = undefined;
    show("ready");
  });
  pi.on("session_shutdown", () => {
    dismissWatermark();
    redraw = undefined;
  });
}
