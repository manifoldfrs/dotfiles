import { writeFile } from "node:fs/promises";
import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";

const VERSION_TIMEOUT_MS = 10_000;
const UPDATE_TIMEOUT_MS = 180_000;

async function installedVersion(pi: ExtensionAPI): Promise<string | undefined> {
  const result = await pi.exec("pi", ["--version"], { timeout: VERSION_TIMEOUT_MS });

  return result.code === 0 ? result.stdout.trim() || undefined : undefined;
}

// The shell's `pi` wrapper sets PI_RELAUNCH_FILE and reopens the session path written there after exit.
async function relaunch(ctx: ExtensionCommandContext, summary?: string): Promise<void> {
  const sessionFile = ctx.sessionManager.getSessionFile();
  const relaunchFile = process.env.PI_RELAUNCH_FILE;

  if (!relaunchFile || !sessionFile) {
    const resume = sessionFile ? `pi --session ${sessionFile}` : "pi";
    ctx.ui.notify([summary, `Exit and run \`${resume}\` to continue.`].filter(Boolean).join(" "), "info");

    return;
  }

  await writeFile(relaunchFile, sessionFile);
  ctx.ui.notify([summary, "Restarting Pi…"].filter(Boolean).join(" "), "info");
  ctx.shutdown();
}

export default function (pi: ExtensionAPI) {
  pi.registerCommand("update", {
    description: "Update Pi with its native updater, then resume this session on the new version",
    handler: async (_args, ctx) => {
      if (!await ctx.ui.confirm("Update Pi?", "Run pi update to change the installed Pi version?")) return;
      await ctx.waitForIdle();
      const before = await installedVersion(pi);
      const result = await pi.exec("pi", ["update"], { timeout: UPDATE_TIMEOUT_MS });
      const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();

      if (result.code !== 0) {
        ctx.ui.notify(output || "Pi update failed.", "error");

        return;
      }

      const after = await installedVersion(pi);

      if (!after || after === before) {
        ctx.ui.notify(output || "Pi is up to date.", "info");

        return;
      }

      await relaunch(ctx, `Updated Pi: ${before ?? "unknown"} -> ${after}.`);
    },
  });

  pi.registerCommand("restart", {
    description: "Restart Pi and resume this session",
    handler: async (_args, ctx) => {
      await ctx.waitForIdle();
      await relaunch(ctx);
    },
  });
}
