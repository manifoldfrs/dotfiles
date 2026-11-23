import { basename, dirname } from "node:path";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

const LEADING_SKILL_COMMAND = /^\/skill:([a-z0-9]+(?:-[a-z0-9]+)*)(?=\s|$)/;

function toast(ctx: ExtensionContext, name: string) {
  if (ctx.hasUI) ctx.ui.notify(`Skill ready: /${name}`, "info");
}

/** The skill a read loads, when the model loads one by reading its SKILL.md. */
export function skillOfRead(path: string): string | undefined {
  if (basename(path) !== "SKILL.md") return undefined;

  return basename(dirname(path)) || undefined;
}

/** Notifies when a skill loads, whether you typed /skill:name or the model read its SKILL.md. */
export default function skillToast(pi: ExtensionAPI): void {
  pi.on("input", (event, ctx) => {
    const name = LEADING_SKILL_COMMAND.exec(event.text)?.[1];

    if (name) toast(ctx, name);

    return { action: "continue" };
  });

  pi.on("tool_result", (event, ctx) => {
    if (event.toolName !== "read" || event.isError) return;
    // SAFETY: tool_result only follows calls whose arguments passed the read tool's schema, which requires a string path.
    const name = skillOfRead(event.input.path as string);

    if (name) toast(ctx, name);
  });
}
