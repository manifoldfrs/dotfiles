import { describe, expect, test } from "bun:test"
import { join } from "node:path"
import plugin, { rejectDangerousShell } from "./index.ts"

const BASH_GUARD = join(import.meta.dir, "../../../../../pi/.pi/agent/guardrails/block-dangerous-bash.sh")

const shell = (command: string) => ({ tool: "shell", input: { command } })

describe("rejectDangerousShell", () => {
  const veto = rejectDangerousShell(BASH_GUARD)

  test("rejects a command the shared guard blocks, with its reason", () => {
    expect(() => veto(shell("git add -p x.txt"))).toThrow("Refusing interactive 'git add -i' or '-p'")
  })

  test("allows an ordinary command", () => {
    expect(() => veto(shell("git status"))).not.toThrow()
  })

  test("leaves other tools alone", () => {
    expect(() => veto({ tool: "read", input: { command: "git add -p x.txt" } })).not.toThrow()
  })

  test("fails closed when the guard script is missing", () => {
    const missing = rejectDangerousShell("/nonexistent/block-dangerous-bash.sh")

    expect(() => missing(shell("git status"))).toThrow("Failing closed")
  })
})

test("registers the veto before tool execution, the only hook that can reject a call", async () => {
  const hooks: string[] = []
  const ctx = { tool: { hook: async (name: string) => void hooks.push(name) } }

  await plugin.setup?.(ctx as unknown as Parameters<NonNullable<typeof plugin.setup>>[0])

  expect(hooks).toEqual(["execute.before"])
})
