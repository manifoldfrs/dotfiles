import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createInterface } from 'node:readline'
import { test, type TestContext } from 'node:test'
import { fileURLToPath } from 'node:url'
import { inputSchema, TOOL_DESCRIPTION, TOOL_NAME } from '../mcp/xai-search/schema.ts'

const server = fileURLToPath(new URL('../stow/codex/.codex/mcp/xai-search.ts', import.meta.url))
const fixture = `
  import assert from 'node:assert/strict'
  globalThis.fetch = async (url, init) => {
    assert.equal(url, 'https://api.x.ai/v1/responses')
    assert.equal(init.headers.Authorization, 'Bearer test-only-token')
    assert.equal(init.redirect, 'error')
    assert.deepEqual(JSON.parse(init.body), {
      model: 'grok-4.7',
      input: [{ role: 'user', content: 'Find the announcement' }],
      tools: [{ type: 'x_search', allowed_x_handles: ['example'], to_date: '2026-11-22' }],
      store: false,
    })
    return Response.json({
      output: [{ type: 'message', content: [{ type: 'output_text', text: 'Found a post' }] }],
      citations: ['https://x.com/example/status/1'],
    })
  }
`

function connect(t: TestContext, key?: string, grokHome?: string) {
  const preload = 'data:text/javascript,' + encodeURIComponent(fixture)
  const env = { PATH: '/usr/bin:/bin', XAI_API_KEY: key, GROK_HOME: grokHome }
  const child = spawn(process.execPath, ['--import', preload, server], { env, stdio: ['pipe', 'pipe', 'inherit'] })
  const lines = createInterface({ input: child.stdout })
  const replies = lines[Symbol.asyncIterator]()
  t.after(() => {
    lines.close()
    child.kill()
  })

  return async (id: number, method: string, params?: object) => {
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n')
    const line = await replies.next()
    assert.equal(line.done, false)
    const reply = JSON.parse(line.value)
    assert.equal(reply.id, id)
    return reply
  }
}

test('Codex discovers X search and sends a filtered xAI request with no Pi on PATH', { timeout: 5_000 }, async (t) => {
  const rpc = connect(t, 'test-only-token')
  const initialize = await rpc(1, 'initialize', { protocolVersion: '2025-06-18' })
  assert.equal(initialize.result.protocolVersion, '2025-06-18')

  const list = await rpc(2, 'tools/list')
  assert.deepEqual(list.result.tools, [{ name: TOOL_NAME, description: TOOL_DESCRIPTION, inputSchema }])

  const call = await rpc(3, 'tools/call', {
    name: TOOL_NAME,
    arguments: { query: 'Find the announcement', allowed_x_handles: ['@example'], to_date: '2026-11-22' },
  })
  assert.equal(call.result.isError, false)
  assert.match(call.result.content[0].text, /Found a post/)
  assert.match(call.result.content[0].text, /https:\/\/x\.com\/example\/status\/1/)
  assert.doesNotMatch(JSON.stringify(call), /test-only-token/)
})

test('Codex rejects an empty query and reports a missing Grok CLI', { timeout: 5_000 }, async (t) => {
  const rpc = connect(t, undefined, join(tmpdir(), 'absent-codex-x-search-grok-home'))
  const invalid = await rpc(1, 'tools/call', { name: TOOL_NAME, arguments: {} })
  assert.equal(invalid.error.code, -32602)

  const call = await rpc(2, 'tools/call', { name: TOOL_NAME, arguments: { query: 'Find the announcement' } })
  assert.equal(call.result.isError, true)
  assert.match(call.result.content[0].text, /Install Grok Build and run grok login/)
})

test('Codex uses a completed Grok X search without an API key', { timeout: 5_000 }, async (t) => {
  const grokHome = mkdtempSync(join(tmpdir(), 'x-search-grok-fixture-'))
  t.after(() => rmSync(grokHome, { recursive: true, force: true }))
  mkdirSync(join(grokHome, 'bin'))
  writeFileSync(join(grokHome, 'bin/grok'), `#!/bin/sh
case " $* " in
  *" --model grok-build --agent "*) ;;
  *) exit 1 ;;
esac
while [ "$1" != "--agent" ] && [ "$#" -gt 0 ]; do shift; done
grep -Fq 'tools: ["x_search"]' "$2" || exit 1
while [ "$1" != "--prompt-file" ] && [ "$#" -gt 0 ]; do shift; done
[ "$(cat "$2")" = "Find a recent post" ] || exit 1
printf '%s\\n' \
  '{"type":"tool_call","toolName":"x_search","toolCallId":"x"}' \
  '{"type":"tool_call_update","toolCallId":"x","status":"completed"}' \
  '{"type":"text","data":"Found https://x.com/example/status/1"}' \
  '{"type":"end","stopReason":"EndTurn"}'
`, { mode: 0o700 })

  const rpc = connect(t, undefined, grokHome)
  const call = await rpc(1, 'tools/call', { name: TOOL_NAME, arguments: { query: 'Find a recent post' } })
  assert.equal(call.result.isError, false)
  assert.match(call.result.content[0].text, /https:\/\/x\.com\/example\/status\/1/)

  const filter = await rpc(2, 'tools/call', { name: TOOL_NAME, arguments: { query: 'Find a post', allowed_x_handles: ['example'] } })
  assert.equal(filter.result.isError, true)
  assert.match(filter.result.content[0].text, /Exact filters/)
})
