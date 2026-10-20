import { describe, expect, mock, test } from 'claude-code/testing'

function step(model: string, index: number) {
  return { turnId: 't1', index, model, messageCount: 1 }
}

async function drain<R>(stream: AsyncGenerator<unknown, R> & { result: Promise<R> }) {
  for await (const _ of stream);
  return stream.result
}

function usage(model: string) {
  return { model, input_tokens: 1, output_tokens: 1, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 }
}

describe('register', () => {
  test('charges each step the growth of the session total, by answering model', async ($, on) => {
    const files = new Map<string, string>()
    let usd = 0.5
    on('session.start', ($, e) => ({ cwd: e.cwd }))
    on('session.id', () => ({ value: 'abc-123' }))
    mock.env(on, { TMPDIR: '/tmp/x' })
    on('session.usage', () => ({ value: { startedAt: 0, context: { window: 1_000_000 }, rateLimits: [], cost: { usd } } }))
    on('fs.read', ($, e) => {
      const text = files.get(e.path)
      if (text === undefined) throw new Error('ENOENT')
      return { value: text }
    })
    on('fs.write', ($, e) => {
      files.set(e.path, e.text)
      return { value: undefined }
    })
    on('turn.step', async function* ($, e) {
      usd += e.model.includes('opus') ? 1 : 0.25
      return { turnId: e.turnId, index: e.index, answer: '', toolUses: [], stopReason: 'end_turn' as const, usage: usage(e.model) }
    })

    await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
    await drain($.turn.step(step('claude-opus-5-5', 0)))
    await drain($.turn.step(step('claude-sonnet-5-5', 1)))
    await drain($.turn.step(step('claude-opus-5-5', 2)))

    expect(JSON.parse(files.get('/tmp/x/claude-model-cost-abc-123.json') ?? '{}')).toEqual({
      'claude-opus-5-5': 2,
      'claude-sonnet-5-5': 0.25,
    })
  })

  test('starts over when the session total drops after /clear', async ($, on) => {
    const files = new Map<string, string>([['/tmp/claude-model-cost-abc-123.json', '{"claude-opus-5-5":3}']])
    let usd = 3
    on('session.start', ($, e) => ({ cwd: e.cwd }))
    on('session.id', () => ({ value: 'abc-123' }))
    mock.env(on, {})
    on('session.usage', () => ({ value: { startedAt: 0, context: { window: 1_000_000 }, rateLimits: [], cost: { usd } } }))
    on('fs.read', ($, e) => ({ value: files.get(e.path) ?? '' }))
    on('fs.write', ($, e) => {
      files.set(e.path, e.text)
      return { value: undefined }
    })
    on('turn.step', async function* ($, e) {
      return { turnId: e.turnId, index: e.index, answer: '', toolUses: [], stopReason: 'end_turn' as const, usage: usage(e.model) }
    })

    await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
    usd = 0.5
    await drain($.turn.step(step('claude-sonnet-5-5', 0)))

    expect(JSON.parse(files.get('/tmp/claude-model-cost-abc-123.json') ?? '{}')).toEqual({ 'claude-sonnet-5-5': 0.5 })
  })
})
