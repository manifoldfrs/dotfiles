import type { Register } from 'claude-code'
import { RUNNER_FAILED, RUNNER_TIMEOUT_MS, TOOL_DESCRIPTION, TOOL_NAME, inputSchema, runnerArgv, runnerOutcome, runnerStdin } from './xai-shared.ts'

function failed(text: string) {
  return { isError: true as const, result: text, text }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.tool.register({ name: TOOL_NAME, description: TOOL_DESCRIPTION, inputSchema })

    return next(e)
  })

  on('tool.call', { tool: 'mcp__xai-search__xai_search' }, async ($, e) => {
    const run = await $.process
      .run(runnerArgv($.plugin.root), { stdin: runnerStdin(e), timeoutMs: RUNNER_TIMEOUT_MS })
      .catch(() => undefined)

    if (!run) return failed(RUNNER_FAILED)

    const outcome = runnerOutcome(run)

    return outcome.ok ? { result: outcome.text } : failed(outcome.text)
  })
}
