import type { ExtensionAPI, ExtensionContext, Theme } from "@earendil-works/pi-coding-agent";
import { VERSION } from "@earendil-works/pi-coding-agent";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";
import { homedir } from "node:os";

const ART = [
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
const ART_WIDTH = Math.max(...ART.map((line) => line.length));
const INFO_GAP = 4;

function colorArt(theme: Theme, line: string, index: number): string {
  if (index < 3) return theme.fg("accent", line);
  if (index < 6) return theme.fg("borderAccent", line);
  return theme.fg("mdCode", line);
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

function renderHeader(pi: ExtensionAPI, ctx: ExtensionContext, theme: Theme, width: number): string[] {
  const art = ART.map((line, index) => colorArt(theme, line, index));
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

    ctx.ui.setHeader((_tui, theme) => ({
      render(width: number): string[] {
        return renderHeader(pi, ctx, theme, width);
      },
      invalidate() {},
    }));
  });

  pi.registerCommand("builtin-header", {
    description: "Restore Pi's built-in startup header",
    handler: async (_args, ctx) => {
      ctx.ui.setHeader(undefined);
      ctx.ui.notify("Built-in header restored", "info");
    },
  });
}
