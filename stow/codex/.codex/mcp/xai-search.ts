import { createInterface } from 'node:readline'
import { inputSchema, TOOL_DESCRIPTION, TOOL_NAME } from '../../../../mcp/xai-search/schema.ts'
import { postXaiSearch, XAI_API_BASE_URL, XaiBearerToken } from '../../../../mcp/xai-search/xai-client.ts'
import { formatXaiSearchResponse } from '../../../../mcp/xai-search/xai-format.ts'
import { buildXaiSearchRequest, type XaiSearchParams } from '../../../../mcp/xai-search/xai-request.ts'
import { runGrokSearch } from './grok-search.ts'

const DEFAULT_MODEL = 'grok-4.7'
const tool = { name: TOOL_NAME, description: TOOL_DESCRIPTION, inputSchema }
const protocolVersions = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05']

type RequestId = number | string
interface Request {
  id?: RequestId
  method: string
  params?: { protocolVersion?: string; name?: string; arguments?: XaiSearchParams; requestId?: RequestId }
}

const pending = new Map<RequestId, AbortController>()
const input = createInterface({ input: process.stdin, crlfDelay: Infinity })

function reply(id: RequestId | null, body: object) {
  process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id, ...body })}\n`)
}

function replyError(id: RequestId | null, code: number, message: string) {
  reply(id, { error: { code, message } })
}

function replyTool(id: RequestId, text: string, isError: boolean) {
  reply(id, { result: { content: [{ type: 'text', text }], isError } })
}

async function callTool(id: RequestId, params: Request['params']) {
  if (params?.name !== TOOL_NAME) return replyError(id, -32602, 'Unknown tool')
  const call = params.arguments
  if (!call || typeof call.query !== 'string' || !call.query.trim()) return replyError(id, -32602, 'Expected a nonempty query')

  const controller = new AbortController()
  pending.set(id, controller)
  try {
    const key = process.env.XAI_API_KEY?.trim()
    if (!key) {
      const text = await runGrokSearch(buildXaiSearchRequest(call, undefined), controller.signal)
      if (!controller.signal.aborted) replyTool(id, text, false)
      return
    }

    const request = buildXaiSearchRequest(call, DEFAULT_MODEL)
    const runtime = { baseUrl: XAI_API_BASE_URL, bearer: new XaiBearerToken(key) }
    const response = await postXaiSearch(runtime, request, { fetch, signal: controller.signal })
    const searched = request.sources.length === 2 ? 'both' : request.sources[0]
    if (!controller.signal.aborted) {
      replyTool(id, formatXaiSearchResponse(response, request.model, searched).text, false)
    }
  } catch (error) {
    if (!controller.signal.aborted) {
      replyTool(id, error instanceof Error ? error.message : 'xAI search failed', true)
    }
  } finally {
    pending.delete(id)
  }
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
  if (method === 'tools/call') {
    void callTool(id, params)
    return
  }
  return replyError(id, -32601, 'Method not found')
})

input.on('close', () => {
  for (const controller of pending.values()) controller.abort()
})
