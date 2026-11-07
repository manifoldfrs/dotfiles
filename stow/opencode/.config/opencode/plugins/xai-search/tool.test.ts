import { describe, expect, test } from "bun:test"
import { runProcess, xaiSearchTool, type RunProcess } from "./tool.ts"

const context = { signal: new AbortController().signal }

function recording(result: Awaited<ReturnType<RunProcess>>) {
  const calls: { argv: readonly string[]; stdin: string }[] = []

  const run: RunProcess = async (argv, stdin) => {
    calls.push({ argv, stdin })

    return result
  }

  return { calls, tool: xaiSearchTool(run) }
}

describe("xai_search tool", () => {
  test("runs the Pi runner with the call params on stdin", async () => {
    const { calls, tool } = recording({ exitCode: 0, stdout: JSON.stringify({ text: "Top posts" }), stderr: "" })

    const result = await tool.execute({ query: "agents", to_date: "2026-10-16", stray: "dropped" }, context)

    expect(result).toEqual({ content: "Top posts" })
    expect(calls).toHaveLength(1)
    expect(calls[0]!.argv[0]).toBe("/opt/homebrew/bin/node")
    expect(calls[0]!.argv[1]).toMatch(/\/pi\/\.pi\/agent\/extensions\/xai-search\/run-xai-search\.ts$/)
    expect(calls[0]!.argv.slice(2)).toEqual(["--interactive", "--params", "/dev/stdin"])
    expect(JSON.parse(calls[0]!.stdin)).toEqual({ query: "agents", to_date: "2026-10-16" })
  })

  test("surfaces the runner error message", async () => {
    const { tool } = recording({ exitCode: 1, stdout: "", stderr: "No xAI sign-in found.\n" })

    await expect(tool.execute({ query: "agents" }, context)).rejects.toThrow("No xAI sign-in found.")
  })

  test("fails when the runner never finished or printed no text", async () => {
    await expect(recording(undefined).tool.execute({ query: "agents" }, context)).rejects.toThrow("xai_search runner failed")
    await expect(recording({ exitCode: 0, stdout: "{}", stderr: "" }).tool.execute({ query: "agents" }, context)).rejects.toThrow("xai_search runner failed")
  })
})

describe("runProcess", () => {
  const node = (script: string) => ["/opt/homebrew/bin/node", "-e", script] as const

  test("hands stdin to a child that opens /dev/stdin", async () => {
    const run = await runProcess([...node("process.stdout.write(require('fs').readFileSync('/dev/stdin', 'utf8'))")], "hello", context.signal)

    expect(run).toEqual({ exitCode: 0, stdout: "hello", stderr: "" })
  })

  test("reports a nonzero exit with its stderr", async () => {
    const run = await runProcess([...node("console.error('nope'); process.exit(3)")], "", context.signal)

    expect(run).toEqual({ exitCode: 3, stdout: "", stderr: "nope\n" })
  })

  test("resolves undefined when the command cannot start or is stopped", async () => {
    expect(await runProcess(["/nonexistent/command"], "", context.signal)).toBeUndefined()

    const stop = new AbortController()
    const running = runProcess([...node("setTimeout(() => {}, 60000)")], "", stop.signal)

    stop.abort()

    expect(await running).toBeUndefined()
  })
})
