import { execFile } from "node:child_process"
import { fileURLToPath } from "node:url"
import { RUNNER_FAILED, RUNNER_TIMEOUT_MS, TOOL_DESCRIPTION, TOOL_NAME, inputSchema, runnerArgv, runnerOutcome, runnerStdin, type RunnerRun } from "../../../../../claude/.claude/mods/xai-search/hooks/xai-shared.ts"

const MOD_ROOT = fileURLToPath(new URL("../../../../../claude/.claude/mods/xai-search", import.meta.url))

export type RunProcess = (argv: readonly [string, ...string[]], stdin: string, signal: AbortSignal) => Promise<RunnerRun | undefined>

// A run that never reached an exit code, because it failed to start or was stopped, resolves undefined.
export const runProcess: RunProcess = ([command, ...args], stdin, signal) =>
  new Promise(resolve => {
    const child = execFile(command, args, { timeout: RUNNER_TIMEOUT_MS, signal }, (error, stdout, stderr) => {
      const exitCode = error ? error.code : 0

      resolve(typeof exitCode === "number" ? { exitCode, stdout, stderr } : undefined)
    })

    // A runner that exits before reading its input must not crash the server with EPIPE.
    child.stdin?.on("error", () => {})
    child.stdin?.end(stdin)
  })

export function xaiSearchTool(run: RunProcess) {
  return {
    name: TOOL_NAME,
    description: TOOL_DESCRIPTION,
    input: inputSchema,
    options: { codemode: false },
    execute: async (input: unknown, context: { readonly signal: AbortSignal }) => {
      const finished = await run(runnerArgv(MOD_ROOT), runnerStdin(Object(input)), context.signal)

      if (!finished) throw new Error(RUNNER_FAILED)

      const outcome = runnerOutcome(finished)

      if (!outcome.ok) throw new Error(outcome.text)

      return { content: outcome.text }
    },
  }
}
