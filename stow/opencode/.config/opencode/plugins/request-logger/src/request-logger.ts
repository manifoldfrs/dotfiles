import { Plugin } from "@opencode/plugin"
import type { SessionHttpRequest } from "@opencode/plugin/promise/session"
import { randomUUID } from "node:crypto"
import { chmod, lstat, mkdir, readdir, unlink, writeFile } from "node:fs/promises"
import { homedir } from "node:os"
import { isAbsolute, join, resolve } from "node:path"

type RequestLogOptions =
  | { status: "disabled" | "invalid" }
  | { status: "enabled"; directory: string; maxFiles: number }

function parseRequestLogOptions(options: Record<string, unknown>): RequestLogOptions {
  if (options.enabled !== undefined && typeof options.enabled !== "boolean") return { status: "invalid" }
  if (options.enabled !== true) return { status: "disabled" }
  const directory = options.directory === undefined
    ? join(homedir(), ".local", "state", "opencode", "requests")
    : options.directory
  const maxFiles = options.maxFiles === undefined ? 100 : options.maxFiles
  if (typeof directory !== "string" || !isAbsolute(directory)) return { status: "invalid" }
  if (typeof maxFiles !== "number" || !Number.isSafeInteger(maxFiles) || maxFiles < 1) return { status: "invalid" }
  return { status: "enabled", directory: resolve(directory), maxFiles }
}

function isRequestPayloadRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function auditRequestLogBody(body: string, totalBytes: number) {
  let payload: unknown
  try {
    payload = JSON.parse(body)
  } catch {
    return { totalBytes }
  }
  if (!isRequestPayloadRecord(payload)) return { totalBytes }
  const system = payload.instructions ?? payload.system
  const input = payload.input ?? payload.messages
  return {
    totalBytes,
    ...(system === undefined ? {} : { systemBytes: Buffer.byteLength(JSON.stringify(system)) }),
    ...(input === undefined ? {} : { inputBytes: Buffer.byteLength(JSON.stringify(input)) }),
    ...(Array.isArray(payload.tools)
      ? { toolBytes: Buffer.byteLength(JSON.stringify(payload.tools)), toolCount: payload.tools.length }
      : {}),
  }
}

async function pruneRequestLogs(directory: string, maxFiles: number) {
  const files = (await readdir(directory, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && /^opencode-http-\d{4}-\d{2}-\d{2}T[\d-]+Z_[\da-f-]{36}\.json$/.test(entry.name))
    .map((entry) => entry.name)
    .sort()
  for (const filename of files.slice(0, Math.max(0, files.length - maxFiles))) {
    await unlink(join(directory, filename))
  }
}

async function writeRequestLog(event: SessionHttpRequest, request: Request, directory: string, maxFiles: number) {
  await mkdir(directory, { recursive: true, mode: 0o700 })
  const info = await lstat(directory)
  if (!info.isDirectory() || info.isSymbolicLink()) throw new Error("OpenCode request logger: unsafe directory")
  await chmod(directory, 0o700)
  const bytes = Buffer.from(await request.arrayBuffer())
  const body = bytes.toString("utf8")
  const timestamp = new Date().toISOString()
  const filename = `opencode-http-${timestamp.replaceAll(":", "-").replace(".", "-")}_${randomUUID()}.json`
  const record = {
    timestamp,
    sessionID: event.sessionID,
    agent: event.agent,
    model: event.model,
    kind: event.kind,
    transport: "http",
    audit: auditRequestLogBody(body, bytes.length),
    body,
    ...(bytes.equals(Buffer.from(body)) ? {} : { bodyBase64: bytes.toString("base64") }),
  }
  await writeFile(join(directory, filename), `${JSON.stringify(record, null, 2)}\n`, { mode: 0o600, flag: "wx" })
  await pruneRequestLogs(directory, maxFiles)
}

/** Creates an opt-in HTTP request logger; warnings never include payloads or errors. */
export function createRequestLoggerPlugin(warn: (message: string) => void = console.warn) {
  return Plugin.define({
    id: "frsh.request-logger",
    async setup(context) {
      const options = parseRequestLogOptions(context.options)
      if (options.status === "invalid") warn("OpenCode request logger: invalid options; logging disabled.")
      if (options.status !== "enabled") return
      let pending = Promise.resolve()
      await context.session.hook("http.request", async (event) => {
        const capture = pending.then(() => writeRequestLog(event, event.request.clone(), options.directory, options.maxFiles))
          .catch(() => { warn("OpenCode request logger: capture failed; request unchanged.") })
        pending = capture
        await capture
      })
    },
  })
}

export default createRequestLoggerPlugin()
