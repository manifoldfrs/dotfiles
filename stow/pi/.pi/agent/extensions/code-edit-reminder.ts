import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

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

function isMutationTool(toolName: string) {
  return (
    toolName === "edit" ||
    toolName === "write" ||
    toolName === "apply_patch" ||
    toolName.endsWith("RepoPromptCE__apply_edits") ||
    toolName.endsWith("RepoPromptCE_apply_edits") ||
    toolName.endsWith("RepoPromptCE__file_actions") ||
    toolName.endsWith("RepoPromptCE_file_actions")
  );
}

export default function (pi: ExtensionAPI) {
  pi.on("tool_result", (event) => {
    if (event.isError || !isMutationTool(event.toolName)) return;

    return {
      content: [...event.content, { type: "text", text: REMINDER }],
    };
  });
}
