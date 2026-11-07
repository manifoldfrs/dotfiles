import { spawnSync } from "node:child_process"
import { homedir } from "node:os"
import { join } from "node:path"
import { Plugin } from "@opencode/plugin"

const SHELL_TOOL = "shell"
const BLOCK_EXIT_CODE = 2
const HOOK_TIMEOUT_MS = 5_000
const BASH_GUARD = join(homedir(), ".claude/hooks/block-dangerous-bash.sh")

type ToolCall = { readonly tool: string; readonly input: unknown }

function shellRefusal(script: string, input: unknown): string | undefined {
  const result = spawnSync("bash", [script], {
    input: JSON.stringify({ tool_input: input }),
    encoding: "utf8",
    timeout: HOOK_TIMEOUT_MS,
  })

  if (result.status === 0) return undefined

  const detail = result.stderr.trim()

  if (result.status === BLOCK_EXIT_CODE && detail) return detail

  return `Agent guardrail ${script} failed (${result.error?.message ?? `exit ${result.status}`}). Failing closed.`
}

export function rejectDangerousShell(script: string) {
  return (call: ToolCall) => {
    if (call.tool !== SHELL_TOOL) return

    const refusal = shellRefusal(script, call.input)

    if (refusal) throw new Error(refusal)
  }
}

export default Plugin.define({
  id: "guardrails",
  async setup(ctx) {
    await ctx.tool.hook("execute.before", rejectDangerousShell(BASH_GUARD))
  },
})
