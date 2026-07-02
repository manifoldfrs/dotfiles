import type { ExtensionAPI, Theme } from "@earendil-works/pi-coding-agent";
import { VERSION } from "@earendil-works/pi-coding-agent";

function renderPi(theme: Theme): string[] {
  const blue = (text: string) => theme.fg("accent", text);
  const cyan = (text: string) => theme.fg("mdCode", text);
  const purple = (text: string) => theme.fg("borderAccent", text);
  const muted = (text: string) => theme.fg("dim", text);

  const art = [
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

  return [
    "",
    `       ${muted("pi agent")} ${muted(`v${VERSION}`)}`,
    "",
    ...art.map((line, index) => {
      if (index < 3) {
        return blue(line);
      }
      if (index < 6) {
        return purple(line);
      }
      return cyan(line);
    }),
    "",
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
