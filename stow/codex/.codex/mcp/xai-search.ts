import { execFile } from 'node:child_process'
import { createInterface } from 'node:readline'
import { fileURLToPath } from 'node:url'
import { inputSchema, runnerArgv, runnerOutcome, runnerStdin, RUNNER_FAILED, RUNNER_TIMEOUT_MS, TOOL_DESCRIPTION, TOOL_NAME } from '../../../pi/.pi/agent/extensions/xai-search/xai-shared.ts'

const extensionDir = fileURLToPath(new URL('../../../pi/.pi/agent/extensions/xai-search', import.meta.url))
const [node, ...args] = runnerArgv(extensionDir)
const tool = { name: TOOL_NAME, description: TOOL_DESCRIPTION, inputSchema }
const protocolVersions = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05']
type RequestId = number | string
interface Request {
  id?: RequestId
  method: string
  params?: { protocolVersion?: string; name?: string; arguments?: Record<string, unknown>; requestId?: RequestId }
}

const pending = new Map<RequestId, AbortController>()
const input = createInterface({ input: process.stdin, crlfDelay: Infinity })

function reply(id: RequestId | null, body: object) {
  process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id, ...body })}\n`)
}

function replyError(id: RequestId | null, code: number, message: string) {
  reply(id, { error: { code, message } })
}

function callTool(id: RequestId, params: Request['params']) {
  if (params?.name !== TOOL_NAME) return replyError(id, -32602, 'Unknown tool')
  const call = params.arguments
  if (!call || typeof call.query !== 'string' || !call.query.trim()) return replyError(id, -32602, 'Expected a nonempty query')

  const controller = new AbortController()
  pending.set(id, controller)
  const child = execFile(node, args, { signal: controller.signal, timeout: RUNNER_TIMEOUT_MS }, (error, stdout, stderr) => {
    pending.delete(id)
    if (controller.signal.aborted) return
    const outcome = error && typeof error.code !== 'number'
      ? { ok: false, text: RUNNER_FAILED }
      : runnerOutcome({ exitCode: error ? 1 : 0, stdout, stderr })
    reply(id, { result: { content: [{ type: 'text', text: outcome.text }], isError: !outcome.ok } })
  })
  child.stdin?.on('error', () => undefined)
  child.stdin?.end(runnerStdin(call))
}

input.on('line', (line) => {
  let request: Request
  try {
    request = JSON.parse(line)
  } catch {
    return replyError(null, -32700, 'Invalid JSON')
  }
  if (!request || typeof request.method !== 'string') return replyError(null, -32600, 'Invalid request')

  const { id, method, params } = request
  if (id === undefined) {
    if (method === 'notifications/cancelled' && params?.requestId !== undefined) pending.get(params.requestId)?.abort()
    return
  }
  if (method === 'initialize') {
    const requested = params?.protocolVersion
    const protocolVersion = requested && protocolVersions.includes(requested) ? requested : protocolVersions[0]
    return reply(id, { result: { protocolVersion, capabilities: { tools: {} }, serverInfo: { name: 'xai-search', version: '1.0.0' } } })
  }
  if (method === 'ping') return reply(id, { result: {} })
  if (method === 'tools/list') return reply(id, { result: { tools: [tool] } })
  if (method === 'tools/call') return callTool(id, params)
  return replyError(id, -32601, 'Method not found')
})

input.on('close', () => {
  for (const controller of pending.values()) controller.abort()
})
