import type { EngineInterface, Register } from 'claude-code'
import {
  LAUNCHER,
  TOOL_DESCRIPTION,
  TOOL_NAME,
  callAnswer,
  errorMessage,
  inputSchema,
  scriptCatalog,
  scriptDeadlineMs,
  takeMessages,
  type RunnerMessage,
} from './codemode-shared.ts'

// store()/load() values per session; they last as long as the module, not across resumes.
const stores = new Map<string, Record<string, unknown>>()

function failed(text: string) {
  return { isError: true as const, result: text, text }
}

// The runner reads answers from files because a spawned child takes stdin only once.
async function answerCall($: EngineInterface, dir: string, message: Extract<RunnerMessage, { t: 'call' }>) {
  const outcome = await $.tool
    .call({ tool: message.tool, ...message.args } as Parameters<EngineInterface['tool']['call']>[0])
    .then(result => callAnswer(result as Parameters<typeof callAnswer>[0]))
    .catch((error: unknown) => ({ ok: false as const, error: errorMessage(error) }))
  const target = `${dir}/r-${message.id}.json`
  await $.process
    .run(['/bin/sh', '-c', 'cat > "$1.tmp" && mv "$1.tmp" "$1"', 'sh', target], { stdin: JSON.stringify(outcome) })
    .catch(() => undefined)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.tool.register({ name: TOOL_NAME, description: TOOL_DESCRIPTION, inputSchema, isDeferred: false })

    return next(e)
  })

  on('tool.call', { tool: 'mcp__codemode__codemode' }, async ($, e, next) => {
    const code = typeof (e as { code?: unknown }).code === 'string' ? (e as { code: string }).code : ''
    if (!code.trim()) return failed('codemode needs a non-empty `code` string.')

    const sessionId = await $.session.id()
    const store = stores.get(sessionId) ?? {}
    const tools = scriptCatalog(await $.tool.list())
    const child = $.process.spawn({
      argv: ['/bin/sh', `${$.plugin.root}/${LAUNCHER}`],
      input: JSON.stringify({ code, tools, store }),
    })

    const deadline = new AbortController()
    void $.clock
      .sleep(scriptDeadlineMs(code), { signal: deadline.signal })
      .then(() => deadline.abort())
      .catch(() => undefined)
    const stop = () => deadline.abort()
    next.signal?.addEventListener('abort', stop)

    let dir: string | undefined
    let done: Extract<RunnerMessage, { t: 'done' }> | undefined
    let buffer = ''
    let stderr = ''
    const iterator = child[Symbol.asyncIterator]()
    const aborted = new Promise<'aborted'>(resolve => deadline.signal.addEventListener('abort', () => resolve('aborted')))

    try {
      while (!done) {
        const step = await Promise.race([iterator.next(), aborted])
        if (step === 'aborted' || step.done) break
        const piece = step.value as { stream: string; text: string }
        if (piece.stream === 'stderr') {
          stderr += piece.text
          continue
        }
        const parsed = takeMessages(buffer + piece.text)
        buffer = parsed.rest
        for (const message of parsed.messages) {
          if (message.t === 'ready') dir = message.dir
          if (message.t === 'call' && dir) void answerCall($, dir, message)
          if (message.t === 'done') done = message
        }
      }
    } finally {
      deadline.abort()
      next.signal?.removeEventListener('abort', stop)
      await iterator.return?.(undefined).catch(() => undefined)
      if (dir && !done?.keepDir) await $.process.run(['rm', '-rf', dir]).catch(() => undefined)
    }

    if (!done) {
      if (next.signal?.aborted) return failed('Script failed\nThe script was interrupted.')
      const reason = stderr.trim() ? `\n${stderr.trim().slice(-2000)}` : ''
      return failed(`Script failed\nThe script did not finish within its deadline or the runner stopped.${reason}`)
    }

    if (done.ok) {
      for (const [key, value] of Object.entries(done.store)) {
        if (value === null) delete store[key]
        else store[key] = value
      }
      stores.set(sessionId, store)
      return { result: done.text }
    }
    return failed(done.text)
  }).catch(() => failed('Script failed\ncodemode stopped unexpectedly before the script finished.'))
}
