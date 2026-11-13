import type { ExtensionAPI, ExtensionContext, Theme } from "@earendil-works/pi-coding-agent";
import { VERSION } from "@earendil-works/pi-coding-agent";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";
import { homedir } from "node:os";
import { ART, ART_WIDTH, artFrame, FINAL_FRAME, isFlashing } from "./art.ts";

const FRAME_MS = 60;
const INFO_GAP = 4;

function rowColor(row: number): "accent" | "borderAccent" | "mdCode" {
  if (row < 3) return "accent";
  if (row < 6) return "borderAccent";
  return "mdCode";
}

function artLines(theme: Theme, frame: number): string[] {
  const flashing = isFlashing(frame);

  return artFrame(frame).map((cells) =>
    cells.map((cell) => {
      if (!cell) return " ";
      return flashing ? theme.bold(theme.fg("text", cell.char)) : theme.fg(rowColor(cell.row), cell.char);
    }).join("").trimEnd(),
  );
}

function shortCwd(cwd: string): string {
  const home = homedir();
  return cwd.startsWith(home) ? `~${cwd.slice(home.length)}` : cwd;
}

function modelLine(pi: ExtensionAPI, ctx: ExtensionContext): string {
  const model = ctx.model;
  if (!model) return "no model selected";
  const thinking = pi.getThinkingLevel();
  const effort = model.reasoning && thinking !== "off" ? ` with ${thinking} effort` : "";
  return `${model.name || model.id}${effort} · ${model.provider}`;
}

function infoLines(pi: ExtensionAPI, ctx: ExtensionContext, theme: Theme): string[] {
  return [
    `${theme.bold(theme.fg("text", "pi agent"))} ${theme.fg("dim", `v${VERSION}`)}`,
    theme.fg("muted", modelLine(pi, ctx)),
    theme.fg("muted", shortCwd(ctx.cwd)),
  ];
}

function renderHeader(pi: ExtensionAPI, ctx: ExtensionContext, theme: Theme, width: number, frame: number): string[] {
  const art = artLines(theme, frame);
  const info = infoLines(pi, ctx, theme);

  // Too narrow for side by side: stack the details under the art.
  if (width < ART_WIDTH + INFO_GAP + 20) {
    return ["", ...art, "", ...info.map((line) => `  ${truncateToWidth(line, width - 2, "…")}`), ""];
  }

  const infoStart = Math.floor((ART.length - info.length) / 2);
  const infoWidth = width - ART_WIDTH - INFO_GAP;
  const rows = art.map((line, index) => {
    const detail = info[index - infoStart];
    if (detail === undefined) return line;
    const gap = " ".repeat(ART_WIDTH - visibleWidth(line) + INFO_GAP);
    return `${line}${gap}${truncateToWidth(detail, infoWidth, "…")}`;
  });
  return ["", ...rows, ""];
}

export default function (pi: ExtensionAPI) {
  pi.on("session_start", async (_event, ctx) => {
    if (ctx.mode !== "tui") {
      return;
    }

    // A resumed session already has chat under the header, so it starts finished instead of replaying.
    const resumed = ctx.sessionManager.getEntries().some((entry) => entry.type === "message");

    ctx.ui.setHeader((tui, theme) => {
      let frame = resumed ? FINAL_FRAME : 0;
      const timer = setInterval(() => {
        frame += 1;
        if (frame >= FINAL_FRAME) clearInterval(timer);
        tui.requestRender();
      }, FRAME_MS);
      timer.unref();
      if (resumed) clearInterval(timer);

      return {
        render(width: number): string[] {
          return renderHeader(pi, ctx, theme, width, frame);
        },
        invalidate() {},
        dispose: () => clearInterval(timer),
      };
    });
  });

  pi.registerCommand("builtin-header", {
    description: "Restore Pi's built-in startup header",
    handler: async (_args, ctx) => {
      ctx.ui.setHeader(undefined);
      ctx.ui.notify("Built-in header restored", "info");
    },
  });
}
