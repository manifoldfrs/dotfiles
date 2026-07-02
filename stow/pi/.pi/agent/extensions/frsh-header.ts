import type { ExtensionAPI, Theme } from "@earendil-works/pi-coding-agent";
import { VERSION } from "@earendil-works/pi-coding-agent";

function renderPi(theme: Theme): string[] {
  const blue = (text: string) => theme.fg("accent", text);
  const cyan = (text: string) => theme.fg("mdCode", text);
  const purple = (text: string) => theme.fg("borderAccent", text);
  const muted = (text: string) => theme.fg("dim", text);

  return [
    "",
    muted("        ╭────────────────────────╮"),
    `${muted("        │")} ${blue("██████╗  ██╗")}             ${muted("│")}`,
    `${muted("        │")} ${blue("██╔══██╗ ██║")}            ${muted("│")}`,
    `${muted("        │")} ${purple("██████╔╝ ██║")}            ${muted("│")}`,
    `${muted("        │")} ${purple("██╔═══╝  ██║")}            ${muted("│")}`,
    `${muted("        │")} ${cyan("██║      ██║")} ${muted("agent")}      ${muted("│")}`,
    `${muted("        │")} ${cyan("╚═╝      ╚═╝")} ${muted(`v${VERSION}`)}      ${muted("│")}`,
    muted("        ╰────────────────────────╯"),
    "",
  ];
}

export default function (pi: ExtensionAPI) {
  pi.on("session_start", async (_event, ctx) => {
    if (ctx.mode !== "tui") {
      return;
    }

    ctx.ui.setHeader((_tui, theme) => ({
      render(_width: number): string[] {
        return renderPi(theme);
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
