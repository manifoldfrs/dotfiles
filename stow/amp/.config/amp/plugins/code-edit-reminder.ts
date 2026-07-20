import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { PluginAPI, ToolResultEvent } from "@ampcode/plugin";

const REMINDER = readFileSync(
  join(
    homedir(),
    ".local",
    "share",
    "agent-guardrails",
    "code-edit-reminder.txt",
  ),
  "utf8",
).trim();

function isRepoPromptMutation(event: ToolResultEvent) {
  return (
    event.tool.endsWith("RepoPromptCE__apply_edits") ||
    event.tool.endsWith("RepoPromptCE_apply_edits") ||
    event.tool.endsWith("RepoPromptCE__file_actions") ||
    event.tool.endsWith("RepoPromptCE_file_actions")
  );
}

export default function (amp: PluginAPI) {
  amp.on("tool.result", (event) => {
    if (event.status !== "done") return;

    const modifiedFiles = amp.helpers.filesModifiedByToolCall(event);
    if (!modifiedFiles?.length && !isRepoPromptMutation(event)) return;

    if (typeof event.output === "string") {
      return { status: "done", output: `${event.output}\n\n${REMINDER}` };
    }

    if (event.output === undefined) {
      return { status: "done", output: REMINDER };
    }
  });
}
