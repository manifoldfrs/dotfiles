import { describe, expect, test } from 'claude-code/testing'
import type { On } from 'claude-code'

type Verdict = { classification: string; decision?: string }

function engine(on: On, verdicts: (text: string) => Verdict, isEditFailing = false) {
  const requests: { context: unknown; texts: string[] }[] = []
  on('turn.start', ($, e) => ({ turnId: e.turnId }))
  on('tool.call', () => (isEditFailing ? { result: 'old_string not found', isError: true as const } : { result: { ok: true } }))
  on('classic.Stop', () => ({}))
  on('mcp.call', ($, e) => {
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
        'For each one, revert it or tell the user why it was needed, then finish.',
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

  test('skips failed edits', async ($, on) => {
    const requests = engine(on, () => ({ classification: 'requested' }), true)

    await $.turn.start({ text: 'add the endpoint', turnId: 't1' })
    await $.tool.call(edit('/w/api.ts', 'a', 'b'))
    await $.classic.Stop({ stop_hook_active: false })

    expect(requests).toEqual([])
  })
})
