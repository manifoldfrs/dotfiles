import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  pi.registerCommand("update", {
    description: "Update Pi with its native updater after confirmation",
    handler: async (_args, ctx) => {
      if (!await ctx.ui.confirm("Update Pi?", "Run pi update to change the installed Pi version?")) return;
      await ctx.waitForIdle();
      const result = await pi.exec("pi", ["update"], { timeout: 180_000 });
      const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
      ctx.ui.notify(output || (result.code === 0 ? "Pi update completed." : "Pi update failed."), result.code === 0 ? "info" : "error");
    },
  });
}
