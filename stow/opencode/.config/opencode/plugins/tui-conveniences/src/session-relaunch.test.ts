import assert from "node:assert/strict"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { test } from "node:test"
import { requestSessionRelaunch } from "./session-relaunch.ts"

test("restart and update write the action and current session for the shell wrapper", async () => {
  const directory = await mkdtemp(join(tmpdir(), "opencode-relaunch-test-"))
  try {
    const file = join(directory, "request")
    for (const action of ["restart", "update"] as const) {
      assert.deepEqual(await requestSessionRelaunch(action, "ses_test123", file), { ok: true })
      assert.equal(await readFile(file, "utf8"), `${action}\nses_test123\n`)
    }
  } finally {
    await rm(directory, { recursive: true })
  }
})

test("without the wrapper, relaunch fails without exiting", async () => {
  const result = await requestSessionRelaunch("restart", "ses_test123", undefined)
  assert.equal(result.ok, false)
})

test("invalid session IDs and unwritable requests do not authorize an exit", async () => {
  assert.equal((await requestSessionRelaunch("restart", "ses_bad\nupdate", "/unused")).ok, false)
  assert.equal((await requestSessionRelaunch("restart", "ses_test123", "")).ok, false)
})
