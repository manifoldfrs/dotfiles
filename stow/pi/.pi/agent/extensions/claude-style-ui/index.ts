// Claude Code-style chrome for Pi: dot-and-gutter tool rows, a boxed user prompt, ● reply markers,
// ◉ bullets, framed code blocks, a rotating spinner verb, a ❯ prompt, and a one-line status footer.
// Colors come from the active theme; the startup header lives in frsh-header.ts.
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { registerFooter } from "./footer.ts";
import { patchMessageChrome, setChromeTheme } from "./message-chrome.ts";
import { registerPromptEditor } from "./prompt-editor.ts";
import { registerSpinner } from "./spinner.ts";
import { registerToolRows } from "./tool-rows.ts";

export default function (pi: ExtensionAPI) {
  registerToolRows(pi);
  registerSpinner(pi);
  registerPromptEditor(pi);
  registerFooter(pi);
  patchMessageChrome();

  pi.on("session_start", (_event, ctx) => {
    if (ctx.hasUI) setChromeTheme(ctx.ui.theme);
  });
}
