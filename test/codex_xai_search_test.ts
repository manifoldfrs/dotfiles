import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { inputSchema, TOOL_DESCRIPTION, TOOL_NAME } from '../stow/pi/.pi/agent/extensions/xai-search/xai-shared.ts'

const server = fileURLToPath(new URL('../stow/codex/.codex/mcp/xai-search.ts', import.meta.url))

test('Codex MCP advertises Pi’s X search schema and rejects missing queries', { timeout: 5_000 }, async (t) => {
  const child = spawn(process.execPath, [server], { stdio: ['pipe', 'pipe', 'inherit'] })
  t.after(() => { child.kill() })
  const lines = createInterface({ input: child.stdout })
  const replies = lines[Symbol.asyncIterator]()
  t.after(() => lines.close())

  async function nextReply() {
    const line = await replies.next()
    assert.equal(line.done, false)

    return JSON.parse(line.value)
  }

  child.stdin.write([
    { id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18' } },
    { method: 'notifications/initialized' },
    { id: 2, method: 'tools/list' },
    { id: 3, method: 'tools/call', params: { name: TOOL_NAME, arguments: {} } },
  ].map((request) => JSON.stringify({ jsonrpc: '2.0', ...request })).join('\n') + '\n')

  const initialize = await nextReply()
  assert.equal(initialize.id, 1)
  assert.equal(initialize.result.protocolVersion, '2025-06-18')
  assert.deepEqual(initialize.result.capabilities, { tools: {} })

  const list = await nextReply()
  assert.deepEqual(list, { jsonrpc: '2.0', id: 2, result: { tools: [{ name: TOOL_NAME, description: TOOL_DESCRIPTION, inputSchema }] } })

  const invalid = await nextReply()
  assert.deepEqual(invalid, { jsonrpc: '2.0', id: 3, error: { code: -32602, message: 'Expected a nonempty query' } })
})
