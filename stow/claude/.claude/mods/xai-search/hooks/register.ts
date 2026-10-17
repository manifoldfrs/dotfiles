import type { Register } from 'claude-code'

const TOOL_NAME = 'xai_search'
// The Pi extension owns the xAI auth guards and request bounds; this mod only adapts its runner.
const RUNNER = '../../../../pi/.pi/agent/extensions/xai-search/run-xai-search.ts'
// Pinned so a project's mise Node version cannot pick a runtime without native TypeScript.
const NODE = '/opt/homebrew/bin/node'
// The runner's own request timeout is 300 s.
const RUNNER_TIMEOUT_MS = 330_000
const RUNNER_FAILED = 'xai_search runner failed'

const handleList = (description: string) => ({
  type: 'array',
  items: { type: 'string', minLength: 1, description: 'X handle, with or without a leading @' },
  minItems: 1,
  maxItems: 20,
  uniqueItems: true,
  description,
})

const inputSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['query'],
  properties: {
    query: { type: 'string', minLength: 1, description: 'What to search for on X (Twitter)' },
    model: { type: 'string', minLength: 1, description: 'xAI model override; uses the configured model when omitted' },
    from_date: { type: 'string', description: 'Inclusive start date, YYYY-MM-DD, from 00:00 UTC' },
    to_date: {
      type: 'string',
      description:
        'Exclusive end date, YYYY-MM-DD, UTC. Posts on this date are not included; to search one day, set to_date to the following day.',
    },
    allowed_x_handles: handleList('Only consider posts from these X handles (maximum 20)'),
    excluded_x_handles: handleList('Exclude posts from these X handles (maximum 20)'),
  },
}

const PARAM_NAMES = Object.keys(inputSchema.properties)

function failed(text: string) {
  return { isError: true as const, result: text, text }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.tool.register({
      name: TOOL_NAME,
      description:
        "Search live X (Twitter) posts with xAI's x_search over Pi's SuperGrok/X Premium sign-in. Use it for current posts, discussions, reactions, profiles, or threads on X. Supports date ranges (to_date is exclusive) and handle filters; each search is capped at 4 xAI turns and 3000 output tokens.",
      inputSchema,
    })

    return next(e)
  })

  on('tool.call', { tool: 'mcp__xai-search__xai_search' }, async ($, e) => {
    const call = e as unknown as Record<string, unknown>
    const params = Object.fromEntries(PARAM_NAMES.filter(name => call[name] !== undefined).map(name => [name, call[name]]))

    const run = await $.process
      .run([NODE, `${$.plugin.root}/${RUNNER}`, '--params', '/dev/stdin'], {
        stdin: JSON.stringify(params),
        timeoutMs: RUNNER_TIMEOUT_MS,
      })
      .catch(() => undefined)
    if (!run) return failed(RUNNER_FAILED)
    // The runner's errors are already sanitized of credential detail.
    if (run.exitCode !== 0) return failed(run.stderr.trim() || RUNNER_FAILED)

    let output: { text?: unknown }
    try {
      output = JSON.parse(run.stdout)
    } catch {
      return failed(RUNNER_FAILED)
    }
    if (typeof output.text !== 'string') return failed(RUNNER_FAILED)

    return { result: output.text }
  })
}
