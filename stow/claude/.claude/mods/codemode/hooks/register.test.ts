import { describe, expect, test } from 'claude-code/testing'
import { callAnswer, scriptCatalog, scriptDeadlineMs, takeMessages } from './codemode-shared.ts'

const TOOL = 'mcp__codemode__codemode'
const DIR = '/tmp/claude-codemode.test'

type Written = { path: string; body: unknown }

function line(message: unknown) {
  return `${JSON.stringify(message)}\n`
}

// A fake runner: announces its directory, asks for each call, waits for its answer file, then finishes.
function fakeRunner(calls: { id: number; tool: string; args: Record<string, unknown> }[], written: Written[], done: Record<string, unknown>) {
  return async function* () {
    yield { stream: 'stdout' as const, text: line({ t: 'ready', dir: DIR }) }
    for (const call of calls) yield { stream: 'stdout' as const, text: line({ t: 'call', ...call }) }
    while (written.filter(entry => entry.path.startsWith(`${DIR}/r-`)).length < calls.length) await new Promise(resolve => setTimeout(resolve, 5))
    yield { stream: 'stdout' as const, text: line({ t: 'done', keepDir: false, store: {}, ...done }) }
    return { value: { code: 0, signal: null } }
  }
}

function recordProcessRuns(on: Parameters<Parameters<typeof test>[1]>[1], written: Written[], removed: string[]) {
  on('session.id', () => ({ value: 'session-1' }))
  on('tool.list', () => ({ value: [{ name: 'Bash', description: 'Runs a command.', mcp: false }, { name: TOOL, description: 'codemode', mcp: true }] }))
  on('process.run', ($, e) => {
    if (e.argv[0] === 'rm') removed.push(e.argv[2]!)
    else written.push({ path: e.argv[4]!, body: JSON.parse(e.init?.stdin ?? 'null') })

    return { value: { exitCode: 0, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
}

describe('register', () => {
  test('declares codemode up front with a code input', async ($, on) => {
    let spec: Record<string, unknown> | undefined
    on('session.start', ($, e) => ({ cwd: e.cwd }))
    on('tool.register', ($, e) => {
      spec = e as unknown as Record<string, unknown>

      return { value: { tool: `mcp__codemode__${e.name}` } }
    })

    await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })

    expect(spec?.name).toBe('codemode')
    expect(spec?.isDeferred).toBe(false)
    expect(spec?.inputSchema).toMatchObject({ required: ['code'] })
  })

  test('runs nested calls through tool.call, answers the runner, and keeps store writes', async ($, on) => {
    const written: Written[] = []
    const removed: string[] = []
    const spawned: { argv: readonly string[]; input?: string }[] = []
    let bashInput: unknown
    on('session.start', ($, e) => ({ cwd: e.cwd }))
    on('tool.register', ($, e) => ({ value: { tool: `mcp__codemode__${e.name}` } }))
    on('tool.call', { tool: 'Bash' }, ($, e) => {
      bashInput = e

      return { result: { stdout: 'hi' }, text: 'hi' }
    })
    recordProcessRuns(on, written, removed)
    let run = 0
    on('process.spawn', async function* ($, e) {
      spawned.push({ argv: e.argv, input: e.input })
      run++

      return yield* run === 1
        ? fakeRunner([{ id: 1, tool: 'Bash', args: { command: 'echo hi' } }], written, { ok: true, text: 'Script completed\nOutput:\nhi', store: { cursor: 15 } })()
        : fakeRunner([], written, { ok: true, text: 'Script completed\nOutput:\n15' })()
    })

    await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
    const first = await $.tool.call({ tool: TOOL, code: 'return await tools.Bash({ command: "echo hi" })' })
    const second = await $.tool.call({ tool: TOOL, code: 'return load("cursor")' })

    expect(first.isError).toBeUndefined()
    expect(first.result).toBe('Script completed\nOutput:\nhi')
    expect(bashInput).toMatchObject({ tool: 'Bash', command: 'echo hi' })
    expect(written[0]).toEqual({ path: `${DIR}/r-1.json`, body: { ok: true, value: 'hi' } })
    expect(spawned[0]!.argv[1]).toMatch(/\/runner\/launch\.sh$/)
    expect(JSON.parse(spawned[1]!.input ?? '{}').store).toEqual({ cursor: 15 })
    expect(second.result).toBe('Script completed\nOutput:\n15')
    expect(removed).toEqual([DIR, DIR])
  })

  test('a failed script is an error result and keeps no store writes', async ($, on) => {
    const written: Written[] = []
    on('session.start', ($, e) => ({ cwd: e.cwd }))
    on('tool.register', ($, e) => ({ value: { tool: `mcp__codemode__${e.name}` } }))
    recordProcessRuns(on, written, [])
    on('process.spawn', async function* () {
      return yield* fakeRunner([], written, { ok: false, text: 'Script failed\nScript error:\nError: boom', store: {} })()
    })

    await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
    const ran = await $.tool.call({ tool: TOOL, code: 'throw new Error("boom")' })

    expect(ran.isError).toBe(true)
    expect(ran.text).toContain('Error: boom')
  })

  test('a runner that exits without finishing reports its stderr', async ($, on) => {
    on('session.start', ($, e) => ({ cwd: e.cwd }))
    on('tool.register', ($, e) => ({ value: { tool: `mcp__codemode__${e.name}` } }))
    recordProcessRuns(on, [], [])
    on('process.spawn', async function* () {
      yield { stream: 'stderr' as const, text: 'node: not found\n' }
      return { value: { code: 127, signal: null } }
    })

    await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
    const ran = await $.tool.call({ tool: TOOL, code: 'return 1' })

    expect(ran.isError).toBe(true)
    expect(ran.text).toContain('node: not found')
  })
})

describe('shared helpers', () => {
  test('scripts cannot call codemode itself', () => {
    expect(scriptCatalog([{ name: 'Bash', description: 'b' }, { name: TOOL, description: 'c' }]).map(tool => tool.name)).toEqual(['Bash'])
  })

  test('the deadline follows timeout_ms with slack, capped at ten minutes', () => {
    expect(scriptDeadlineMs('// @options: {"timeout_ms": 1000}\nreturn 1')).toBe(3_000)
    expect(scriptDeadlineMs('// @options: {"timeout_ms": 99999999}')).toBe(600_000)
    expect(scriptDeadlineMs('return 1')).toBe(600_000)
  })

  test('streamed stdout splits into whole messages', () => {
    const { messages, rest } = takeMessages('{"t":"ready","dir":"/d"}\n{"t":"ca')
    expect(messages).toEqual([{ t: 'ready', dir: '/d' }])
    expect(rest).toBe('{"t":"ca')
  })

  test('nested call outcomes map to answers', () => {
    expect(callAnswer({ text: 'ok', result: {} })).toEqual({ ok: true, value: 'ok' })
    expect(callAnswer({ deny: 'blocked by hook' })).toEqual({ ok: false, error: 'blocked by hook' })
    expect(callAnswer({ isError: true, text: 'no order' })).toEqual({ ok: false, error: 'no order' })
  })
})
