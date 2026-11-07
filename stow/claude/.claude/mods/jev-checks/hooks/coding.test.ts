import { describe, expect, test } from 'claude-code/testing'
import type { On } from 'claude-code'

import type { Json } from './jev-shared.ts'

type Verdict = { classification: string; decision?: string }

function engine(on: On, verdicts: (text: string) => Verdict, isEditFailing = false) {
  const requests: { context: unknown; texts: string[] }[] = []
  on('turn.start', ($, e) => ({ turnId: e.turnId }))
  on('tool.call', () => (isEditFailing ? { result: 'old_string not found', isError: true as const } : { result: { ok: true } }))
  on('classic.Stop', () => ({}))
  on('mcp.call', ($, e) => {
    // SAFETY: the only Jev call this helper answers is the mod's jev_classify, which always sends this shape.
    const items = e.args.items as { id: string; text: string }[]
    requests.push({ context: e.args.context, texts: items.map(item => item.text) })

    const results = items.map(item => {
      const verdict = verdicts(item.text)

      return { id: item.id, top_probability: 0.9, decision: 'auto', ...verdict }
    })

    return { value: { content: [{ type: 'text' as const, text: JSON.stringify({ results }) }], isError: false } }
  })

  return requests
}

const edit = (file: string, before: string, after: string) => ({ tool: 'Edit' as const, file_path: file, old_string: before, new_string: after })

describe('register', () => {
  test('reminds about jev_decide on the first edit of a turn only', async ($, on) => {
    engine(on, () => ({ classification: 'requested' }))

    await $.turn.start({ text: 'add the endpoint', turnId: 't1' })
    const first = await $.tool.call(edit('/w/a.ts', 'a', 'b'))
    const second = await $.tool.call(edit('/w/b.ts', 'c', 'd'))

    expect(first.context?.[0]).toContain('Jev decision check')
    expect(second.context).toBeUndefined()
  })

  test('blocks the stop once when Jev confidently flags an edit', async ($, on) => {
    const requests = engine(on, text => (text.includes('console.log') ? { classification: 'leftover' } : { classification: 'requested' }))

    await $.turn.start({ text: 'add the endpoint', turnId: 't1' })
    await $.tool.call(edit('/w/api.ts', '', 'export function endpoint() {}'))
    await $.tool.call({ tool: 'Write', file_path: '/w/debug.ts', content: 'console.log("here")' })
    const stopped = await $.classic.Stop({ stop_hook_active: false })
    const again = await $.classic.Stop({ stop_hook_active: true })

    expect(stopped.block).toBe(
      [
        'Jev classified edits from this turn as outside the request:',
        '- /w/debug.ts (leftover, p=0.9): console.log("here")',
        'For each one, revert it or tell the user why it was needed, then finish. Write your reply for someone who has not read this message.',
      ].join('\n'),
    )
    expect(again.block).toBeUndefined()
    expect(requests).toEqual([
      {
        context: { request: 'add the endpoint' },
        texts: ['/w/api.ts\n+++ after\nexport function endpoint() {}', '/w/debug.ts\n+++ after\nconsole.log("here")'],
      },
    ])
  })

  test('previews the first changed line of a flagged edit', async ($, on) => {
    engine(on, () => ({ classification: 'leftover' }))

    await $.turn.start({ text: 'rename foo', turnId: 't1' })
    await $.tool.call(edit('/w/app.py', 'def double(x):\n    return x', 'def double(x):\n    print("DEBUG")\n    return x'))
    const stopped = await $.classic.Stop({ stop_hook_active: false })

    expect(stopped.block).toContain('- /w/app.py (leftover, p=0.9): print("DEBUG")')
  })

  test('lets the agent finish when flags are only uncertain', async ($, on) => {
    engine(on, () => ({ classification: 'speculative', decision: 'review' }))

    await $.turn.start({ text: 'add the endpoint', turnId: 't1' })
    await $.tool.call(edit('/w/api.ts', 'a', 'b'))
    const stopped = await $.classic.Stop({ stop_hook_active: false })

    expect(stopped.block).toBeUndefined()
  })

  test('does not call Jev for a turn without edits', async ($, on) => {
    const requests = engine(on, () => ({ classification: 'requested' }))

    await $.turn.start({ text: 'what does this do?', turnId: 't1' })
    const stopped = await $.classic.Stop({ stop_hook_active: false })

    expect(stopped.block).toBeUndefined()
    expect(requests).toEqual([])
  })

  test('blocks once for manual review if the audit cannot run', async ($, on) => {
    engine(on, () => { throw new Error('unavailable') })
    await $.turn.start({ text: 'add the endpoint', turnId: 't1' })
    await $.tool.call(edit('/w/api.ts', 'a', 'b'))

    const stopped = await $.classic.Stop({ stop_hook_active: false })
    const again = await $.classic.Stop({ stop_hook_active: true })

    expect(stopped.block).toContain('Automatic Jev edit-scope audit failed')
    expect(stopped.block).toContain('final review and completion gate')
    expect(again.block).toBeUndefined()
  })

  test('blocks for manual review on incomplete audit results', async ($, on) => {
    on('turn.start', ($, e) => ({ turnId: e.turnId }))
    on('tool.call', () => ({ result: { ok: true } }))
    on('classic.Stop', () => ({}))
    on('mcp.call', () => ({ value: { content: [{ type: 'text' as const, text: '{"results":[]}' }], isError: false } }))
    await $.turn.start({ text: 'add the endpoint', turnId: 't1' })
    await $.tool.call(edit('/w/api.ts', 'a', 'b'))

    const stopped = await $.classic.Stop({ stop_hook_active: false })

    expect(stopped.block).toContain('Automatic Jev edit-scope audit failed')
  })

  test('skips failed edits', async ($, on) => {
    const requests = engine(on, () => ({ classification: 'requested' }), true)

    await $.turn.start({ text: 'add the endpoint', turnId: 't1' })
    await $.tool.call(edit('/w/api.ts', 'a', 'b'))
    await $.classic.Stop({ stop_hook_active: false })

    expect(requests).toEqual([])
  })
})

type Fakes = { extraction: Json; verify?: () => Json; audit?: Json; failing?: boolean; output?: string }

const LONG_ANSWER = 'x'.repeat(500)
const usage = { input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 }

function checker(on: On, fakes: Fakes) {
  const calls: { tool: string; args: string }[] = []
  const logs: string[] = []
  const extractions: string[] = []
  on('turn.start', ($, e) => ({ turnId: e.turnId }))
  on('tool.call', () => {
    const output = fakes.output ?? 'opencode v2.2.5'

    return { result: output, text: output }
  })
  on('classic.Stop', () => ({}))
  on('ui.log', ($, e) => {
    logs.push(e.text)

    return { value: undefined }
  })
  on('model.complete', ($, e) => {
    extractions.push(String(e.prompt))

    return { value: { isAnswered: true as const, text: JSON.stringify(fakes.extraction), usage } }
  })
  on('mcp.call', ($, e) => {
    calls.push({ tool: e.tool, args: JSON.stringify(e.args) })

    if (fakes.failing) return { value: { content: [], isError: true } }
    const answer = e.tool === 'jev_verify' ? fakes.verify?.() : fakes.audit

    return { value: { content: [{ type: 'text' as const, text: JSON.stringify(answer) }], isError: false } }
  })

  return { calls, logs, extractions }
}

const contradicted = () => ({ results: [{ verdict: 'contradicted', confidence: 0.95 }] })
const claim = { claims: [{ text: 'OpenCode 2.3.0 is installed', source: 'tool' }], values: [] }
const stop = { stop_hook_active: false, last_assistant_message: LONG_ANSWER }

describe('answer check', () => {
  test('sends the agent back on a confident contradiction, once, and shows the person why', async ($, on) => {
    const { calls, logs } = checker(on, { extraction: claim, verify: contradicted })

    await $.turn.start({ text: 'which version?', turnId: 't1' })
    await $.tool.call({ tool: 'Bash', command: 'opencode --version' })
    const stopped = await $.classic.Stop(stop)
    const again = await $.classic.Stop({ ...stop, stop_hook_active: true })

    expect(stopped.block).toContain('- Contradicted by the tool output (confidence 0.95): OpenCode 2.3.0 is installed')
    expect(stopped.block).toContain('write it for someone who has not read this message')
    expect(again.block).toBeUndefined()
    expect(logs[0]).toContain('OpenCode 2.3.0 is installed')
    expect(calls[0]?.args).toContain('opencode v2.2.5')
    expect(calls[0]?.args).toContain('opencode --version')
  })

  test('stays quiet when the evidence supports the answer', async ($, on) => {
    checker(on, { extraction: claim, verify: () => ({ results: [{ verdict: 'verified', confidence: 0.99 }] }) })

    await $.turn.start({ text: 'which version?', turnId: 't1' })
    await $.tool.call({ tool: 'Bash', command: 'opencode --version' })

    expect((await $.classic.Stop(stop)).block).toBeUndefined()
  })

  test('does not send the agent back when a check fails, and tells the person', async ($, on) => {
    const { logs } = checker(on, { extraction: claim, failing: true })

    await $.turn.start({ text: 'which version?', turnId: 't1' })
    await $.tool.call({ tool: 'Bash', command: 'opencode --version' })

    expect((await $.classic.Stop(stop)).block).toBeUndefined()
    expect(logs).toEqual(['Jev answer check did not run: jev_verify failed'])
  })

  test('skips a turn that ran no tools and a short answer', async ($, on) => {
    const { calls } = checker(on, { extraction: claim, verify: contradicted })

    await $.turn.start({ text: 'hello', turnId: 't1' })
    await $.classic.Stop(stop)
    await $.turn.start({ text: 'which version?', turnId: 't2' })
    await $.tool.call({ tool: 'Bash', command: 'opencode --version' })
    await $.classic.Stop({ ...stop, last_assistant_message: 'short' })

    expect(calls).toEqual([])
  })

  test('skips when the reply text is absent', async ($, on) => {
    const { calls } = checker(on, { extraction: claim, verify: contradicted })

    await $.turn.start({ text: 'which version?', turnId: 't1' })
    await $.tool.call({ tool: 'Bash', command: 'opencode --version' })
    await $.classic.Stop({ stop_hook_active: false })

    expect(calls).toEqual([])
  })

  test('does not count Jev results or subagent tool calls as evidence', async ($, on) => {
    const { calls } = checker(on, { extraction: claim, verify: contradicted })

    await $.turn.start({ text: 'which version?', turnId: 't1' })
    await $.tool.call({ tool: 'mcp__jev__jev_verify', claims: ['x'] })
    await $.tool.call({ tool: 'Bash', command: 'opencode --version', agentId: 'a1' })
    await $.classic.Stop(stop)

    expect(calls).toEqual([])
  })

  test('a flagged value the evidence says nothing about only warns', async ($, on) => {
    checker(on, {
      extraction: { claims: [], values: [{ request: 'the port', value: '1234', source: 'tool' }] },
      audit: { records: [{ id: 'v1', action: 'wrong', p_wrong: 0.9 }] },
      verify: () => ({ results: [{ verdict: 'unsupported', confidence: 0.9 }] }),
    })

    await $.turn.start({ text: 'which port?', turnId: 't1' })
    await $.tool.call({ tool: 'Bash', command: 'cat config.txt' })

    expect((await $.classic.Stop(stop)).block).toBeUndefined()
  })

  test('a flagged value the evidence contradicts sends the agent back', async ($, on) => {
    checker(on, {
      extraction: { claims: [], values: [{ request: 'the port', value: '1234', source: 'tool' }] },
      audit: { records: [{ id: 'v1', action: 'wrong', p_wrong: 0.9 }] },
      verify: contradicted,
    })

    await $.turn.start({ text: 'which port?', turnId: 't1' })
    await $.tool.call({ tool: 'Bash', command: 'cat config.txt' })

    expect((await $.classic.Stop(stop)).block).toContain('Contradicted by the tool output (confidence 0.95): the port = 1234')
  })

  test('a timed claim is never a send-back', async ($, on) => {
    checker(on, { extraction: { claims: [{ text: 'No error since the reload', source: 'tool', timed: true }], values: [] }, verify: contradicted })

    await $.turn.start({ text: 'any errors?', turnId: 't1' })
    await $.tool.call({ tool: 'Bash', command: 'tail log' })

    expect((await $.classic.Stop(stop)).block).toBeUndefined()
  })

  test('batches that disagree are not a send-back', async ($, on) => {
    let call = 0

    const { calls } = checker(on, {
      extraction: claim,
      output: 'y'.repeat(5_000),
      verify: () => {
        call += 1

        return call === 1 ? contradicted() : { results: [{ verdict: 'verified', confidence: 0.99 }] }
      },
    })

    await $.turn.start({ text: 'which version?', turnId: 't1' })

    for (let index = 0; index < 8; index += 1) await $.tool.call({ tool: 'Read', file_path: `/w/${index}` })

    expect((await $.classic.Stop(stop)).block).toBeUndefined()
    expect(calls.length).toBeGreaterThan(1)
  })
})

describe('secrets', () => {
  const bash = (command: string) => ({ tool: 'Bash' as const, command })

  test('sends nothing from a secret file, and skips the check when nothing else ran', async ($, on) => {
    const { calls } = checker(on, { extraction: claim, verify: contradicted, output: 'lower_key=abc123' })

    await $.turn.start({ text: 'check it', turnId: 't1' })
    await $.tool.call(bash('cat .env.local'))
    await $.tool.call({ tool: 'Read', file_path: '/home/me/.ssh/config' })
    await $.classic.Stop(stop)

    expect(calls).toEqual([])
  })

  test('keeps other tool output when a secret file was also read', async ($, on) => {
    const { calls } = checker(on, { extraction: claim, verify: contradicted, output: 'safe output' })

    await $.turn.start({ text: 'check it', turnId: 't1' })
    await $.tool.call(bash('cat .env'))
    await $.tool.call(bash('opencode --version'))
    await $.classic.Stop(stop)

    expect(calls[0]?.args).toContain('opencode --version')
    expect(calls[0]?.args).not.toContain('cat .env')
  })

  test('removes lines holding secrets and keeps the rest', async ($, on) => {
    const output = [
      '{',
      '  "access_token": "abc123",',
      '  "port": 49374',
      '}',
      'API_KEY=def456',
      'password: ghi789',
      'Authorization: Bearer jkl012',
      'found sk-ant-mno345mno345mno345',
      '-----BEGIN RSA PRIVATE KEY-----',
      'pqr678',
      '-----END RSA PRIVATE KEY-----',
      'PORT=49374',
      'app-version=1.2.3',
    ].join('\n')

    const { calls } = checker(on, { extraction: claim, verify: contradicted, output })

    await $.turn.start({ text: 'check it', turnId: 't1' })
    await $.tool.call(bash('some-command'))
    await $.classic.Stop(stop)

    for (const secret of ['abc123', 'def456', 'ghi789', 'jkl012', 'mno345', 'pqr678']) expect(calls[0]?.args).not.toContain(secret)

    expect(calls[0]?.args).toContain('PORT=49374')
    expect(calls[0]?.args).toContain('app-version=1.2.3')
    expect(calls[0]?.args).toContain('\\"port\\": 49374')
  })

  test('keeps a secret the person pasted out of the evidence', async ($, on) => {
    const { calls } = checker(on, { extraction: claim, verify: contradicted })

    await $.turn.start({ text: 'use token=abc123 please', turnId: 't1' })
    await $.tool.call(bash('opencode --version'))
    await $.classic.Stop(stop)

    expect(calls[0]?.args).not.toContain('abc123')
  })

  test('removes a secret Claude repeats in its reply before claims are extracted', async ($, on) => {
    const { extractions } = checker(on, { extraction: claim, verify: contradicted })

    await $.turn.start({ text: 'check it', turnId: 't1' })
    await $.tool.call(bash('opencode --version'))
    await $.classic.Stop({ ...stop, last_assistant_message: `${LONG_ANSWER}\napi_key: abc123\nthe rest` })

    expect(extractions[0]).toContain('the rest')
    expect(extractions[0]).not.toContain('abc123')
  })

  test('sends edits to secret files nowhere, and removes secrets from other edits', async ($, on) => {
    const requests = engine(on, () => ({ classification: 'requested' }))

    await $.turn.start({ text: 'add the key', turnId: 't1' })
    await $.tool.call({ tool: 'Write', file_path: '/w/.env', content: 'lower_key=abc123' })
    await $.tool.call({ tool: 'Write', file_path: '/w/config.ts', content: 'const apiKey = "def456"\nexport {}' })
    await $.classic.Stop({ stop_hook_active: false })

    expect(requests[0]?.texts).toEqual(['/w/config.ts\n+++ after\nexport {}'])
  })
})
