import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  pi.registerCommand("lg", {
    description: "Summarize unstaged git changes with per-file +/- counts",
    handler: async (_args, ctx) => {
      if (!ctx.isIdle()) {
        pi.sendUserMessage("/skill:lg", { deliverAs: "followUp", expandPromptTemplates: true });
        ctx.ui.notify("Queued /lg after the current turn finishes.", "info");
        return;
      }

      pi.sendUserMessage("/skill:lg", { expandPromptTemplates: true });
    },
  });
}
