import { homedir } from "node:os"
import { join } from "node:path"

const GUARDRAILS = join(homedir(), ".local", "share", "agent-guardrails")

type HookResult = {
  code: number
  stderr: string
}

type ExecuteBeforeEvent = {
  tool: string
  input: unknown
}

type PluginContext = {
  tool: {
    hook(
      name: "execute.before",
      callback: (event: ExecuteBeforeEvent) => Promise<void>,
    ): Promise<unknown>
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function stringField(input: unknown, ...fields: string[]): string | undefined {
  if (!isRecord(input)) return undefined

  for (const field of fields) {
    const value = input[field]
    if (typeof value === "string" && value.length > 0) return value
  }

  return undefined
}

function isMutationTool(tool: string): boolean {
  return (
    tool === "edit" ||
    tool === "write" ||
    tool === "patch" ||
    tool.endsWith("RepoPromptCE_apply_edits") ||
    tool.endsWith("RepoPromptCE_file_actions")
  )
}

async function runGuard(script: string, payload: unknown): Promise<HookResult> {
  const process = Bun.spawn([join(GUARDRAILS, script)], {
    stdin: new TextEncoder().encode(JSON.stringify(payload)),
    stdout: "ignore",
    stderr: "pipe",
  })
  const stderr = await new Response(process.stderr).text()
  const code = await process.exited
  return { code, stderr }
}

async function blockWhenRejected(script: string, payload: unknown, fallback: string) {
  const result = await runGuard(script, payload)
  if (result.code === 0) return
  throw new Error(result.stderr.trim() || fallback)
}

export default {
  id: "frsh.cb-guards",
  async setup(ctx: PluginContext) {
    await ctx.tool.hook("execute.before", async (event) => {
      if (event.tool === "bash" || event.tool === "shell") {
        const command = stringField(event.input, "command")
        if (!command) return

        await blockWhenRejected(
          "block-dangerous-bash.sh",
          { tool_input: { command } },
          "Blocked dangerous shell command",
        )
        return
      }

      if (!isMutationTool(event.tool)) return

      const filePath = stringField(event.input, "filePath", "file_path", "path")
      const patch = stringField(event.input, "patch", "patchText")
      if (!filePath && !patch) return

      await blockWhenRejected(
        "block-generated-edits.sh",
        {
          tool_input: {
            ...(filePath ? { file_path: filePath } : {}),
            ...(patch ? { patch } : {}),
          },
        },
        "Blocked edit to a generated file",
      )
    })
  },
}
