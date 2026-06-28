import type { Plugin } from "@opencode-ai/plugin"
import { homedir } from "os"
import { join } from "path"

// Adapter: reuse the Claude Code hook scripts in ~/.claude/hooks so the same
// guard logic applies under OpenCode. Each script's contract:
//   - reads a JSON payload on stdin
//   - block-* scripts: exit code 2 = block, stderr = reason
const HOOKS = join(homedir(), ".claude", "hooks")

async function runHook(
  script: string,
  payload: unknown,
): Promise<{ code: number; stdout: string; stderr: string }> {
  const proc = Bun.spawn([join(HOOKS, script)], {
    stdin: new TextEncoder().encode(JSON.stringify(payload)),
    stdout: "pipe",
    stderr: "pipe",
  })
  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ])
  const code = await proc.exited
  return { code, stdout, stderr }
}

export const CbGuards: Plugin = async () => {
  return {
    // Hard blockers, map to Claude's PreToolUse. Throwing aborts the tool call.
    "tool.execute.before": async (input, output) => {
      if (input.tool === "bash") {
        const cmd = output.args?.command
        if (typeof cmd === "string" && cmd.length > 0) {
          const r = await runHook("block-dangerous-bash.sh", { tool_input: { command: cmd } })
          if (r.code === 2) throw new Error(r.stderr.trim() || "Blocked: dangerous bash command")
        }
      }
      if (input.tool === "edit" || input.tool === "write" || input.tool === "patch") {
        const fp = output.args?.filePath ?? output.args?.path
        if (typeof fp === "string" && fp.length > 0) {
          const r = await runHook("block-generated-edits.sh", { tool_input: { file_path: fp } })
          if (r.code === 2) throw new Error(r.stderr.trim() || "Blocked: edit to a generated file")
        }
      }
    },
  }
}
