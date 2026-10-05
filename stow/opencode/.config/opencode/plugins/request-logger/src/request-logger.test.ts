import assert from "node:assert/strict"
import { chmod, mkdtemp, mkdir, readFile, readdir, rm, stat, symlink, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createServer } from "node:http"
import test from "node:test"
import type { SessionHttpRequest } from "@opencode/plugin/promise/session"
import { createRequestLoggerPlugin } from "./request-logger.ts"

type RequestHook = (event: SessionHttpRequest) => void | Promise<void>

async function setupLogger(options: Record<string, unknown>) {
  const hooks: RequestHook[] = []
  const warnings: string[] = []
  // SAFETY: the fixture supplies the plugin's options and HTTP hook registration boundary.
  await createRequestLoggerPlugin((message) => warnings.push(message)).setup({
    options,
    session: {
      hook: async (name: string, callback: RequestHook) => {
        assert.equal(name, "http.request")
        hooks.push(callback)
      },
    },
  } as never)
  return { hooks, warnings }
}

function requestEvent(body: string, kind: SessionHttpRequest["kind"] = "primary"): SessionHttpRequest {
  // SAFETY: these fixture IDs model the already-validated IDs delivered by OpenCode.
  return {
    sessionID: "ses_fixture",
    agent: "build",
    model: { providerID: "openai", id: "gpt-6.1-sol-fast" },
    kind,
    request: new Request("https://api.example.test/responses?api_key=QUERY_SECRET", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer HEADER_SECRET" },
      body,
    }),
  } as SessionHttpRequest
}

async function temporaryLogs(t: test.TestContext) {
  const root = await mkdtemp(join(tmpdir(), "opencode-request-logger-"))
  t.after(() => rm(root, { recursive: true, force: true }))
  return { root, directory: join(root, "requests") }
}

test("request logging is disabled by default and registers no hooks", async (t) => {
  const { directory } = await temporaryLogs(t)
  for (const options of [{ directory }, { enabled: false, directory }]) {
    const fixture = await setupLogger(options)
    assert.equal(fixture.hooks.length, 0)
    assert.deepEqual(fixture.warnings, [])
  }
  await assert.rejects(stat(directory), { code: "ENOENT" })
})

test("logs the exact body after earlier hook edits without consuming the original", async (t) => {
  const { directory } = await temporaryLogs(t)
  const { hooks, warnings } = await setupLogger({ enabled: true, directory })
  assert.equal(hooks.length, 1)
  const hook = hooks[0]
  assert.ok(hook)
  const body = '{ "model": "gpt-6.1-sol", "instructions": "Keep it short", "input": [], "tools": [] }\n'
  const event = requestEvent("{}")
  event.request = new Request(event.request, { body })
  await hook(event)
  assert.equal(await event.request.text(), body)
  const filenames = await readdir(directory)
  assert.equal(filenames.length, 1)
  const path = join(directory, filenames[0] ?? "")
  const text = await readFile(path, "utf8")
  const record = JSON.parse(text)
  assert.equal(record.body, body)
  assert.equal(record.sessionID, "ses_fixture")
  assert.equal(record.kind, "primary")
  assert.equal(record.transport, "http")
  assert.equal(record.model.id, "gpt-6.1-sol-fast")
  assert.equal(record.audit.totalBytes, Buffer.byteLength(body))
  assert.equal(record.audit.systemBytes, Buffer.byteLength(JSON.stringify("Keep it short")))
  assert.equal(record.audit.inputBytes, 2)
  assert.equal(record.audit.toolCount, 0)
  assert.equal(record.audit.toolBytes, 2)
  assert.doesNotMatch(text, /HEADER_SECRET|QUERY_SECRET|authorization|api_key/)
  assert.equal((await stat(directory)).mode & 0o777, 0o700)
  assert.equal((await stat(path)).mode & 0o777, 0o600)
  assert.deepEqual(warnings, [])
})

test("logs auxiliary requests and retries separately with concurrent retention", async (t) => {
  const { directory } = await temporaryLogs(t)
  await mkdir(directory, { mode: 0o755 })
  await chmod(directory, 0o755)
  await writeFile(join(directory, "opencode-http-unrelated.json"), "keep")
  const { hooks } = await setupLogger({ enabled: true, directory, maxFiles: 4 })
  const hook = hooks[0]
  assert.ok(hook)
  const kinds: SessionHttpRequest["kind"][] = ["primary", "compaction", "title", "generate"]
  await Promise.all(kinds.map((kind) => hook(requestEvent("{}", kind))))
  const records = await Promise.all((await readdir(directory))
    .filter((name) => name !== "opencode-http-unrelated.json")
    .map(async (name) => JSON.parse(await readFile(join(directory, name), "utf8"))))
  assert.deepEqual(records.map((record) => record.kind).sort(), [...kinds].sort())
  await hook(requestEvent('{"retry":true}'))
  const filenames = await readdir(directory)
  assert.equal(filenames.filter((name) => name !== "opencode-http-unrelated.json").length, 4)
  assert.equal(await readFile(join(directory, "opencode-http-unrelated.json"), "utf8"), "keep")
  assert.equal((await stat(directory)).mode & 0o777, 0o700)
})

test("preserves non-JSON bodies and absent audit fields", async (t) => {
  const { directory } = await temporaryLogs(t)
  const { hooks } = await setupLogger({ enabled: true, directory })
  const hook = hooks[0]
  assert.ok(hook)
  await hook(requestEvent("not JSON"))
  const [filename] = await readdir(directory)
  assert.ok(filename)
  const record = JSON.parse(await readFile(join(directory, filename), "utf8"))
  assert.equal(record.body, "not JSON")
  assert.deepEqual(record.audit, { totalBytes: 8 })
})

test("invalid logger options warn safely and leave logging disabled", async () => {
  for (const options of [
    { enabled: "yes" },
    { enabled: true, directory: "relative" },
    { enabled: true, directory: "" },
    { enabled: true, directory: null },
    { enabled: true, maxFiles: 0 },
    { enabled: true, maxFiles: 1.5 },
    { enabled: true, maxFiles: "10" },
    { enabled: true, maxFiles: null },
  ]) {
    const { hooks, warnings } = await setupLogger(options)
    assert.equal(hooks.length, 0)
    assert.deepEqual(warnings, ["OpenCode request logger: invalid options; logging disabled."])
  }
})

test("filesystem failure does not prevent dispatch or leak error details", async (t) => {
  const { directory } = await temporaryLogs(t)
  await writeFile(directory, "PRIVATE_PATH_CONTENT")
  const { hooks, warnings } = await setupLogger({ enabled: true, directory })
  const hook = hooks[0]
  assert.ok(hook)
  const event = requestEvent('{"secret":"BODY_SECRET"}')
  await hook(event)
  await hook(requestEvent("{}"))
  assert.equal(await event.request.text(), '{"secret":"BODY_SECRET"}')
  assert.equal(warnings.length, 2)
  assert.ok(warnings.every((warning) => warning === "OpenCode request logger: capture failed; request unchanged."))
})

test("refuses a symlink log directory without changing its target permissions", async (t) => {
  const { root, directory } = await temporaryLogs(t)
  const target = join(root, "other")
  await mkdir(target, { mode: 0o755 })
  await chmod(target, 0o755)
  await symlink(target, directory)
  for (const path of [directory, `${directory}/`, `${directory}/.`]) {
    const { hooks, warnings } = await setupLogger({ enabled: true, directory: path })
    const hook = hooks[0]
    assert.ok(hook)
    await hook(requestEvent("{}"))
    assert.equal(warnings.length, 1)
    assert.deepEqual(await readdir(target), [])
    assert.equal((await stat(target)).mode & 0o777, 0o755)
  }
})

test("an HTTP server receives the same bytes that the logger captures", async (t) => {
  const { directory } = await temporaryLogs(t)
  const { hooks } = await setupLogger({ enabled: true, directory })
  const hook = hooks[0]
  assert.ok(hook)
  const server = createServer(async (request, response) => {
    const chunks: Buffer[] = []
    for await (const chunk of request) chunks.push(Buffer.from(chunk))
    response.end(Buffer.concat(chunks))
  })
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))
  t.after(() => new Promise<void>((resolve) => server.close(() => resolve())))
  const address = server.address()
  assert.ok(address && typeof address !== "string")
  const body = '{"instructions":"Unicode: café 🚀","tools":[{"name":"fixture"}]}\n'
  const event = requestEvent(body)
  event.request = new Request(`http://127.0.0.1:${address.port}/responses`, { method: "POST", body })
  await hook(event)
  const response = await fetch(event.request)
  assert.equal(await response.text(), body)
  const [filename] = await readdir(directory)
  assert.ok(filename)
  const record = JSON.parse(await readFile(join(directory, filename), "utf8"))
  assert.equal(record.body, body)
  assert.equal(record.audit.toolCount, 1)
  assert.equal(record.audit.toolBytes, Buffer.byteLength('[{"name":"fixture"}]'))
  assert.equal(record.audit.inputBytes, undefined)
})

test("captures binary bytes without losing invalid UTF-8", async (t) => {
  const { directory } = await temporaryLogs(t)
  const { hooks } = await setupLogger({ enabled: true, directory })
  const hook = hooks[0]
  assert.ok(hook)
  const bytes = new Uint8Array([0, 255, 128, 65])
  const event = requestEvent("{}")
  event.request = new Request("https://api.example.test/responses", { method: "POST", body: bytes })
  await hook(event)
  assert.deepEqual(new Uint8Array(await event.request.arrayBuffer()), bytes)
  const [filename] = await readdir(directory)
  assert.ok(filename)
  const record = JSON.parse(await readFile(join(directory, filename), "utf8"))
  assert.deepEqual(Buffer.from(record.bodyBase64, "base64"), Buffer.from(bytes))
  assert.equal(record.audit.totalBytes, 4)
})
