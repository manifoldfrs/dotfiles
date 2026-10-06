import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const GIT_NO_EDITOR_PREFIX = "export GIT_EDITOR=true GIT_SEQUENCE_EDITOR=true GIT_MERGE_AUTOEDIT=no\n";
const BLOCK_EXIT_CODE = 2;
const HOOK_TIMEOUT_MS = 5_000;

type GuardrailVerdict = { block: true; reason: string } | undefined;

/** Runs a shared Claude/Codex guardrail script with a Claude-style hook payload. */
function runGuardrailScript(script: string, payload: object): GuardrailVerdict {
  const result = spawnSync("bash", [script], {
    input: JSON.stringify(payload),
    encoding: "utf8",
    timeout: HOOK_TIMEOUT_MS,
  });
  if (result.status === 0) return undefined;
  const detail = result.stderr.trim();
  if (result.status === BLOCK_EXIT_CODE && detail) return { block: true, reason: detail };
  return { block: true, reason: `Agent guardrail ${script} failed (${result.error?.message ?? `exit ${result.status}`}). Failing closed.` };
}

/** Enforces the shared agent guardrails, used by Claude Code and Codex hooks, on Pi tool calls. */
export function registerAgentGuardrails(pi: ExtensionAPI, guardrailsDir: string): void {
  const bashScript = join(guardrailsDir, "block-dangerous-bash.sh");
  const editScript = join(guardrailsDir, "block-generated-edits.sh");
  let warnedMissing = false;

  function scriptsInstalled(ctx: ExtensionContext): boolean {
    if (existsSync(bashScript) && existsSync(editScript)) return true;
    if (!warnedMissing) {
      warnedMissing = true;
      ctx.ui.notify(`Agent guardrails are not enforced: shared scripts are missing from ${guardrailsDir}. Apply the bin Stow package.`, "warning");
    }
    return false;
  }

  pi.on("tool_call", (event, ctx) => {
    if (event.toolName === "bash") {
      const { command } = event.input;
      if (scriptsInstalled(ctx)) {
        const verdict = runGuardrailScript(bashScript, { cwd: ctx.cwd, tool_input: { command } });
        if (verdict) return verdict;
      }
      if (/\bgit\b/.test(command)) event.input.command = GIT_NO_EDITOR_PREFIX + command;
      return undefined;
    }
    if (event.toolName !== "edit" && event.toolName !== "write") return undefined;
    if (!scriptsInstalled(ctx)) return undefined;
    return runGuardrailScript(editScript, { cwd: ctx.cwd, tool_input: { file_path: event.input.path } });
  });
}

export default function (pi: ExtensionAPI) {
  registerAgentGuardrails(pi, join(homedir(), ".local/share/agent-guardrails"));
}
